"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/products";
import { buildWhatsAppLink } from "@/lib/utils";
import { paymentMethods } from "@/lib/validation";

type FormState = {
  customer_name: string;
  phone: string;
  whatsapp: string;
  product_name: string;
  quantity: string;
  address: string;
  city: string;
  payment_method: string;
  message: string;
};

const initialState: FormState = {
  customer_name: "",
  phone: "",
  whatsapp: "",
  product_name: "",
  quantity: "",
  address: "",
  city: "",
  payment_method: "",
  message: ""
};

export function OrderForm({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const selectedProduct = searchParams.get("product") || "";
  const [form, setForm] = useState<FormState>({ ...initialState, product_name: selectedProduct });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successLink, setSuccessLink] = useState("");

  const message = useMemo(
    () =>
      [
        "New bulk order enquiry",
        `Name: ${form.customer_name}`,
        `Phone: ${form.phone}`,
        `WhatsApp: ${form.whatsapp}`,
        `Product: ${form.product_name}`,
        `Quantity: ${form.quantity}`,
        `City: ${form.city}`,
        `Payment: ${form.payment_method}`,
        `Address: ${form.address}`,
        form.message ? `Message: ${form.message}` : ""
      ]
        .filter(Boolean)
        .join("\n"),
    [form]
  );

  function updateField(name: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessLink("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.fieldErrors || { form: data.error || "Unable to submit order. Please try again." });
        return;
      }

      const link = buildWhatsAppLink(message);
      setSuccessLink(link);
      window.open(link, "_blank", "noopener,noreferrer");
      setForm(initialState);
    } catch {
      setErrors({ form: "Unable to reach the server. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="premium-shadow">
      <CardContent className="p-6 md:p-8">
        {errors.form ? <p className="mb-5 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{errors.form}</p> : null}
        {successLink ? (
          <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-5 w-5" /> Order enquiry saved successfully.
            </div>
            <a className="mt-3 inline-flex text-sm font-semibold underline" href={successLink} target="_blank" rel="noopener noreferrer">
              Open WhatsApp message again
            </a>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Customer name" error={errors.customer_name}>
              <Input value={form.customer_name} onChange={(event) => updateField("customer_name", event.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Phone number" error={errors.phone}>
              <Input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} inputMode="numeric" placeholder="10 digit mobile" />
            </Field>
            <Field label="WhatsApp number" error={errors.whatsapp}>
              <Input value={form.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} inputMode="numeric" placeholder="10 digit WhatsApp" />
            </Field>
            <Field label="Product" error={errors.product_name}>
              <Select value={form.product_name} onValueChange={(value) => updateField("product_name", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.slug} value={product.name}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Quantity" error={errors.quantity}>
              <Input value={form.quantity} onChange={(event) => updateField("quantity", event.target.value)} placeholder="Example: 25kg / 100 boxes" />
            </Field>
            <Field label="Delivery city" error={errors.city}>
              <Input value={form.city} onChange={(event) => updateField("city", event.target.value)} placeholder="City" />
            </Field>
          </div>

          <Field label="Delivery address" error={errors.address}>
            <Textarea value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Full delivery address" />
          </Field>

          <Field label="Payment method" error={errors.payment_method}>
            <Select value={form.payment_method} onValueChange={(value) => updateField("payment_method", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Extra message" error={errors.message}>
            <Textarea value={form.message} onChange={(event) => updateField("message", event.target.value)} placeholder="Quality, packing or delivery notes" />
          </Field>

          <Button type="submit" variant="gold" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
            Submit & Open WhatsApp
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
