import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { productSlug } from "@/lib/products";
import { getSupabaseAdmin } from "@/lib/supabase";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  parent_id: z.string().uuid().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft")
});

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { data, error } = await getSupabaseAdmin().from("categories").select("*").order("name");
    if (error) return NextResponse.json({ error: "Unable to load categories." }, { status: 500 });
    return NextResponse.json({ categories: data || [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin category list failed:", error);
    return NextResponse.json({ error: "Unable to load categories." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid category data." }, { status: 400 }); }
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the category details.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    const { data, error } = await getSupabaseAdmin().from("categories").insert({
      ...parsed.data,
      parent_id: parsed.data.parent_id || null,
      slug: productSlug(parsed.data.name)
    }).select().single();
    if (error) return NextResponse.json({ error: "Unable to create category. Check that its name is unique." }, { status: 400 });
    return NextResponse.json({ category: data }, { status: 201 });
  } catch (error) {
    console.error("Category creation failed:", error);
    return NextResponse.json({ error: "Unable to create category." }, { status: 500 });
  }
}
