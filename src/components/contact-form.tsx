"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildWhatsAppLink } from "@/lib/utils";

export function ContactForm({ whatsappNumber }: { whatsappNumber: string }) {
  const [form, setForm] = useState({ name: "", phone: "", city: "", message: "" });
  const [error, setError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.name.trim().length < 2 || !/^[6-9]\d{9}$/.test(form.phone) || form.message.trim().length < 5) {
      setError("Please enter your name, a valid 10-digit Indian phone number, and a short message.");
      return;
    }
    const messageLines = [
      "Quick Wholesale Inquiry",
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      form.city ? `City: ${form.city}` : "",
      `Requirements: ${form.message}`
    ].filter(Boolean).join("\n");

    const link = buildWhatsAppLink(messageLines, whatsappNumber);
    if (!link) {
      setError("WhatsApp sales channel is currently unavailable. Please submit a bulk quote instead.");
      return;
    }
    setError("");
    window.open(link, "_blank", "noopener,noreferrer");
  }

  return (
    <Card className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
      <CardContent className="p-6 md:p-10">
        <h2 className="text-2xl font-extrabold text-foreground">
          Send a Quick Inquiry
        </h2>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Fill in your store details and product list. Your message will be sent directly to our WhatsApp sales desk.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {error ? (
            <p className="rounded-xl border border-vermilion/30 bg-vermilion/10 p-3.5 text-xs font-semibold text-vermilion">
              {error}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Your Name / Shop Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ramesh Patel / Patel Provision Store"
              className="rounded-xl"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Mobile Number</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">City / Town</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Surat, Jaipur, Nagpur"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Products & Quantities Required</Label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Mention product categories (e.g. Chilli powder 5 cartons, safety matches 20 bundles, mustard oil 10 tins)..."
              className="rounded-xl min-h-[90px]"
            />
          </div>

          <Button type="submit" variant="gold" size="lg" className="w-full justify-center shadow-md">
            <MessageCircle className="h-5 w-5" />
            <span>Chat Directly on WhatsApp</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
