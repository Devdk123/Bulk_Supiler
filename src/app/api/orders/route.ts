import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { orderSchema } from "@/lib/validation";
import { isWhatsAppCloudConfigured, sendWhatsAppText } from "@/lib/whatsapp-cloud";

function formatSupabaseError(message: string) {
  if (message.toLowerCase().includes("could not find the table")) {
    return "Supabase orders table is missing. Run supabase/run-this-in-sql-editor.sql in the Supabase SQL Editor, then try again.";
  }

  return message;
}

function isAdminRequest(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  const provided = request.headers.get("x-admin-password");
  return Boolean(expected && provided && expected === provided);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please check the form details.",
          fieldErrors: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("orders")
      .insert({
        ...parsed.data,
        message: parsed.data.message || null,
        status: "New"
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: formatSupabaseError(error.message) }, { status: 500 });
    }

    let whatsappCloud = null;

    if (isWhatsAppCloudConfigured()) {
      const orderMessage = [
        "New bulk order enquiry",
        `Name: ${parsed.data.customer_name}`,
        `Phone: ${parsed.data.phone}`,
        `WhatsApp: ${parsed.data.whatsapp}`,
        `Product: ${parsed.data.product_name}`,
        `Quantity: ${parsed.data.quantity}`,
        `City: ${parsed.data.city}`,
        `Payment: ${parsed.data.payment_method}`,
        `Address: ${parsed.data.address}`,
        parsed.data.message ? `Message: ${parsed.data.message}` : ""
      ]
        .filter(Boolean)
        .join("\n");

      whatsappCloud = await sendWhatsAppText({
        to: process.env.WHATSAPP_NOTIFY_TO || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919839450586",
        body: orderMessage
      });
    }

    return NextResponse.json({ order: data, whatsappCloud }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const supabase = getSupabaseAdmin();
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });

    if (status && status !== "All") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,phone.ilike.%${search}%,product_name.ilike.%${search}%,city.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: formatSupabaseError(error.message) }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch orders.";
    return NextResponse.json({
      orders: [],
      warning: `Supabase is not reachable right now (${message}). Orders will appear after the database connection works.`
    });
  }
}
