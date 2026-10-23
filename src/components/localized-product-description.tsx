"use client";

import { useLanguage } from "@/context/language-context";
import { categoryTranslationKey } from "@/lib/category-labels";

export function LocalizedProductDescription({ english, hindi }: { english: string | null; hindi: string | null }) {
  const { language } = useLanguage();
  const text = language === "hi" ? hindi?.trim() || english : english || hindi;
  if (!text) return null;
  return <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">{text}</p>;
}

export function LocalizedCatalogueLabel({ english, hindi }: { english: string | null; hindi: string | null }) {
  const { language, t } = useLanguage();
  const translationKey = categoryTranslationKey(english);
  const fallback = translationKey ? t(translationKey) : english;
  return <>{language === "hi" ? hindi?.trim() || fallback || english : english || hindi}</>;
}
