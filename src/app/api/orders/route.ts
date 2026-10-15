import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

function formatSupabaseError(message: string) {
  if (message.toLowerCase().includes("could not find the table")) {
    return "Supabase orders table is missing. Run supabase/run-this-in-sql-editor.sql in the Supabase SQL Editor, then try again.";
  }

  return message;
}

export async function POST() {
  return NextResponse.json(
    { error: "Direct orders are no longer accepted. Submit a wholesale quotation request instead." },
    { status: 410 }
  );
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const allowedStatuses = ["New", "Contacted", "Confirmed", "Delivered", "Cancelled"];
    const search = (searchParams.get("search") || "")
      .slice(0, 80)
      .replace(/[%,.*()\\"]/g, " ")
      .trim();
    const requestedLimit = Number(searchParams.get("limit") || 50);
    const requestedOffset = Number(searchParams.get("offset") || 0);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
    const offset = Number.isInteger(requestedOffset) ? Math.max(requestedOffset, 0) : 0;
    const supabase = getSupabaseAdmin();
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });

    if (status && allowedStatuses.includes(status)) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,phone.ilike.%${search}%,product_name.ilike.%${search}%,city.ilike.%${search}%`
      );
    }

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: formatSupabaseError(error.message) }, { status: 500 });
    }

    const orders = data || [];
    return NextResponse.json({ orders, hasMore: orders.length === limit }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch orders.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
