import { NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";
import { enquirySchema } from "@/lib/validation";
import { isWhatsAppCloudConfigured, sendWhatsAppText } from "@/lib/whatsapp-cloud";

type CatalogVariant = {
  id: string;
  name: string;
  unit: string | null;
  pack_size: string | null;
  moq_quantity: number | string | null;
  order_increment: number | string | null;
  active: boolean;
};

type CatalogProduct = {
  id: string;
  name: string;
  status: string;
  active: boolean;
  unit: string | null;
  pack_size: string | null;
  moq_quantity: number | string | null;
  order_increment: number | string | null;
  variants: CatalogVariant[];
};

type EnquirySaveResult = {
  id: string;
  reference: string;
  status: string;
  created: boolean;
};

type RateWindow = {
  count: number;
  resetsAt: number;
};

const rateWindows = new Map<string, RateWindow>();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS = 10;

function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean).at(-1)
    || request.headers.get("x-real-ip")
    || "unknown";
}

function allowSubmission(request: Request, now: number) {
  if (rateWindows.size > 2000) {
    for (const [key, value] of rateWindows) {
      if (value.resetsAt <= now) rateWindows.delete(key);
    }
  }

  const key = clientAddress(request);
  const current = rateWindows.get(key);
  const window = !current || current.resetsAt <= now
    ? { count: 0, resetsAt: now + RATE_WINDOW_MS }
    : current;

  if (window.count >= MAX_SUBMISSIONS) return false;
  window.count += 1;
  rateWindows.set(key, window);
  return true;
}

function quantityRule(quantity: number, minimum: number | null, increment: number | null) {
  if (minimum !== null && quantity < minimum) {
    return `Quantity must be at least ${minimum}.`;
  }

  if (increment !== null && minimum !== null) {
    const steps = (quantity - minimum) / increment;
    if (Math.abs(steps - Math.round(steps)) > 1e-8) {
      return `Quantity must increase in steps of ${increment} from the minimum quantity of ${minimum}.`;
    }
  } else if (increment !== null) {
    const steps = quantity / increment;
    if (Math.abs(steps - Math.round(steps)) > 1e-8) {
      return `Quantity must be a multiple of ${increment}.`;
    }
  }

  return null;
}

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 20_000) {
    return NextResponse.json({ error: "Enquiry is too large." }, { status: 413 });
  }

  if (!allowSubmission(request, Date.now())) {
    return NextResponse.json({ error: "Too many enquiries from this connection. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid enquiry data." }, { status: 400 });
  }

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the enquiry details.",
        fieldErrors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const enquiry = parsed.data;
  const productIds = [...new Set(enquiry.items.map((item) => item.product_id))];

  try {
    const publicSupabase = getSupabasePublic();
    const { data: products, error: productsError } = await publicSupabase
      .from("products")
      .select(`
        id, name, status, active, unit, pack_size, moq_quantity, order_increment,
        variants:product_variants(id, name, unit, pack_size, moq_quantity, order_increment, active)
      `)
      .in("id", productIds)
      .eq("status", "published")
      .eq("active", true);

    if (productsError) {
      console.error("Unable to verify enquiry products:", productsError.message);
      return NextResponse.json({ error: "The catalogue is temporarily unavailable. Please try again later." }, { status: 503 });
    }

    const catalog = new Map((products as CatalogProduct[] || []).map((product) => [product.id, product]));
    if (catalog.size !== productIds.length) {
      return NextResponse.json({ error: "One or more selected products are no longer available. Refresh the catalogue and try again." }, { status: 400 });
    }

    const snapshots = [];
    for (const item of enquiry.items) {
      const product = catalog.get(item.product_id)!;
      const variant = item.variant_id
        ? product.variants?.find((candidate) => candidate.id === item.variant_id && candidate.active)
        : null;

      if (item.variant_id && !variant) {
        return NextResponse.json({ error: `The selected option for ${product.name} is no longer available.` }, { status: 400 });
      }

      const minimum = variant?.moq_quantity ?? product.moq_quantity;
      const increment = variant?.order_increment ?? product.order_increment;
      const quantityError = quantityRule(
        item.quantity,
        minimum === null ? null : Number(minimum),
        increment === null ? null : Number(increment)
      );

      if (quantityError) {
        return NextResponse.json({ error: `${product.name}: ${quantityError}` }, { status: 400 });
      }

      snapshots.push({
        product_id: product.id,
        variant_id: variant?.id || "",
        product_name: product.name,
        variant_name: variant?.name || "",
        packaging: variant?.pack_size || product.pack_size || "",
        unit: variant?.unit || product.unit || "",
        quantity: String(item.quantity)
      });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("create_enquiry_with_items", {
      p_enquiry: {
        client_request_id: enquiry.client_request_id,
        customer_id: enquiry.customer_id || "",
        business_name: enquiry.business_name,
        contact_person: enquiry.contact_person,
        phone: enquiry.phone,
        email: enquiry.email || "",
        city: enquiry.city,
        state: enquiry.state,
        pin_code: enquiry.pin_code,
        gstin: enquiry.gstin || "",
        delivery_requirements: enquiry.delivery_requirements || "",
        message: enquiry.message || "",
        customer_notes: enquiry.customer_notes || ""
      },
      p_items: snapshots
    });

    if (error || !data) {
      console.error("Unable to save wholesale enquiry:", error?.message || "No result returned.");
      const migrationRequired = error?.message?.includes("create_enquiry_with_items");
      return NextResponse.json(
        {
          error: migrationRequired
            ? "The wholesale database migration has not been applied yet."
            : "Unable to save the enquiry. Please retry."
        },
        { status: migrationRequired ? 503 : 500 }
      );
    }

    const saved = data as EnquirySaveResult;
    let notificationWarning: string | null = null;
    if (saved.created && isWhatsAppCloudConfigured()) {
      const itemLines = snapshots.map((item) =>
        `- ${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ""}: ${item.quantity}${item.unit ? ` ${item.unit}` : ""}`
      );
      const notifyTo = process.env.WHATSAPP_NOTIFY_TO || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
      if (notifyTo) {
        try {
          const notification = await sendWhatsAppText({
            to: notifyTo,
            body: [
              `New wholesale enquiry ${saved.reference}`,
              `Business: ${enquiry.business_name}`,
              `Contact: ${enquiry.contact_person}`,
              `Phone: ${enquiry.phone}`,
              `Location: ${enquiry.city}, ${enquiry.state} ${enquiry.pin_code}`,
              ...itemLines,
              enquiry.message ? `Note: ${enquiry.message}` : ""
            ].filter(Boolean).join("\n")
          });
          if (!notification.ok && !notification.skipped) {
            console.error("WhatsApp enquiry notification failed:", notification.error);
            notificationWarning = "Enquiry saved, but the business notification could not be sent.";
          }
        } catch (notificationError) {
          console.error("WhatsApp enquiry notification failed:", notificationError);
          notificationWarning = "Enquiry saved, but the business notification could not be sent.";
        }
      }
    }

    return NextResponse.json(
      { enquiry: saved, duplicate: !saved.created, notificationWarning },
      { status: saved.created ? 201 : 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Wholesale enquiry submission failed:", error);
    return NextResponse.json({ error: "Unable to save the enquiry. Please retry." }, { status: 500 });
  }
}
