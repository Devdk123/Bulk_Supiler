"use client";

import { Languages } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/context/language-context";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" aria-label={t("language")} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 text-xs font-semibold text-foreground hover:bg-secondary">
        <Languages className="h-4 w-4 shrink-0 text-fresh" aria-hidden="true" />
        <span>{compact ? (language === "hi" ? "हि" : "EN") : t("language")}</span>
      </button>
      {open ? (
        <div role="menu" aria-label={t("language")} className="absolute right-0 top-full z-[70] mt-2 grid min-w-32 gap-1 rounded-xl border border-border bg-card p-1.5 shadow-xl">
          {(["en", "hi"] as const).map((option) => (
            <button key={option} type="button" role="menuitemradio" aria-checked={language === option} onClick={() => { setLanguage(option); setOpen(false); }} className="min-h-10 rounded-lg px-3 text-left text-sm font-semibold hover:bg-secondary">
              {option === "en" ? t("english") : t("hindi")}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
