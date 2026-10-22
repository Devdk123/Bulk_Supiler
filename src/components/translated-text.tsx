"use client";

import { useLanguage } from "@/context/language-context";

export function TranslatedText({ id, fallback, className }: { id: string; fallback?: string; className?: string }) {
  const { t } = useLanguage();
  return <span className={className}>{t(id) || fallback || id}</span>;
}
