import { createClient } from "@supabase/supabase-js";
import { hasSupabaseProjectMismatch, SUPABASE_PROJECT_MISMATCH_MESSAGE } from "@/lib/supabase-project";

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

export function normalizeSupabaseUrl(rawUrl?: string, fallbackToken?: string): string | null {
  const trimmed = rawUrl?.trim();
  if (trimmed && /^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  }

  if (trimmed && /^[a-z0-9]{20}$/i.test(trimmed)) {
    return `https://${trimmed}.supabase.co`;
  }

  const ref = extractJwtProjectRef(
    fallbackToken ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  if (ref) {
    return `https://${ref}.supabase.co`;
  }

  return null;
}

function extractJwtProjectRef(token?: string) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(json);
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}

export function isSupabasePublicConfigured() {
  const url = normalizeSupabaseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key && !hasSupabaseProjectMismatch(url, key));
}

export function getSupabasePublic() {
  const url = normalizeSupabaseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env and restart Next.js.");
  }
  if (hasSupabaseProjectMismatch(url, key)) throw new Error(SUPABASE_PROJECT_MISMATCH_MESSAGE);

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function getSupabaseAdmin() {
  const url = normalizeSupabaseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    const missing = [
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : "",
      !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : ""
    ].filter(Boolean);

    throw new Error(`Missing Supabase environment variable(s): ${missing.join(", ")}. Add them to .env and restart Next.js.`);
  }
  if (hasSupabaseProjectMismatch(url, serviceRoleKey)) throw new Error("Supabase configuration error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY belong to different projects.");

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
