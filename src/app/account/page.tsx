"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Building2,
  Calendar,
  KeyRound,
  LoaderCircle,
  LogOut,
  MapPin,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  Shield,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { buildWhatsAppLink } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

type EnquiryItem = {
  id: string;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  packaging: string | null;
  unit: string | null;
  quantity: number | string;
  quoted_unit_price: number | string | null;
  line_notes: string | null;
};

type CustomerEnquiry = {
  id: string;
  reference: string;
  business_name: string;
  contact_person: string;
  phone: string;
  email: string | null;
  city: string;
  state: string;
  pin_code: string;
  delivery_requirements: string | null;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  items: EnquiryItem[];
};

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, session, signOut, refreshProfile, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<"enquiries" | "profile" | "security">("enquiries");
  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [enquiriesError, setEnquiriesError] = useState<string | null>(null);

  // Profile Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Password update state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Populate profile fields when profile loads
  useEffect(() => {
    if (profile) {
      // The signed-in profile arrives asynchronously and initializes editable fields.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setBusinessName(profile.business_name || "");
      setCity(profile.city || "");
      setState(profile.state || "");
      setPincode(profile.pincode || "");
    }
  }, [profile]);

  // Load enquiries
  const loadEnquiries = useCallback(async () => {
    if (!session?.access_token) return;
    setLoadingEnquiries(true);
    setEnquiriesError(null);

    try {
      const response = await fetch("/api/customer/enquiries", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        signal: AbortSignal.timeout(10000)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load enquiries.");
      }
      setEnquiries(data.enquiries || []);
    } catch (err) {
      const timedOut = err instanceof DOMException && ["TimeoutError", "AbortError"].includes(err.name);
      console.warn("Unable to load account enquiry history:", err);
      setEnquiriesError(timedOut ? t("accountUI.timeout") : t("accountUI.loadError"));
    } finally {
      setLoadingEnquiries(false);
    }
  }, [session, t]);

  useEffect(() => {
    if (!user || !session) return;
    let active = true;
    queueMicrotask(() => {
      if (active) void loadEnquiries();
    });
    return () => { active = false; };
  }, [user, session, loadEnquiries]);

  // Real-time subscription for customer's enquiry status changes
  useEffect(() => {
    if (!user?.id) return;
    const supabase = getSupabaseBrowser();

    const channel = supabase
      .channel(`customer-enquiries-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "enquiries",
          filter: `customer_id=eq.${user.id}`
        },
        () => {
          loadEnquiries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadEnquiries]);

  // Handle Profile Update
  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          business_name: businessName.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) {
        setProfileMessage({ text: error.message, type: "error" });
      } else {
        await refreshProfile();
        setProfileMessage({ text: t("accountUI.saveProfileSuccess"), type: "success" });
      }
    } catch {
      setProfileMessage({
        text: t("accountUI.saveProfileError"),
        type: "error"
      });
    } finally {
      setSavingProfile(false);
    }
  }

  // Handle Password Update
  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ text: t("accountUI.passwordTooShort"), type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: t("accountUI.passwordMismatch"), type: "error" });
      return;
    }

    setUpdatingPassword(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordMessage({ text: t("accountUI.passwordUpdateError"), type: "error" });
      } else {
        setPasswordMessage({ text: t("accountUI.passwordUpdateSuccess"), type: "success" });
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordMessage({ text: t("accountUI.passwordUpdateError"), type: "error" });
    } finally {
      setUpdatingPassword(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  // Auth Guard
  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin text-fresh" />
          <span>{t("account.loading")}</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <section className="py-16 md:py-24">
        <div className="container-page max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary text-muted-foreground">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 text-2xl font-black text-foreground">
            {t("account.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("account.signInPrompt")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="gold" className="rounded-xl px-6">
              <Link href="/login?redirect=/account">{t("account.signIn")}</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl px-6">
              <Link href="/register">{t("account.register")}</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 md:py-16">
      <div className="container-page max-w-6xl">
        {/* Account Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between md:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-xl shadow-xs">
              {profile?.full_name ? profile.full_name[0].toUpperCase() : "G"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-foreground sm:text-2xl">
                  {profile?.full_name || t("account.wholesalePartner")}
                </h1>
                <span className="rounded-full bg-fresh/15 px-2.5 py-0.5 text-[11px] font-bold text-fresh">
                  {profile?.role === "admin" ? t("account.administrator") : t("account.retailer")}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {profile?.business_name ? `${profile.business_name} • ` : ""}
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {profile?.role === "admin" ? (
              <Button asChild variant="outline" size="sm" className="rounded-xl font-bold border-primary text-primary">
                <Link href="/about/admin">
                  <Shield className="h-4 w-4 mr-1.5" /> {t("accountUI.adminPanel")}
                </Link>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-1.5" /> {t("account.logout")}
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-border pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("enquiries")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "enquiries"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <PackageCheck className="h-4 w-4" />
            <span>{t("accountUI.tabs.enquiries")} ({enquiries.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "profile"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>{t("accountUI.tabs.profile")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "security"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span>{t("accountUI.tabs.security")}</span>
          </button>
        </div>

        {/* TAB 1: MY BULK ENQUIRIES */}
        {activeTab === "enquiries" ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-foreground">
                  {t("accountUI.enquiriesTitle")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("accountUI.enquiriesDescription")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadEnquiries}
                disabled={loadingEnquiries}
                className="rounded-xl gap-1.5 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingEnquiries ? "animate-spin" : ""}`} />
                <span>{t("accountUI.refresh")}</span>
              </Button>
            </div>

            {loadingEnquiries && enquiries.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center text-xs text-muted-foreground">
                <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-fresh mb-2" />
                {t("accountUI.loadingEnquiries")}
              </div>
            ) : null}

            {enquiriesError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
                {enquiriesError}
              </div>
            ) : null}

            {!loadingEnquiries && enquiries.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                <Boxes className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <h3 className="mt-4 text-base font-bold text-foreground">
                  {t("accountUI.emptyTitle")}
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                  {t("accountUI.emptyDescription")}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button asChild variant="gold" className="rounded-xl">
                    <Link href="/products">{t("accountUI.exploreCatalogue")}</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href="/order">{t("accountUI.buildQuote")}</Link>
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4">
              {enquiries.map((enq) => {
                const whatsappFollowup = buildWhatsAppLink(
                  `Hello Gayatri Store, following up on my wholesale enquiry Reference ${enq.reference} for ${enq.business_name}.`,
                  "918849263377"
                );

                const statusBadgeStyle = {
                  New: "bg-accent/20 text-accent-foreground border-accent/40",
                  "Under Review": "bg-blue-500/10 text-blue-600 border-blue-500/30",
                  "Quotation Sent": "bg-purple-500/10 text-purple-600 border-purple-500/30",
                  Confirmed: "bg-fresh/15 text-fresh border-fresh/30",
                  Processing: "bg-fresh/15 text-fresh border-fresh/30",
                  Dispatched: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
                  Completed: "bg-fresh/20 text-fresh border-fresh/40",
                  Cancelled: "bg-destructive/10 text-destructive border-destructive/30"
                }[enq.status] || "bg-secondary text-foreground";

                const dateFormatted = new Date(enq.created_at).toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <Card key={enq.id} className="rounded-3xl border border-border bg-card shadow-xs overflow-hidden">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-sm font-black text-primary dark:text-accent">
                              {enq.reference}
                            </span>
                            <span className={`rounded-lg border px-2.5 py-0.5 text-[11px] font-bold ${statusBadgeStyle}`}>
                              {t(`accountUI.statuses.${enq.status}`)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" /> {dateFormatted}
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" /> {enq.city}, {enq.state}
                            </span>
                          </div>
                        </div>

                        {whatsappFollowup ? (
                          <Button asChild variant="outline" size="sm" className="rounded-xl border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 text-xs font-bold">
                            <a href={whatsappFollowup} target="_blank" rel="noreferrer">
                              <MessageCircle className="h-3.5 w-3.5 mr-1" /> {t("accountUI.followUp")}
                            </a>
                          </Button>
                        ) : null}
                      </div>

                      {/* Items list */}
                      <div className="mt-4">
                        <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                          {t("accountUI.requestedItems")} ({enq.items?.length || 0})
                        </p>
                        <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-background/50">
                          {(enq.items || []).map((item) => (
                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 text-xs">
                              <div>
                                <span className="font-bold text-foreground">
                                  {item.product_name}
                                </span>
                                {item.variant_name ? (
                                  <span className="ml-1 text-muted-foreground">
                                    ({item.variant_name})
                                  </span>
                                ) : null}
                                {item.packaging ? (
                                  <span className="block text-[11px] text-muted-foreground">
                                    {t("accountUI.packing")}: {item.packaging}
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-4 sm:text-right">
                                <span className="font-bold text-primary dark:text-accent">
                                  {t("accountUI.quantity")}: {item.quantity} {item.unit || t("accountUI.units")}
                                </span>
                                {item.quoted_unit_price ? (
                                  <span className="rounded bg-fresh/10 px-2 py-0.5 text-xs font-bold text-fresh">
                                    {t("accountUI.quoted")}: ₹{item.quoted_unit_price} / {item.unit || t("accountUI.units")}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {enq.delivery_requirements ? (
                        <div className="mt-3 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{t("accountUI.deliveryNotes")}</span> {enq.delivery_requirements}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* TAB 2: PROFILE & BUSINESS INFO */}
        {activeTab === "profile" ? (
          <Card className="mt-6 rounded-3xl border border-border bg-card shadow-xs">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-lg font-extrabold text-foreground">
                {t("accountUI.profileTitle")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("accountUI.profileDescription")}
              </p>

              {profileMessage ? (
                <div className={`mt-4 rounded-xl border p-3.5 text-xs font-medium ${
                  profileMessage.type === "success"
                    ? "border-fresh/30 bg-fresh/10 text-fresh"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }`}>
                  {profileMessage.text}
                </div>
              ) : null}

              <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4 max-w-2xl">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-foreground">
                      {t("accountUI.ownerName")}
                    </label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1.5 h-11 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground">
                      {t("accountUI.mobile")}
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1.5 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground">
                    {t("accountUI.businessName")}
                  </label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1.5 h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground">
                      {t("accountUI.city")}
                    </label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1.5 h-11 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground">
                      {t("accountUI.state")}
                    </label>
                    <Input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="mt-1.5 h-11 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground">
                      {t("accountUI.pincode")}
                    </label>
                    <Input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="mt-1.5 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={savingProfile}
                  variant="gold"
                  className="rounded-xl px-6 font-bold shadow-xs mt-3"
                >
                  {savingProfile ? t("accountUI.saving") : t("accountUI.saveProfile")}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {/* TAB 3: SECURITY & PASSWORD */}
        {activeTab === "security" ? (
          <Card className="mt-6 rounded-3xl border border-border bg-card shadow-xs">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-lg font-extrabold text-foreground">
                {t("accountUI.securityTitle")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("accountUI.securityDescription")}
              </p>

              {passwordMessage ? (
                <div className={`mt-4 rounded-xl border p-3.5 text-xs font-medium ${
                  passwordMessage.type === "success"
                    ? "border-fresh/30 bg-fresh/10 text-fresh"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }`}>
                  {passwordMessage.text}
                </div>
              ) : null}

              <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-foreground">
                    {t("accountUI.newPassword")}
                  </label>
                  <Input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("accountUI.passwordHint")}
                    className="mt-1.5 h-11 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground">
                    {t("accountUI.confirmPassword")}
                  </label>
                  <Input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("accountUI.passwordAgainHint")}
                    className="mt-1.5 h-11 rounded-xl text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={updatingPassword}
                  variant="gold"
                  className="rounded-xl px-6 font-bold shadow-xs mt-2"
                >
                  {updatingPassword ? t("accountUI.updating") : t("accountUI.updatePassword")}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
