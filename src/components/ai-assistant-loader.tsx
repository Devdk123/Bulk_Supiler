"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";
import { LoaderCircle, MessageCircle } from "lucide-react";
import { useLanguage } from "@/context/language-context";

const AssistantPanel = dynamic(() => import("@/components/ai-assistant").then((module) => module.AiAssistant), {
  ssr: false,
  loading: () => <div role="status" className="absolute bottom-16 right-0 flex h-64 w-[min(390px,calc(100vw-2rem))] items-center justify-center rounded-3xl border border-border bg-card shadow-2xl"><LoaderCircle className="h-6 w-6 animate-spin text-fresh" aria-label="Loading assistant" /></div>
});

export function AiAssistantLoader() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-50 max-w-[calc(100vw-2rem)] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:right-24">
      {open ? <Suspense fallback={null}><AssistantPanel embedded onClose={() => setOpen(false)} /></Suspense> : null}
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} aria-label={t("assistant.open")} className="flex min-h-14 min-w-0 max-w-full items-center gap-2.5 rounded-full bg-primary px-4 text-primary-foreground shadow-xl ring-1 ring-white/15 transition-all hover:-translate-y-1 hover:bg-fresh focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <MessageCircle className="h-5 w-5 shrink-0" /><span className="min-w-0 truncate text-sm font-bold">{t("assistant.name")}</span>
        </button>
      ) : null}
    </div>
  );
}
