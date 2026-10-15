import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["draft", "published", "archived"])
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid product ID." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid product status." }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid product status." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: current, error: currentError } = await supabase
      .from("products")
      .select("id, brand_id, category_id")
      .eq("id", id)
      .maybeSingle();
    if (currentError || !current) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (parsed.data.status === "published") {
      if (current.brand_id) {
        const { data } = await supabase.from("brands").select("status").eq("id", current.brand_id).maybeSingle();
        if (data?.status !== "published") {
          return NextResponse.json({ error: "Publish the selected brand before publishing this product." }, { status: 400 });
        }
      }
      if (current.category_id) {
        const { data } = await supabase.from("categories").select("status").eq("id", current.category_id).maybeSingle();
        if (data?.status !== "published") {
          return NextResponse.json({ error: "Publish the selected category before publishing this product." }, { status: 400 });
        }
      }
    }

    const { data, error } = await supabase
      .from("products")
      .update({ status: parsed.data.status, active: parsed.data.status === "published", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, status, active")
      .single();
    if (error) {
      return NextResponse.json({ error: "Unable to update product status." }, { status: 500 });
    }

    return NextResponse.json({ product: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Product status update failed:", error);
    return NextResponse.json({ error: "Unable to update product status." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid product ID." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) return NextResponse.json({ ok: true });

    const { data, error: archiveError } = await supabase
      .from("products")
      .update({ status: "archived", active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (archiveError || !data) {
      console.error("Product delete/archive failed:", error.message, archiveError?.message);
      return NextResponse.json({ error: "Product could not be removed or archived." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, archived: true });
  } catch (error) {
    console.error("Product delete failed:", error);
    return NextResponse.json({ error: "Unable to remove product." }, { status: 500 });
  }
}
