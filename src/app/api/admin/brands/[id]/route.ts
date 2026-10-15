import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { productSlug } from "@/lib/products";
import { getSupabaseAdmin } from "@/lib/supabase";

const brandSchema = z.object({
  name: z.string().trim().min(2).max(100),
  logo_url: z.string().trim().url().nullable().optional(),
  status: z.enum(["draft", "published", "archived"])
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid brand ID." }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid brand data." }, { status: 400 }); }
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the brand details.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    const { data, error } = await getSupabaseAdmin().from("brands").update({
      ...parsed.data,
      logo_url: parsed.data.logo_url || null,
      slug: productSlug(parsed.data.name),
      updated_at: new Date().toISOString()
    }).eq("id", id).select().maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Unable to update brand. Confirm the name is unique." }, { status: 400 });
    return NextResponse.json({ brand: data });
  } catch (error) {
    console.error("Brand update failed:", error);
    return NextResponse.json({ error: "Unable to update brand." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid brand ID." }, { status: 400 });
  try {
    const { data, error } = await getSupabaseAdmin().from("brands").delete().eq("id", id).select("id").maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Unable to remove brand." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Brand deletion failed:", error);
    return NextResponse.json({ error: "Unable to remove brand." }, { status: 500 });
  }
}
