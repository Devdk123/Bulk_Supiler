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
  const initialProduct = searchParams.get("product") || "";
  const initialVariant = searchParams.get("variant") || "";
  const initialQty = searchParams.get("quantity") || "";

  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState<QuoteLine[]>(() =>
    products.some((p) => p.id === initialProduct)
      ? [{ product_id: initialProduct, variant_id: initialVariant, quantity: initialQty || "1" }]
      : products.length > 0
      ? [{ product_id: products[0].id, variant_id: "", quantity: "1" }]
      : []
  );

  const { user, profile } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [savedEnquiry, setSavedEnquiry] = useState<SavedEnquiry | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [requestId, setRequestId] = useState("");

  useEffect(() => {
    if (profile) {
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
    setLoading(true);
    setErrors({});
    setFormError("");

    const id = requestId || window.crypto.randomUUID();
    setRequestId(id);

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          customer_id: user?.id || null,
          client_request_id: id,
          items: items.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            quantity: Number(item.quantity) || 1
          }))
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setErrors(data.fieldErrors || {});
        setFormError(data.error || "Unable to save enquiry. Please check the fields.");
        return;
      }

      const saved = {
        reference: data.enquiry.reference,
        created: data.enquiry.created,
        notificationWarning: data.notificationWarning || null
      };
      setSavedEnquiry(saved);
      setWhatsappLink(
        buildWhatsAppLink(
          `Wholesale Quote Enquiry — Gayatri Store\nReference: ${saved.reference}\n\n${whatsappMessage}`,
          whatsappNumber
        )
      );
    } catch {
      setFormError("Network error. Your enquiry was not confirmed. Please retry.");
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
                  {savedEnquiry.created ? "Enquiry Successfully Submitted!" : "Enquiry Already Received"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Your wholesale quotation request has been recorded in our dispatch system.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-card p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Official Quote Reference
              </span>
              <p className="mt-1 font-mono text-2xl font-black text-primary dark:text-accent">
                {savedEnquiry.reference}
              </p>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Our sales coordinator will inspect real-time godown availability, apply tier quantity discounts, and contact you via phone or WhatsApp with your itemized proforma invoice.
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
                  <span>Send Reference to WhatsApp</span>
                </a>
              </Button>
            ) : null}
            {user ? (
              <Button asChild variant="outline" size="lg">
                <Link href="/account" className="gap-2">
                  <PackageCheck className="h-5 w-5 text-fresh" />
                  <span>Track in My Account</span>
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
                setForm(initialForm);
                setRequestId("");
              }}
            >
              Start Another Enquiry
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
                  1. Products & Quantities
                </legend>
                <p className="text-xs text-muted-foreground">
                  Select your required items and specify carton or packet units.
                </p>
              </div>
              <span className="rounded-full bg-fresh/10 px-3 py-1 text-xs font-bold text-fresh">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>

            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-center">
                <Boxes className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-bold text-foreground">
                  No published items currently listed in online catalogue
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  You can contact our godown sales desk directly on WhatsApp with your product list for immediate pricing.
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
                      <Field label="Product" error={errors.items}>
                        <select
                          aria-label="Product"
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
                      <Field label="Variant / Packaging">
                        <select
                          aria-label="Variant or packaging option"
                          value={item.variant_id}
                          onChange={(e) => updateLine(index, { variant_id: e.target.value })}
                          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:border-fresh focus:outline-none"
                        >
                          <option value="">Standard Pack ({product.packing || "Carton"})</option>
                          {variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                              {v.pack_size ? ` (${v.pack_size})` : ""}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {/* Quantity Input */}
                      <Field label={`Qty (${product.unit || "units"})`}>
                        <Input
                          type="number"
                          min="1"
                          step="any"
                          inputMode="numeric"
                          value={item.quantity}
                          onChange={(e) => updateLine(index, { quantity: e.target.value })}
                          aria-label={`Quantity for ${product.name}`}
                          className="h-11 rounded-xl text-sm"
                          placeholder="e.g. 10"
                        />
                      </Field>

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Remove ${product.name}`}
                        onClick={() => removeProduct(index)}
                        className="rounded-xl border-border hover:bg-vermilion/10 hover:text-vermilion"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      {product.moq ? (
                        <p className="text-[11px] font-semibold text-muted-foreground sm:col-span-4 flex items-center gap-1.5">
                          <Truck className="h-3 w-3 text-fresh" /> MOQ: {product.moq}
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
                  >
                    <Plus className="h-4 w-4 text-fresh" /> Add Another Product
                  </Button>
                ) : null}
              </div>
            )}
          </fieldset>

          {/* SECTION 2: Buyer & Store Information */}
          <fieldset className="space-y-4 border-t border-border pt-6">
            <div>
              <legend className="text-lg font-extrabold text-foreground">
                2. Business & Contact Information
              </legend>
              <p className="text-xs text-muted-foreground">
                Required for freight estimation, billing details, and GST invoicing.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Store / Business Name" error={errors.business_name} required>
                <Input
                  value={form.business_name}
                  onChange={(e) => updateForm("business_name", e.target.value)}
                  placeholder="e.g. Shree Ganesh Kirana Store"
                  autoComplete="organization"
                  className="rounded-xl"
                />
              </Field>

              <Field label="Contact Person Name" error={errors.contact_person} required>
                <Input
                  value={form.contact_person}
                  onChange={(e) => updateForm("contact_person", e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  autoComplete="name"
                  className="rounded-xl"
                />
              </Field>

              <Field label="Mobile / WhatsApp Number" error={errors.phone} required>
                <Input
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  className="rounded-xl"
                />
              </Field>

              <Field label="Email Address (Optional)" error={errors.email}>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  placeholder="email@example.com"
                  autoComplete="email"
                  className="rounded-xl"
                />
              </Field>

              <Field label="City / Town" error={errors.city} required>
                <Input
                  value={form.city}
                  onChange={(e) => updateForm("city", e.target.value)}
                  placeholder="e.g. Ahmedabad, Indore, Surat"
                  autoComplete="address-level2"
                  className="rounded-xl"
                />
              </Field>

              <Field label="State" error={errors.state} required>
                <Input
                  value={form.state}
                  onChange={(e) => updateForm("state", e.target.value)}
                  placeholder="e.g. Gujarat, Madhya Pradesh"
                  autoComplete="address-level1"
                  className="rounded-xl"
                />
              </Field>

              <Field label="PIN Code" error={errors.pin_code} required>
                <Input
                  value={form.pin_code}
                  onChange={(e) => updateForm("pin_code", e.target.value)}
                  placeholder="6-digit PIN code"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  className="rounded-xl"
                />
              </Field>

              <Field label="GSTIN (Optional for Registered Buyers)" error={errors.gstin}>
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
                3. Delivery Requirements & Notes
              </legend>
              <p className="text-xs text-muted-foreground">
                Preferred transport carrier, delivery address, or packing instructions.
              </p>
            </div>

            <Field label="Delivery / Transport Instructions" error={errors.delivery_requirements}>
              <Textarea
                value={form.delivery_requirements}
                onChange={(e) => updateForm("delivery_requirements", e.target.value)}
                placeholder="Mention preferred transport service, godown drop location, or special timing..."
                maxLength={1000}
                className="rounded-xl min-h-[80px]"
              />
            </Field>

            <Field label="Additional Inquiries / Notes" error={errors.message}>
              <Textarea
                value={form.message}
                onChange={(e) => updateForm("message", e.target.value)}
                placeholder="Any special packing or bulk discount request..."
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
                  <span>Submitting Wholesale Quotation...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Submit Wholesale Quotation Request</span>
                </>
              )}
            </Button>
            <p className="mt-2.5 text-center text-xs text-muted-foreground">
              By submitting, your request is logged with an official reference code. No payment is charged online.
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
