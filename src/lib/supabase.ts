import { createClient } from "@supabase/supabase-js";

export type OrderStatus = "New" | "Contacted" | "Confirmed" | "Delivered" | "Cancelled";

export type Order = {
  id: string;
  customer_name: string;
  phone: string;
  whatsapp: string;
  product_name: string;
  quantity: string;
  address: string;
  city: string;
  payment_method: "UPI" | "Cash" | "Bank Transfer";
  message: string | null;
  status: OrderStatus;
  created_at: string;
};

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    const missing = [
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : "",
      !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : ""
    ].filter(Boolean);

    throw new Error(`Missing Supabase environment variable(s): ${missing.join(", ")}. Add them to .env.local and restart Next.js.`);
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
