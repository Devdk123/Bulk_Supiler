import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const allowedSettings = [
  "contact_phone",
  "whatsapp_number",
  "contact_email",
  "business_address",
  "business_hours",
  "delivery_coverage"
] as const;

const settingsSchema = z.object({
  contact_phone: z.string().trim().max(20).optional(),
  whatsapp_number: z.string().trim().max(20).optional(),
  contact_email: z.string().trim().email().max(254).or(z.literal("")).optional(),
  business_address: z.string().trim().max(500).optional(),
  business_hours: z.string().trim().max(200).optional(),
  delivery_coverage: z.string().trim().max(500).optional()
}).refine((settings) => Object.keys(settings).length > 0);

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { data, error } = await getSupabaseAdmin().from("business_settings").select("key, value").in("key", allowedSettings);
    if (error) return NextResponse.json({ error: "Unable to load business settings." }, { status: 500 });
    return NextResponse.json({ settings: Object.fromEntries((data || []).map((row) => [row.key, row.value])) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin settings load failed:", error);
    return NextResponse.json({ error: "Unable to load business settings." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid settings." }, { status: 400 }); }
  if (!body || typeof body !== "object" || !("settings" in body)) return NextResponse.json({ error: "Settings are required." }, { status: 400 });
  const parsed = settingsSchema.safeParse(body.settings);
  if (!parsed.success) return NextResponse.json({ error: "Check the business settings.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });

  for (const key of ["contact_phone", "whatsapp_number"] as const) {
    const value = parsed.data[key];
    if (value && !/^\+?[1-9]\d{9,14}$/.test(value.replace(/[\s()-]/g, ""))) {
      return NextResponse.json({ error: `${key.replace("_", " ")} must be a valid phone number with country code.` }, { status: 400 });
    }
  }

  try {
    const rows = Object.entries(parsed.data).map(([key, value]) => ({
      key,
      value: value || "",
      is_public: true,
      updated_at: new Date().toISOString()
    }));
    const { error } = await getSupabaseAdmin().from("business_settings").upsert(rows, { onConflict: "key" });
    if (error) {
      console.error("Admin settings save failed:", error.message);
      return NextResponse.json({ error: "Unable to save business settings." }, { status: 500 });
    }
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Admin settings save failed:", error);
    return NextResponse.json({ error: "Unable to save business settings." }, { status: 500 });
  }
}
