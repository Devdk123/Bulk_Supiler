"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useLanguage } from "@/context/language-context";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t("passwordReset.passwordLength"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordReset.mismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error: updateError } = await supabase.auth.updateUser({
        password
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("passwordReset.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10">
        <div className="text-center">
          <h1 className="text-2xl font-black text-foreground">
            {t("passwordReset.resetTitle")}
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("passwordReset.resetDescription")}
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
            <h2 className="mt-2 text-sm font-bold text-foreground">{t("passwordReset.updated")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("passwordReset.updatedDescription")}
            </p>
            <Button asChild variant="gold" size="sm" className="mt-4 rounded-xl">
              <Link href="/login">{t("passwordReset.signInNow")}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground">
                {t("passwordReset.newPassword")}
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordReset.atLeastSix")}
                  className="h-11 rounded-xl pl-10 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground">
                {t("passwordReset.confirmPassword")}
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("passwordReset.reenter")}
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
              {submitting ? t("passwordReset.updating") : t("passwordReset.updatePassword")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
