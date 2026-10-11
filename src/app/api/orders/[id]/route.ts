import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { orderStatuses } from "@/lib/validation";

function formatSupabaseError(message: string) {
  if (message.toLowerCase().includes("could not find the table")) {
    return "Supabase orders table is missing. Run supabase/run-this-in-sql-editor.sql in the Supabase SQL Editor, then try again.";
  }

  return message;
}

function isAdminRequest(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  const provided = request.headers.get("x-admin-password");
  return Boolean(expected && provided && expected === provided);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const status = body.status;

    if (!orderStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select().single();

    if (error) {
      return NextResponse.json({ error: formatSupabaseError(error.message) }, { status: 500 });
    }

    return NextResponse.json({ order: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
