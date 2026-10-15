import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { productSlug } from "@/lib/products";
import { getSupabaseAdmin } from "@/lib/supabase";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  parent_id: z.string().uuid().nullable().optional(),
  status: z.enum(["draft", "published", "archived"])
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid category ID." }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid category data." }, { status: 400 }); }
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the category details.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.parent_id === id) return NextResponse.json({ error: "A category cannot be its own parent." }, { status: 400 });
  try {
    const { data, error } = await getSupabaseAdmin().from("categories").update({
      ...parsed.data,
      parent_id: parsed.data.parent_id || null,
      slug: productSlug(parsed.data.name),
      updated_at: new Date().toISOString()
    }).eq("id", id).select().maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Unable to update category. Confirm its name is unique." }, { status: 400 });
    return NextResponse.json({ category: data });
  } catch (error) {
    console.error("Category update failed:", error);
    return NextResponse.json({ error: "Unable to update category." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid category ID." }, { status: 400 });
  try {
    const { data, error } = await getSupabaseAdmin().from("categories").delete().eq("id", id).select("id").maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Unable to remove category." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Category deletion failed:", error);
    return NextResponse.json({ error: "Unable to remove category." }, { status: 500 });
  }
}
