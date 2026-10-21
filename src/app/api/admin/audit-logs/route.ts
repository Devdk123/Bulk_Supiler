import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: logs, error } = await supabase
      .from("admin_audit_logs")
      .select("id, admin_id, action, entity_type, entity_id, details, ip_address, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Unable to load audit logs:", error.message);
      return NextResponse.json({ logs: [] });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (err) {
    console.error("Audit log error:", err);
    return NextResponse.json({ logs: [] });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("admin_audit_logs").insert({
      admin_id: body.admin_id || null,
      action: body.action || "general_update",
      entity_type: body.entity_type || "system",
      entity_id: body.entity_id || null,
      details: body.details || {},
      ip_address: ip
    });

    if (error) {
      console.warn("Could not insert audit log:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Invalid log entry" }, { status: 400 });
  }
}
