import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { productImageUrl, products as defaultProducts, productSlug } from "@/lib/products";
import { productSchema } from "@/lib/validation";

function isAdminRequest(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  const provided = request.headers.get("x-admin-password");
  return Boolean(expected && provided && expected === provided);
}

function formatSupabaseError(message: string) {
  if (message.toLowerCase().includes("could not find the table")) {
    return "Supabase products table is missing. Run supabase/run-this-in-sql-editor.sql in the Supabase SQL Editor, then try again.";
  }

  return message;
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: formatSupabaseError(error.message) }, { status: 500 });
    }

    const existingSlugs = new Set((data || []).map((product) => product.slug));
    const missingProducts = defaultProducts.filter((product) => !existingSlugs.has(product.slug));

    if (missingProducts.length) {
      const { error: insertError } = await supabase.from("products").insert(
        missingProducts.map((product) => ({
          name: product.name,
          slug: product.slug,
          price: product.price,
          moq: product.moq,
          quality: product.quality,
          packing: product.packing,
          image_url: product.imageUrl,
          active: true
        }))
      );

      if (insertError) {
        return NextResponse.json({ error: formatSupabaseError(insertError.message) }, { status: 500 });
      }

      const { data: refreshed, error: refreshError } = await supabase.from("products").select("*").order("created_at", { ascending: false });

      if (refreshError) {
        return NextResponse.json({ error: formatSupabaseError(refreshError.message) }, { status: 500 });
      }

      return NextResponse.json({ products: refreshed || [] });
    }

    return NextResponse.json({ products: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch products.";
    const fallbackProducts = defaultProducts.map((product) => ({
      id: product.slug,
      name: product.name,
      slug: product.slug,
      price: product.price,
      moq: product.moq,
      quality: product.quality,
      packing: product.packing,
      image_url: product.imageUrl,
      active: true,
      created_at: new Date().toISOString()
    }));

    return NextResponse.json({
      products: fallbackProducts,
      warning: `Supabase is not reachable right now (${message}). Showing fallback products.`
    });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please check the product details.",
          fieldErrors: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const product = parsed.data;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: product.name,
        slug: productSlug(product.name),
        price: product.price,
        moq: product.moq,
        quality: product.quality,
        packing: product.packing,
        image_url: product.imageUrl || productImageUrl(product.name, product.quality),
        active: product.active ?? true
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: formatSupabaseError(error.message) }, { status: 500 });
    }

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
