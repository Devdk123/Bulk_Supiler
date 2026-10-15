import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = (searchParams.get("search") || "").trim().slice(0, 100).replace(/[(),%_*\\"]/g, " ");

  try {
    let query = getSupabaseAdmin()
      .from("enquiries")
      .select("*, items:enquiry_items(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(200);

    if (status && status !== "All") query = query.eq("status", status);
    if (search) {
      query = query.or(
        `reference.ilike.%${search}%,business_name.ilike.%${search}%,contact_person.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) {
      console.error("Admin enquiry list failed:", error.message);
      return NextResponse.json({ error: "Unable to load enquiries." }, { status: 500 });
    }
    return NextResponse.json(
      { enquiries: data || [], total: count || 0, limit: 200 },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Admin enquiry list failed:", error);
    return NextResponse.json({ error: "Unable to load enquiries." }, { status: 500 });
  }
}
