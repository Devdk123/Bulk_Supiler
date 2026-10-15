"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MessageCircle, Plus, Send, Trash2 } from "lucide-react";
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

export function OrderForm({ products, whatsappNumber }: { products: Product[]; whatsappNumber: string }) {
  const searchParams = useSearchParams();
  const initialProduct = searchParams.get("product") || "";
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState<QuoteLine[]>(() =>
    products.some((product) => product.id === initialProduct)
      ? [{ product_id: initialProduct, variant_id: "", quantity: "" }]
      : []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [savedEnquiry, setSavedEnquiry] = useState<SavedEnquiry | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [requestId, setRequestId] = useState("");

  const whatsappMessage = useMemo(() => {
    const lines = items.map((item) => {
      const product = products.find((entry) => entry.id === item.product_id);
      const variant = product?.variants.find((entry) => entry.id === item.variant_id);
      return `${product?.name || "Product"}${variant ? ` - ${variant.name}` : ""}: ${item.quantity}${variant?.unit || product?.unit ? ` ${variant?.unit || product?.unit}` : ""}`;
    });
    return [
      "Wholesale quote enquiry",
      savedEnquiry ? `Reference: ${savedEnquiry.reference}` : "",
      `Business: ${form.business_name}`,
      `Contact: ${form.contact_person}`,
      `Phone: ${form.phone}`,
      ...lines,
      form.city && form.state ? `Location: ${form.city}, ${form.state}` : ""
    ].filter(Boolean).join("\n");
  }, [form, items, products, savedEnquiry]);

  function updateForm(name: keyof QuoteForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setSavedEnquiry(null);
    setWhatsappLink(null);
    setRequestId("");
  }

  function updateLine(index: number, patch: Partial<QuoteLine>) {
    setItems((current) => current.map((item, position) => position === index ? { ...item, ...patch } : item));
    setSavedEnquiry(null);
    setWhatsappLink(null);
    setRequestId("");
  }

  function addProduct() {
    const selectedIds = new Set(items.map((item) => item.product_id));
    const nextProduct = products.find((product) => !selectedIds.has(product.id));
    if (nextProduct) {
      setItems((current) => [...current, { product_id: nextProduct.id, variant_id: "", quantity: "" }]);
    }
  }

  function removeProduct(index: number) {
    setItems((current) => current.filter((_, position) => position !== index));
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
          client_request_id: id,
          items: items.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            quantity: Number(item.quantity)
          }))
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setErrors(data.fieldErrors || {});
        setFormError(data.error || "Unable to save the enquiry. Please try again.");
        return;
      }

      const saved = {
        reference: data.enquiry.reference,
        created: data.enquiry.created,
        notificationWarning: data.notificationWarning || null
      };
      setSavedEnquiry(saved);
      setWhatsappLink(buildWhatsAppLink(
        `Wholesale quote enquiry\nReference: ${saved.reference}\n${whatsappMessage}`,
        whatsappNumber
      ));
    } catch {
      setFormError("Network error. Your enquiry was not confirmed as saved. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  if (savedEnquiry) {
    return (
      <Card className="premium-shadow">
        <CardContent className="p-6 md:p-8">
          <div role="status" className="rounded-lg border border-green-300 bg-green-50 p-5 text-green-900">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-5 w-5" /> {savedEnquiry.created ? "Enquiry saved" : "Enquiry already received"}
            </div>
            <p className="mt-2">Reference: <span className="font-bold">{savedEnquiry.reference}</span></p>
            <p className="mt-2 text-sm">Your enquiry is recorded for follow-up. No order or payment is confirmed at this stage.</p>
            {savedEnquiry.notificationWarning ? <p className="mt-3 text-sm font-semibold text-amber-900">{savedEnquiry.notificationWarning}</p> : null}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {whatsappLink ? (
              <Button asChild variant="gold">
                <a href={whatsappLink} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" /> Continue on WhatsApp
                </a>
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => {
              setSavedEnquiry(null);
              setItems([]);
              setForm(initialForm);
              setRequestId("");
            }}>
              Start another enquiry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="premium-shadow">
      <CardContent className="p-6 md:p-8">
        {formError ? <p role="alert" className="mb-5 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{formError}</p> : null}

        <form onSubmit={onSubmit} className="grid gap-7">
          <fieldset className="grid gap-4">
            <legend className="mb-2 text-lg font-bold text-primary">Products and quantities</legend>
            {products.length === 0 ? (
              <p className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
                There are no published products to select yet. Please check back later or contact the business.
              </p>
            ) : (
              <>
                {items.map((item, index) => {
                  const product = products.find((entry) => entry.id === item.product_id);
                  if (!product) return null;
                  const availableProducts = products.filter((entry) =>
                    entry.id === item.product_id || !items.some((selected, selectedIndex) =>
                      selectedIndex !== index && selected.product_id === entry.id
                    )
                  );
                  const variants = product.variants;

                  return (
                    <div key={`${item.product_id}-${index}`} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1.3fr_1fr_0.7fr_auto] sm:items-end">
                      <Field label="Product" error={errors.items}>
                        <select
                          aria-label="Product"
                          value={item.product_id}
                          onChange={(event) => updateLine(index, { product_id: event.target.value, variant_id: "" })}
                          className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                        >
                          {availableProducts.map((entry) => (
                            <option key={entry.id} value={entry.id}>{entry.brandName ? `${entry.brandName} - ` : ""}{entry.name}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Variant / pack">
                        <select
                          aria-label="Variant or pack"
                          value={item.variant_id}
                          onChange={(event) => updateLine(index, { variant_id: event.target.value })}
                          className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                        >
                          <option value="">Standard product option</option>
                          {variants.map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.name}{variant.pack_size ? ` - ${variant.pack_size}` : ""}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Quantity">
                        <Input
                          type="number"
                          min="0.001"
                          step="any"
                          inputMode="decimal"
                          value={item.quantity}
                          onChange={(event) => updateLine(index, { quantity: event.target.value })}
                          aria-label={`Quantity for ${product.name}`}
                        />
                      </Field>
                      <Button type="button" variant="outline" size="icon" aria-label={`Remove ${product.name}`} onClick={() => removeProduct(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {product.moq ? <p className="text-xs text-muted-foreground sm:col-span-4">Configured minimum: {product.moq}</p> : null}
                    </div>
                  );
                })}
                <Button type="button" variant="outline" className="w-fit" onClick={addProduct} disabled={items.length >= products.length || items.length >= 30}>
                  <Plus className="h-4 w-4" /> Add product
                </Button>
              </>
            )}
          </fieldset>

          <fieldset className="grid gap-4">
            <legend className="mb-2 text-lg font-bold text-primary">Business contact</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business name" error={errors.business_name}>
                <Input value={form.business_name} onChange={(event) => updateForm("business_name", event.target.value)} autoComplete="organization" />
              </Field>
              <Field label="Contact person" error={errors.contact_person}>
                <Input value={form.contact_person} onChange={(event) => updateForm("contact_person", event.target.value)} autoComplete="name" />
              </Field>
              <Field label="Mobile number" error={errors.phone}>
                <Input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} inputMode="numeric" autoComplete="tel" maxLength={10} />
              </Field>
              <Field label="Email (optional)" error={errors.email}>
                <Input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} autoComplete="email" />
              </Field>
              <Field label="City" error={errors.city}>
                <Input value={form.city} onChange={(event) => updateForm("city", event.target.value)} autoComplete="address-level2" />
              </Field>
              <Field label="State" error={errors.state}>
                <Input value={form.state} onChange={(event) => updateForm("state", event.target.value)} autoComplete="address-level1" />
              </Field>
              <Field label="PIN code" error={errors.pin_code}>
                <Input value={form.pin_code} onChange={(event) => updateForm("pin_code", event.target.value)} inputMode="numeric" autoComplete="postal-code" maxLength={6} />
              </Field>
              <Field label="GSTIN (optional)" error={errors.gstin}>
                <Input value={form.gstin} onChange={(event) => updateForm("gstin", event.target.value.toUpperCase())} maxLength={15} />
              </Field>
            </div>
          </fieldset>

          <Field label="Delivery / transport requirements" error={errors.delivery_requirements}>
            <Textarea value={form.delivery_requirements} onChange={(event) => updateForm("delivery_requirements", event.target.value)} maxLength={1000} />
          </Field>
          <Field label="Additional notes" error={errors.message}>
            <Textarea value={form.message} onChange={(event) => updateForm("message", event.target.value)} maxLength={2000} />
          </Field>
          <Button type="submit" variant="gold" size="lg" disabled={loading || products.length === 0 || items.length === 0}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            Submit quote request
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, error, children }: { label: string; error?: string | string[]; children: React.ReactNode }) {
  const message = Array.isArray(error) ? error[0] : error;
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {message ? <p className="text-sm font-medium text-red-700">{message}</p> : null}
    </div>
  );
}
