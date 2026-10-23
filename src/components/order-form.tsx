"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  Boxes,
  CheckCircle2,
  Loader2,
  MessageCircle,
  PackageCheck,
  Plus,
  Send,
  Trash2,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/products";
import { buildWhatsAppLink } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { useQuoteCart } from "@/context/quote-cart-context";

type QuoteForm = {
  business_name: string;
  contact_person: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  pin_code: string;
  gstin: string;
  delivery_requirements: string;
  message: string;
};

type QuoteLine = {
  product_id: string;
  variant_id: string;
  quantity: string;
};

type SavedEnquiry = {
  reference: string;
  created: boolean;
  notificationWarning: string | null;
};

const initialForm: QuoteForm = {
  business_name: "",
  contact_person: "",
  phone: "",
  email: "",
  city: "",
  state: "",
  pin_code: "",
  gstin: "",
  delivery_requirements: "",
  message: ""
};

export function OrderForm({
  products,
  whatsappNumber
}: {
  products: Product[];
  whatsappNumber: string;
}) {
  const searchParams = useSearchParams();
  const initialBudget = searchParams.get("budget");
  const initialProduct = searchParams.get("product") || "";
  const initialVariant = searchParams.get("variant") || "";
  const initialQty = searchParams.get("quantity") || "";
  const quoteCart = useQuoteCart();
  const { t } = useLanguage();

  const [form, setForm] = useState<QuoteForm>(() => {
    const amount = Number(initialBudget);
    return Number.isFinite(amount) && amount > 0
      ? { ...initialForm, message: `${t("orderForm.budgetNote")}: ₹${amount.toLocaleString("en-IN")}` }
      : initialForm;
  });
  const [cartReady, setCartReady] = useState(false);
  const [items, setItems] = useState<QuoteLine[]>(() =>
    products.some((p) => p.id === initialProduct)
      ? [{ product_id: initialProduct, variant_id: initialVariant, quantity: initialQty || "1" }]
      : []
  );

  const { user, session, profile } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [savedEnquiry, setSavedEnquiry] = useState<SavedEnquiry | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [requestId, setRequestId] = useState("");

  useEffect(() => {
    if (!quoteCart.hydrated || cartReady) return;
    const merged = quoteCart.items.filter((item) => products.some((product) => product.id === item.product_id));
    if (products.some((product) => product.id === initialProduct)) {
      const existing = merged.find((item) => item.product_id === initialProduct);
      if (existing) {
        existing.variant_id = initialVariant || existing.variant_id;
        existing.quantity = initialQty || existing.quantity;
      } else if (merged.length < 30) {
        merged.push({ product_id: initialProduct, variant_id: initialVariant, quantity: initialQty || "1" });
      }
    }
    // Hydrate the form once from the saved quote basket and current product URL.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(merged);
    quoteCart.replaceItems(merged);
    setCartReady(true);
  }, [cartReady, initialProduct, initialQty, initialVariant, products, quoteCart]);

  useEffect(() => {
    if (cartReady) quoteCart.replaceItems(items);
  }, [cartReady, items, quoteCart]);

  useEffect(() => {
    if (profile) {
      // The auth profile arrives asynchronously; initialize only untouched form fields.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((prev) => ({
        ...prev,
        contact_person: prev.contact_person || profile.full_name || "",
        phone: prev.phone || profile.phone || "",
        email: prev.email || user?.email || "",
        business_name: prev.business_name || profile.business_name || "",
        city: prev.city || profile.city || "Maya Bazar",
        state: prev.state || profile.state || "Uttar Pradesh",
        pin_code: prev.pin_code || profile.pincode || ""
      }));
    }
  }, [profile, user]);

  const whatsappMessage = useMemo(() => {
    const lines = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      const variant = product?.variants.find((v) => v.id === item.variant_id);
      return `• ${product?.name || "Product"}${variant ? ` (${variant.name})` : ""}: ${item.quantity || "1"}${variant?.unit || product?.unit ? ` ${variant?.unit || product?.unit}` : " units"}`;
    });
    return [
      "Wholesale Quote Enquiry",
      savedEnquiry ? `Reference: ${savedEnquiry.reference}` : "",
      `Store: ${form.business_name}`,
      `Contact: ${form.contact_person}`,
      `Phone: ${form.phone}`,
      "Items Requested:",
      ...lines,
      form.city && form.state ? `Delivery To: ${form.city}, ${form.state}` : "",
      form.delivery_requirements ? `Transport Note: ${form.delivery_requirements}` : ""
    ]
      .filter(Boolean)
      .join("\n");
  }, [form, items, products, savedEnquiry]);

  function updateForm(name: keyof QuoteForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setSavedEnquiry(null);
    setWhatsappLink(null);
    setRequestId("");
  }

  function updateLine(index: number, patch: Partial<QuoteLine>) {
    setItems((current) =>
      current.map((item, pos) => (pos === index ? { ...item, ...patch } : item))
    );
    setSavedEnquiry(null);
    setWhatsappLink(null);
    setRequestId("");
  }

  function addProduct() {
    const selectedIds = new Set(items.map((item) => item.product_id));
    const nextProduct = products.find((p) => !selectedIds.has(p.id));
    if (nextProduct) {
      setItems((current) => [
        ...current,
        { product_id: nextProduct.id, variant_id: "", quantity: "1" }
      ]);
    }
  }

  function removeProduct(index: number) {
    setItems((current) => current.filter((_, pos) => pos !== index));
    setSavedEnquiry(null);
    setWhatsappLink(null);
    setRequestId("");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!navigator.onLine) {
      setFormError(t("orderForm.networkError"));
      return;
    }
    setLoading(true);
    setErrors({});
    setFormError("");

    const id = requestId || window.crypto.randomUUID();
    setRequestId(id);

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          ...form,
          customer_id: user?.id || null,
          client_request_id: id,
          items: items.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            quantity: Number(item.quantity) || 1
          }))
        }),
        signal: AbortSignal.timeout(15_000)
      });

      const data = await response.json();
      if (!response.ok) {
        setErrors(data.fieldErrors || {});
        setFormError(data.error || t("orderForm.checkFields"));
        return;
      }

      const saved = {
        reference: data.enquiry.reference,
        created: data.enquiry.created,
        notificationWarning: data.notificationWarning || null
      };
      setSavedEnquiry(saved);
      quoteCart.clear();
      setWhatsappLink(
        buildWhatsAppLink(
          `Wholesale Quote Enquiry — Gayatri Store\nReference: ${saved.reference}\n\n${whatsappMessage}`,
          whatsappNumber
        )
      );
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "TimeoutError";
      setFormError(timedOut ? t("orderForm.requestTimeout") : t("orderForm.networkError"));
    } finally {
      setLoading(false);
    }
  }

  // Success Confirmation Screen
  if (savedEnquiry) {
    return (
      <Card className="overflow-hidden rounded-3xl border border-fresh/30 bg-card shadow-xl">
        <CardContent className="p-6 md:p-10">
          <div className="rounded-2xl border border-fresh/40 bg-fresh/10 p-6 text-foreground">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fresh text-white">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-xl font-extrabold text-foreground">
                  {savedEnquiry.created ? t("orderForm.saved") : t("orderForm.duplicate")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("orderForm.savedDescription")}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-card p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("orderForm.reference")}
              </span>
              <p className="mt-1 font-mono text-2xl font-black text-primary dark:text-accent">
                {savedEnquiry.reference}
              </p>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {t("orderForm.followup")}
            </p>

            {savedEnquiry.notificationWarning ? (
              <p className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-400">
                {savedEnquiry.notificationWarning}
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {whatsappLink ? (
              <Button asChild variant="gold" size="lg" className="shadow-md">
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>{t("orderForm.sendReference")}</span>
                </a>
              </Button>
            ) : null}
            {user ? (
              <Button asChild variant="outline" size="lg">
                <Link href="/account" className="gap-2">
                  <PackageCheck className="h-5 w-5 text-fresh" />
                  <span>{t("orderForm.track")}</span>
                </Link>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                setSavedEnquiry(null);
                setItems([]);
                quoteCart.clear();
                setForm(initialForm);
                setRequestId("");
              }}
            >
              {t("orderForm.another")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-border bg-card shadow-lg">
      <CardContent className="p-6 md:p-10">
        {formError ? (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-vermilion/30 bg-vermilion/10 p-4 text-sm font-semibold text-vermilion"
          >
            {formError}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-8">
          {/* SECTION 1: Product Selection */}
          <fieldset className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <legend className="text-lg font-extrabold text-foreground">
                  {t("orderForm.productsQuantities")}
                </legend>
                <p className="text-xs text-muted-foreground">
                  {t("orderForm.selectProducts")}
                </p>
              </div>
              <span className="rounded-full bg-fresh/10 px-3 py-1 text-xs font-bold text-fresh">
                {items.length} {items.length === 1 ? t("orderForm.item") : t("orderForm.items")}
              </span>
            </div>

            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-center">
                <Boxes className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-bold text-foreground">
                  {t("orderForm.noProducts")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("orderForm.contactSales")}
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {items.map((item, index) => {
                  const product = products.find((p) => p.id === item.product_id);
                  if (!product) return null;
                  const availableProducts = products.filter(
                    (p) =>
                      p.id === item.product_id ||
                      !items.some(
                        (sel, selIdx) => selIdx !== index && sel.product_id === p.id
                      )
                  );
                  const variants = product.variants;

                  return (
                    <div
                      key={`${item.product_id}-${index}`}
                      className="grid gap-3 rounded-2xl border border-border bg-background p-4 sm:grid-cols-[1.5fr_1.2fr_0.9fr_auto] sm:items-end"
                    >
                      {/* Product Selector */}
                      <Field label={t("orderForm.product")} error={errors.items}>
                        <select
                          aria-label={t("orderForm.product")}
                          value={item.product_id}
                          onChange={(e) =>
                            updateLine(index, { product_id: e.target.value, variant_id: "" })
                          }
                          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:border-fresh focus:outline-none"
                        >
                          {availableProducts.map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.brandName ? `[${entry.brandName}] ` : ""}
                              {entry.name}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {/* Variant Selector */}
                      <Field label={t("orderForm.variant")}>
                        <select
                          aria-label={t("orderForm.variant")}
                          value={item.variant_id}
                          onChange={(e) => updateLine(index, { variant_id: e.target.value })}
                          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:border-fresh focus:outline-none"
                        >
                          <option value="">{t("orderForm.standardPack")} ({product.packing || t("orderForm.carton")})</option>
                          {variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                              {v.pack_size ? ` (${v.pack_size})` : ""}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {/* Quantity Input */}
                      <Field label={`${t("orderForm.quantity")} (${product.unit || t("product.units")})`}>
                        <Input
                          type="number"
                          min="1"
                          step="any"
                          inputMode="numeric"
                          value={item.quantity}
                          onChange={(e) => updateLine(index, { quantity: e.target.value })}
                          aria-label={`${t("orderForm.quantity")} for ${product.name}`}
                          className="h-11 rounded-xl text-sm"
                          placeholder={t("orderForm.exampleQuantity")}
                        />
                      </Field>

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`${t("orderForm.removeProduct")}: ${product.name}`}
                        onClick={() => removeProduct(index)}
                        className="rounded-xl border-border hover:bg-vermilion/10 hover:text-vermilion"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      {product.moq ? (
                        <p className="text-[11px] font-semibold text-muted-foreground sm:col-span-4 flex items-center gap-1.5">
                          <Truck className="h-3 w-3 text-fresh" /> {t("product.minOrder")}: {product.moq}
                        </p>
                      ) : null}
                    </div>
                  );
                })}

                {items.length < products.length && items.length < 30 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit gap-2 border-dashed border-border hover:border-fresh"
                    onClick={addProduct}
                    disabled={!cartReady}
                  >
                    <Plus className="h-4 w-4 text-fresh" /> {t("orderForm.addProduct")}
                  </Button>
                ) : null}
              </div>
            )}
          </fieldset>

          {/* SECTION 2: Buyer & Store Information */}
          <fieldset className="space-y-4 border-t border-border pt-6">
            <div>
              <legend className="text-lg font-extrabold text-foreground">
                {t("orderForm.businessContact")}
              </legend>
              <p className="text-xs text-muted-foreground">
                {t("orderForm.businessContactHint")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("orderForm.storeName")} error={errors.business_name} required>
                <Input
                  value={form.business_name}
                  onChange={(e) => updateForm("business_name", e.target.value)}
                  placeholder={t("orderForm.storeExample")}
                  autoComplete="organization"
                  className="rounded-xl"
                />
              </Field>

              <Field label={t("orderForm.contactPerson")} error={errors.contact_person} required>
                <Input
                  value={form.contact_person}
                  onChange={(e) => updateForm("contact_person", e.target.value)}
                  placeholder={t("orderForm.contactExample")}
                  autoComplete="name"
                  className="rounded-xl"
                />
              </Field>

              <Field label={t("orderForm.mobile")} error={errors.phone} required>
                <Input
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  placeholder={t("orderForm.mobileHint")}
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  className="rounded-xl"
                />
              </Field>

              <Field label={t("orderForm.emailOptional")} error={errors.email}>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  placeholder="email@example.com"
                  autoComplete="email"
                  className="rounded-xl"
                />
              </Field>

              <Field label={t("orderForm.city")} error={errors.city} required>
                <Input
                  value={form.city}
                  onChange={(e) => updateForm("city", e.target.value)}
                  placeholder={t("orderForm.cityExample")}
                  autoComplete="address-level2"
                  className="rounded-xl"
                />
              </Field>

              <Field label={t("orderForm.state")} error={errors.state} required>
                <Input
                  value={form.state}
                  onChange={(e) => updateForm("state", e.target.value)}
                  placeholder={t("orderForm.stateExample")}
                  autoComplete="address-level1"
                  className="rounded-xl"
                />
              </Field>

              <Field label={t("orderForm.pin")} error={errors.pin_code} required>
                <Input
                  value={form.pin_code}
                  onChange={(e) => updateForm("pin_code", e.target.value)}
                  placeholder={t("orderForm.pinHint")}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  className="rounded-xl"
                />
              </Field>

              <Field label={t("orderForm.gst")} error={errors.gstin}>
                <Input
                  value={form.gstin}
                  onChange={(e) => updateForm("gstin", e.target.value.toUpperCase())}
                  placeholder="15-character GSTIN"
                  maxLength={15}
                  className="rounded-xl uppercase font-mono"
                />
              </Field>
            </div>
          </fieldset>

          {/* SECTION 3: Logistics & Notes */}
          <fieldset className="space-y-4 border-t border-border pt-6">
            <div>
              <legend className="text-lg font-extrabold text-foreground">
                {t("orderForm.deliveryNotes")}
              </legend>
              <p className="text-xs text-muted-foreground">
                {t("orderForm.deliveryHint")}
              </p>
            </div>

            <Field label={t("orderForm.deliveryInstructions")} error={errors.delivery_requirements}>
              <Textarea
                value={form.delivery_requirements}
                onChange={(e) => updateForm("delivery_requirements", e.target.value)}
                placeholder={t("orderForm.deliveryPlaceholder")}
                maxLength={1000}
                className="rounded-xl min-h-[80px]"
              />
            </Field>

            <Field label={t("orderForm.additionalNotes")} error={errors.message}>
              <Textarea
                value={form.message}
                onChange={(e) => updateForm("message", e.target.value)}
                placeholder={t("orderForm.notesPlaceholder")}
                maxLength={2000}
                className="rounded-xl min-h-[80px]"
              />
            </Field>
          </fieldset>

          {/* Submit Action */}
          <div className="border-t border-border pt-6">
            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={loading || items.length === 0}
              className="w-full justify-center shadow-lg text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t("orderForm.submitting")}</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>{t("orderForm.submit")}</span>
                </>
              )}
            </Button>
            <p className="mt-2.5 text-center text-xs text-muted-foreground">
              {t("orderForm.submitNotice")}
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  error,
  required,
  children
}: {
  label: string;
  error?: string | string[];
  required?: boolean;
  children: React.ReactNode;
}) {
  const message = Array.isArray(error) ? error[0] : error;
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-bold text-foreground">
        {label} {required ? <span className="text-vermilion">*</span> : null}
      </Label>
      {children}
      {message ? (
        <p className="text-xs font-semibold text-vermilion">{message}</p>
      ) : null}
    </div>
  );
}
