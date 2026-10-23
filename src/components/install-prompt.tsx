"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { getInstallInstructionsKey } from "@/lib/pwa-install";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_KEY = "gayatristore-install-dismissed";

export function InstallPrompt({ showLabel = false }: { showLabel?: boolean }) {
  const { t } = useLanguage();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [instructionsKey, setInstructionsKey] = useState<ReturnType<typeof getInstallInstructionsKey>>("manualInstructions");
  const [show, setShow] = useState(false);
  const [instructions, setInstructions] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    if (isStandalone || localStorage.getItem(DISMISSED_KEY) === "yes") return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    // Keep a small, user-initiated install action available even where the
    // browser has no programmatic prompt (including iOS Safari).
    queueMicrotask(() => setShow(true));
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function install() {
    if (!installEvent) {
      setInstructionsKey(getInstallInstructionsKey(navigator.userAgent));
      setInstructions(true);
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === "accepted") setShow(false);
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "yes");
    setShow(false);
    setInstructions(false);
  }

  if (!show) return null;
  return (
    <>
      <button type="button" onClick={() => void install()} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-fresh/30 bg-card px-2.5 text-xs font-bold text-fresh hover:bg-fresh/5" aria-label={t("pwa.install")}>
        <Download className="h-4 w-4" />
        <span className={showLabel ? "" : "hidden 2xl:inline"}>{t("pwa.install")}</span>
      </button>
      {instructions ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setInstructions(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="install-title" className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <h2 id="install-title" className="text-lg font-extrabold text-primary">{t("pwa.installTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`pwa.${instructionsKey}`)}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setInstructions(false)} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-muted-foreground">{t("common.close")}</button>
              <button type="button" onClick={dismiss} className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">{t("pwa.dismiss")}</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
