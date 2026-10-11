import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { productImageUrl, productSlug } from "@/lib/products";
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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = productSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please check the product details.",
          fieldErrors: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const updates: Record<string, string | boolean | null> = {};

    if (parsed.data.name !== undefined) {
      updates.name = parsed.data.name;
      updates.slug = productSlug(parsed.data.name);
    }

    if (parsed.data.price !== undefined) updates.price = parsed.data.price;
    if (parsed.data.moq !== undefined) updates.moq = parsed.data.moq;
    if (parsed.data.quality !== undefined) updates.quality = parsed.data.quality;
    if (parsed.data.packing !== undefined) updates.packing = parsed.data.packing;
    if (parsed.data.active !== undefined) updates.active = parsed.data.active;

    if (parsed.data.imageUrl !== undefined) {
      updates.image_url = parsed.data.imageUrl || null;
    } else if (parsed.data.name && parsed.data.quality) {
      updates.image_url = productImageUrl(parsed.data.name, parsed.data.quality);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single();

    if (error) {
      return NextResponse.json({ error: formatSupabaseError(error.message) }, { status: 500 });
    }

    return NextResponse.json({ product: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: formatSupabaseError(error.message) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
