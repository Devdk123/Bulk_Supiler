export const assistantLanguages = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी" },
  { code: "bn", label: "Bengali", nativeName: "বাংলা" },
  { code: "mr", label: "Marathi", nativeName: "मराठी" },
  { code: "te", label: "Telugu", nativeName: "తెలుగు" },
  { code: "ta", label: "Tamil", nativeName: "தமிழ்" },
  { code: "gu", label: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "ur", label: "Urdu", nativeName: "اردو" },
  { code: "kn", label: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "or", label: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "ml", label: "Malayalam", nativeName: "മലയാളം" },
  { code: "pa", label: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "as", label: "Assamese", nativeName: "অসমীয়া" },
  { code: "mai", label: "Maithili", nativeName: "मैथिली" },
  { code: "sa", label: "Sanskrit", nativeName: "संस्कृतम्" },
  { code: "ks", label: "Kashmiri", nativeName: "कॉशुर" },
  { code: "kok", label: "Konkani", nativeName: "कोंकणी" },
  { code: "mni", label: "Manipuri", nativeName: "মৈতৈলোন্" },
  { code: "ne", label: "Nepali", nativeName: "नेपाली" },
  { code: "sd", label: "Sindhi", nativeName: "سنڌي" },
  { code: "doi", label: "Dogri", nativeName: "डोगरी" },
  { code: "sat", label: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ" }
] as const;

export type AssistantLanguage = (typeof assistantLanguages)[number]["code"];

export function getAssistantLanguageName(code: AssistantLanguage) {
  return assistantLanguages.find((language) => language.code === code)?.label ?? "English";
}
