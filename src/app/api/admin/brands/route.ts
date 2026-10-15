import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { productSlug } from "@/lib/products";

const brandSchema = z.object({
  name: z.string().trim().min(2).max(100),
  logo_url: z.string().trim().url().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft")
});

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { data, error } = await getSupabaseAdmin().from("brands").select("*").order("name");
    if (error) return NextResponse.json({ error: "Unable to load brands." }, { status: 500 });
    return NextResponse.json({ brands: data || [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin brand list failed:", error);
    return NextResponse.json({ error: "Unable to load brands." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid brand data." }, { status: 400 }); }
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the brand details.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    const { data, error } = await getSupabaseAdmin().from("brands").insert({
      ...parsed.data,
      logo_url: parsed.data.logo_url || null,
      slug: productSlug(parsed.data.name)
    }).select().single();
    if (error) return NextResponse.json({ error: "Unable to create brand. Check that its name is unique." }, { status: 400 });
    return NextResponse.json({ brand: data }, { status: 201 });
  } catch (error) {
    console.error("Brand creation failed:", error);
    return NextResponse.json({ error: "Unable to create brand." }, { status: 500 });
  }
}
