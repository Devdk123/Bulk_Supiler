export const assistantLanguages = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी" }
] as const;

export type AssistantLanguage = (typeof assistantLanguages)[number]["code"];

export function getAssistantLanguageName(code: AssistantLanguage) {
  return assistantLanguages.find((language) => language.code === code)?.label ?? "English";
}
