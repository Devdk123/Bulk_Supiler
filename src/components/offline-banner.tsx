"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/language-context";

export function OfflineBanner() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const offline = () => { setOnline(false); setVisible(true); };
    const onlineAgain = () => { setOnline(true); setVisible(true); window.setTimeout(() => setVisible(false), 4500); };
    window.addEventListener("offline", offline);
    window.addEventListener("online", onlineAgain);
    return () => {
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", onlineAgain);
    };
  }, []);

  if (!visible) return null;
  return (
    <div role="status" className={`fixed inset-x-0 top-0 z-[90] px-4 py-3 text-center text-sm font-semibold text-white shadow-lg ${online ? "bg-fresh" : "bg-[#8b3d2c]"}`}>
      {online ? t("pwa.online") : t("pwa.offline")}
    </div>
  );
}
