import { NextResponse } from "next/server";
import { normalizeSupabaseUrl } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/account";

  if (code) {
    const url = normalizeSupabaseUrl(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (url && key) {
      try {
        const supabase = createClient(url, key, { auth: { persistSession: false } });
        await supabase.auth.exchangeCodeForSession(code);
      } catch (err) {
        console.error("Auth callback code exchange error:", err);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
