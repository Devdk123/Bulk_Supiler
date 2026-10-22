"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Store,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, user, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("Maya Bazar");
  const [state, setState] = useState("Uttar Pradesh");
  const [pincode, setPincode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/account");
    }
  }, [user, authLoading, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim() || !phone.trim() || !email.trim() || !password) {
      setError("Please fill in all mandatory fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setSubmitting(true);
    let result: Awaited<ReturnType<typeof signUp>>;
    try {
      result = await signUp({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        businessName: businessName.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        password
      });
    } finally {
      setSubmitting(false);
    }

    if (result.error) {
      setError(result.error);
    } else if (result.requiresVerification) {
      setSuccess("Account registered! A verification link has been sent to your email. Please click the link to activate your account.");
    } else {
      router.push("/account");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl space-y-8 rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10">
        <div className="text-center">
          <span className="inline-block rounded-full bg-fresh/10 px-3 py-1 text-xs font-bold text-fresh">
            Kirana &amp; Retail Registration
          </span>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Register for Direct Wholesale Supply
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Create your Gayatri Store business account to receive verified volume rate cards, order tracking, and priority godown dispatch.
          </p>
        </div>

        {error ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-medium text-destructive">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : null}

        {success ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-fresh/20 bg-fresh/10 p-4 text-xs font-medium text-fresh">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-foreground">
                Store Owner Full Name *
              </label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="h-11 rounded-xl pl-10 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground">
                WhatsApp / Mobile Number *
              </label>
              <div className="relative mt-1.5">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="h-11 rounded-xl pl-10 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-foreground">
                Business / Kirana Shop Name
              </label>
              <div className="relative mt-1.5">
                <Store className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Shree Ram Kirana Store"
                  className="h-11 rounded-xl pl-10 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground">
                Business Email Address *
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="store@gmail.com"
                  className="h-11 rounded-xl pl-10 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-foreground">
                City / Market Zone
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Maya Bazar"
                className="mt-1.5 h-11 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground">
                State
              </label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Uttar Pradesh"
                className="mt-1.5 h-11 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground">
                Pincode
              </label>
              <Input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="224001"
                className="mt-1.5 h-11 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-foreground">
                Create Password *
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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
                Confirm Password *
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="h-11 rounded-xl pl-10 text-sm"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            variant="gold"
            className="w-full h-11 justify-center rounded-xl font-bold shadow-xs mt-3"
          >
            {submitting ? "Registering Store..." : "Create Wholesale Account"}
          </Button>
        </form>

        <div className="border-t border-border pt-5 text-center text-xs text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="font-bold text-primary dark:text-accent hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
