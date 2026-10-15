import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { enquiryStatuses } from "@/lib/validation";

const updateSchema = z.object({
  status: z.enum(enquiryStatuses).optional(),
  internal_notes: z.string().trim().max(5000).nullable().optional()
}).refine((data) => data.status !== undefined || data.internal_notes !== undefined);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid enquiry ID." }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid enquiry update." }, { status: 400 }); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid status or notes." }, { status: 400 });

  try {
    const updates = { ...parsed.data, updated_at: new Date().toISOString() };
    const { data, error } = await getSupabaseAdmin()
      .from("enquiries")
      .update(updates)
      .eq("id", id)
      .select("id, reference, status, internal_notes, updated_at")
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Unable to update enquiry." }, { status: 404 });
    return NextResponse.json({ enquiry: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin enquiry update failed:", error);
    return NextResponse.json({ error: "Unable to update enquiry." }, { status: 500 });
  }
}
