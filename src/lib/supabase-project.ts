function extractJwtProjectRef(token?: string | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = typeof atob === "function"
      ? JSON.parse(atob(base64))
      : JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}

function extractUrlProjectRef(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const hostname = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`).hostname;
    const match = hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

export function hasSupabaseProjectMismatch(rawUrl?: string | null, apiKey?: string | null) {
  const urlRef = extractUrlProjectRef(rawUrl);
  const keyRef = extractJwtProjectRef(apiKey);
  return Boolean(urlRef && keyRef && urlRef !== keyRef);
}

export const SUPABASE_PROJECT_MISMATCH_MESSAGE =
  "Supabase configuration error: the project in NEXT_PUBLIC_SUPABASE_URL does not match the project in NEXT_PUBLIC_SUPABASE_ANON_KEY. Set both values from the same Supabase project, then redeploy.";
