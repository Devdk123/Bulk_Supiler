"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function ConfirmAccountPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your account…");

  useEffect(() => {
    let active = true;
    const currentUrl = new URL(window.location.href);
    const code = currentUrl.searchParams.get("code");
    const requestedNext = currentUrl.searchParams.get("next") || "/account";
    const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/account";

    async function confirm() {
      if (!code) {
        setMessage("This confirmation link is missing its code. Request a new email and try again.");
        return;
      }

      const { error } = await getSupabaseBrowser().auth.exchangeCodeForSession(code);
      if (!active) return;
      if (error) {
        setMessage("We couldn't confirm this link. It may have expired; request a new confirmation email and try again.");
        return;
      }
      router.replace(next);
    }

    void confirm().catch(() => {
      if (active) setMessage("We couldn't reach the account service. Check your connection and try again.");
    });

    return () => { active = false; };
  }, [router]);

  return (
    <main className="container-page flex min-h-[50vh] items-center justify-center py-16">
      <p role="status" className="max-w-md rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {message}
      </p>
    </main>
  );
}
