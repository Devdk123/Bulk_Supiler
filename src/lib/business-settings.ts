import { cache } from "react";
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

export const getPublicBusinessSettings = cache(async function getPublicBusinessSettings(): Promise<BusinessSettings> {
  const settings: BusinessSettings = {
    contact_phone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    contact_email: "",
    business_address: "",
    business_hours: "",
    delivery_coverage: "",
    databaseAvailable: false
  };

  if (!isSupabasePublicConfigured()) {
    console.warn("Supabase public credentials are not configured; using fallback business settings.");
    return settings;
  }

  let result;
  try {
    result = await getSupabasePublic()
      .from("business_settings")
      .select("key, value")
      .eq("is_public", true)
      .in("key", publicKeys);
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }

    console.error("Unable to reach Supabase while loading public business settings.", error);
    return settings;
  }

  if (result.error) {
    console.error("Unable to load public business settings from Supabase.", result.error);
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
});
