import type { NextConfig } from "next";

let supabaseHostname: string | null = null;
try {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (configuredUrl?.startsWith("https://")) supabaseHostname = new URL(configuredUrl).hostname;
} catch {
  supabaseHostname = null;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
      : []
  }
};

export default nextConfig;
