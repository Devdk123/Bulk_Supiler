"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ArrowRight, LoaderCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";

export default function LoginPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div role="status" className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 text-sm text-muted-foreground">{t("auth.loadingLogin")}</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/account";
  const { signIn, user, role, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (!authLoading && user) {
      if (role === "admin" && redirectTo === "/account") {
        router.push("/about/admin");
      } else {
        router.push(redirectTo);
      }
    }
  }, [user, role, authLoading, redirectTo, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError(t("auth.checkCredentials"));
      return;
    }

    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error === "AUTH_REQUEST_TIMEOUT"
        ? t("auth.requestTimeout")
        : result.error === "AUTH_NETWORK_ERROR"
          ? t("auth.networkError")
          : /Supabase configuration error:.*does not match/i.test(result.error)
          ? t("auth.projectMismatch")
          : result.error);
    } else {
      router.push(redirectTo);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10">
        <div className="text-center">
          <span className="inline-block rounded-full bg-fresh/10 px-3 py-1 text-xs font-bold text-fresh">
            {t("auth.loginEyebrow")}
          </span>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {t("auth.loginTitle")}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {t("auth.loginDescription")}
          </p>
        </div>

        {error ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-medium text-destructive">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground">
              {t("auth.email")}
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

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-foreground">
                {t("auth.password")}
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-fresh hover:underline"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          <Button
            type="submit"
            disabled={submitting}
            variant="gold"
            className="w-full h-11 justify-center rounded-xl font-bold shadow-xs mt-2"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" /> {t("auth.verifying")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {t("auth.signIn")} <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <div className="border-t border-border pt-5 text-center text-xs text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="font-bold text-primary dark:text-accent hover:underline">
            {t("auth.registerLink")}
          </Link>
        </div>
      </div>
    </div>
  );
}
