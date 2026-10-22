"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useLanguage } from "@/context/language-context";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t("passwordReset.emailRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowser();
      const origin = typeof window !== "undefined" ? window.location.origin : "https://bulk-supiler.vercel.app";
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/auth/callback?next=/reset-password`
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("passwordReset.resetFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10">
        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t("passwordReset.back")}
          </Link>
          <h1 className="mt-4 text-2xl font-black text-foreground">
            {t("passwordReset.forgotTitle")}
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("passwordReset.forgotDescription")}
          </p>
        </div>

        {error ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-medium text-destructive">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-fresh/20 bg-fresh/10 p-5 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-fresh" />
            <h2 className="mt-2 text-sm font-bold text-foreground">{t("passwordReset.recoverySent")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("passwordReset.checkInbox")} <span className="font-semibold text-foreground">{email}</span> {t("passwordReset.recoveryInstructions")}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl">
              <Link href="/login">{t("passwordReset.returnSignIn")}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground">
                {t("passwordReset.registeredEmail")}
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="storeowner@gmail.com"
                  className="h-11 rounded-xl pl-10 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              variant="gold"
              className="w-full h-11 justify-center rounded-xl font-bold shadow-xs"
            >
              {submitting ? t("passwordReset.sending") : t("passwordReset.sendLink")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
