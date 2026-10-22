import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { normalizeSupabaseUrl } from "@/lib/supabase";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (typeof window === "undefined") {
    // Return dummy/fallback client if evaluated during SSR
    const url = normalizeSupabaseUrl(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) || "https://placeholder.supabase.co";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  if (!browserClient) {
    const url = normalizeSupabaseUrl(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (!url || !key) {
      throw new Error(
        "Account registration is unavailable because the Supabase URL or public API key is missing. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then rebuild the site."
      );
    }

    browserClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "gayatristore-auth-token"
      }
    });
  }

  return browserClient;
}
