import { NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const publicClient = getSupabasePublic();
    const { data: { user }, error: userError } = await publicClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    // Fetch enquiries for this customer (by customer_id or by phone/email)
    const { data: enquiries, error: enquiriesError } = await admin
      .from("enquiries")
      .select(`
        id, reference, client_request_id, business_name, contact_person,
        phone, email, city, state, pin_code, delivery_requirements,
        message, customer_notes, status, created_at, updated_at,
        items:enquiry_items(
          id, product_name, variant_name, sku, packaging, unit,
          quantity, quoted_unit_price, line_notes
        )
      `)
      .or(`customer_id.eq.${user.id},email.eq.${user.email}`)
      .order("created_at", { ascending: false });

    if (enquiriesError) {
      console.error("Error loading customer enquiries:", enquiriesError.message);
      return NextResponse.json({ error: "Unable to load enquiries." }, { status: 500 });
    }

    return NextResponse.json({ enquiries: enquiries || [] });
  } catch (err) {
    console.error("Customer enquiries exception:", err);
    return NextResponse.json({ error: "Server error loading enquiries." }, { status: 500 });
  }
}
