import { getSupabasePublic } from "@/lib/supabase";

export type BusinessSettings = {
  contact_phone: string;
  whatsapp_number: string;
  contact_email: string;
  business_address: string;
  business_hours: string;
  delivery_coverage: string;
};

const publicKeys: (keyof BusinessSettings)[] = [
  "contact_phone",
  "whatsapp_number",
  "contact_email",
  "business_address",
  "business_hours",
  "delivery_coverage"
];

export async function getPublicBusinessSettings(): Promise<BusinessSettings> {
  const { data, error } = await getSupabasePublic()
    .from("business_settings")
    .select("key, value")
    .eq("is_public", true)
    .in("key", publicKeys);

  if (error) {
    throw new Error(`Unable to load business settings: ${error.message}`);
  }

  const settings = Object.fromEntries(publicKeys.map((key) => [key, ""])) as BusinessSettings;
  settings.contact_phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  settings.whatsapp_number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  for (const row of data || []) {
    const key = row.key as keyof BusinessSettings;
    if (publicKeys.includes(key)) {
      settings[key] = typeof row.value === "string" ? row.value : "";
    }
  }
  return settings;
}
