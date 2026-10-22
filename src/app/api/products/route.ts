import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { productSlug } from "@/lib/products";
import { productSchema } from "@/lib/validation";

const productDetails = `
  *,
  brand:brands(id, name),
  category:categories(id, name),
  images:product_images(id, image_url, alt_text, sort_order),
  variants:product_variants(*),
  price_tiers:product_price_tiers(*)
`;

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("products").select(productDetails).order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data || [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin product list failed:", error);
    return NextResponse.json({ error: "Unable to load products." }, { status: 500 });
  }
}

async function saveProduct(request: Request, productId?: string) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid product data." }, { status: 400 });
  }

  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the product details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const product = parsed.data;

    if (product.brand_id) {
      const { data, error } = await supabase.from("brands").select("id").eq("id", product.brand_id).maybeSingle();
      if (error || !data) return NextResponse.json({ error: "Select a valid brand." }, { status: 400 });
    }

    if (product.category_id) {
      const { data, error } = await supabase.from("categories").select("id").eq("id", product.category_id).maybeSingle();
      if (error || !data) return NextResponse.json({ error: "Select a valid category." }, { status: 400 });
    }

    const imageUrl = product.image_url || product.images[0]?.image_url || null;
    const productPayload = {
      ...product,
      id: productId || null,
      slug: productSlug(product.name),
      image_url: imageUrl
    };
    const { data, error } = await supabase.rpc("save_product_with_details", {
      p_product: productPayload,
      p_variants: product.variants,
      p_images: product.images.map((image, index) => ({ ...image, sort_order: index })),
      p_price_tiers: product.price_tiers
    });

    if (error || !data) {
      console.error("Admin product save failed:", error?.message || "No product ID returned.");
      return NextResponse.json(
        { error: error?.message?.includes("save_product_with_details")
          ? "The wholesale database migration has not been applied yet."
          : "Unable to save product. Check the SKU, brand, category and product options." },
        { status: error?.message?.includes("save_product_with_details") ? 503 : 400 }
      );
    }

    const localizedFieldsSubmitted = typeof body === "object" && body !== null && (
      Object.prototype.hasOwnProperty.call(body, "short_description_hi")
      || Object.prototype.hasOwnProperty.call(body, "description_hi")
    );
    if (localizedFieldsSubmitted) {
      const { error: localizedError } = await supabase.from("products").update({
        short_description_hi: product.short_description_hi?.trim() || null,
        description_hi: product.description_hi?.trim() || null
      }).eq("id", data);
      if (localizedError) {
        const hasHindiContent = Boolean(product.short_description_hi?.trim() || product.description_hi?.trim());
        const missingMigration = /short_description_hi|description_hi|column/i.test(localizedError.message);
        if (hasHindiContent || !missingMigration) {
          console.error("Hindi product descriptions could not be saved:", localizedError.message);
          return NextResponse.json({ error: missingMigration
            ? "Apply the localized catalogue migration before saving Hindi descriptions."
            : "Product saved, but its Hindi descriptions could not be saved." }, { status: 503 });
        }
      }
    }

    const { data: savedProduct, error: fetchError } = await supabase
      .from("products")
      .select(productDetails)
      .eq("id", data)
      .single();

    if (fetchError) {
      console.error("Saved product could not be reloaded:", fetchError.message);
      return NextResponse.json({ error: "Product was saved, but its updated details could not be loaded. Refresh the admin page." }, { status: 500 });
    }

    return NextResponse.json({ product: savedProduct }, { status: productId ? 200 : 201 });
  } catch (error) {
    console.error("Admin product operation failed:", error);
    return NextResponse.json({ error: "Unable to save product." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return saveProduct(request);
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "A valid product ID is required." }, { status: 400 });
  }

  return saveProduct(request, id);
}
