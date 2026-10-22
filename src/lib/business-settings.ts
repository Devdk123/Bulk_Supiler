import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getSupabasePublic, isSupabasePublicConfigured } from "@/lib/supabase";

export type BusinessSettings = {
  contact_phone: string;
  whatsapp_number: string;
  contact_email: string;
  business_address: string;
  business_hours: string;
  delivery_coverage: string;
  databaseAvailable: boolean;
};

const publicKeys = [
  "contact_phone",
  "whatsapp_number",
  "contact_email",
  "business_address",
  "business_hours",
  "delivery_coverage"
] as const;

export function getDefaultBusinessSettings(): BusinessSettings {
  return {
    contact_phone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+918849263377",
    whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+918849263377",
    contact_email: "support@gayatristore.in",
    business_address: "Maya Bazar, Main Wholesale Market",
    business_hours: "Mon – Sat: 9:00 AM – 8:00 PM",
    delivery_coverage: "Maya Bazar and surrounding 50+ km regional trade zone",
    databaseAvailable: false
  };
}

async function fetchSettingsFromSupabase(): Promise<BusinessSettings> {
  const settings = getDefaultBusinessSettings();

  if (!isSupabasePublicConfigured()) {
    return settings;
  }

  try {
    const supabase = getSupabasePublic();
    const queryPromise = supabase
      .from("business_settings")
      .select("key, value")
      .eq("is_public", true)
      .in("key", publicKeys);

    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
      timer = setTimeout(() => {
        resolve({ data: null, error: { message: "Supabase business settings query timed out (2500ms limit)." } });
      }, 2500);
    });

    const result = await Promise.race([
      queryPromise.then((res) => {
        if (timer) clearTimeout(timer);
        return res;
      }),
      timeoutPromise
    ]);

    if (result.error) {
      console.warn("Unable to load public business settings from Supabase, using defaults:", result.error.message);
      return settings;
    }

    settings.databaseAvailable = true;
    for (const row of result.data || []) {
      const key = row.key as (typeof publicKeys)[number];
      if (publicKeys.includes(key)) {
        settings[key] = typeof row.value === "string" ? row.value : "";
      }
    }
    return settings;
  } catch (error) {
    console.warn("Unable to reach Supabase while loading business settings:", error);
    return settings;
  }
}

// Next.js Data Cache: shared across requests and edge navigations
const getCachedPublicBusinessSettings = unstable_cache(
  fetchSettingsFromSupabase,
  ["public-business-settings"],
  {
    revalidate: 300,
    tags: ["business-settings"]
  }
);

// React.cache: deduplicate calls within the same server render pass
export const getPublicBusinessSettings = cache(async function getPublicBusinessSettings(): Promise<BusinessSettings> {
  try {
    return await getCachedPublicBusinessSettings();
  } catch {
    return fetchSettingsFromSupabase();
  }
});
