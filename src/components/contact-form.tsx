"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildWhatsAppLink } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

export function ContactForm({ whatsappNumber }: { whatsappNumber: string }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", phone: "", city: "", message: "" });
  const [error, setError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.name.trim().length < 2 || !/^[6-9]\d{9}$/.test(form.phone) || form.message.trim().length < 5) {
      setError(t("contactPage.validation"));
      return;
    }
    const messageLines = [
      t("contactPage.formTitle"),
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      form.city ? `City: ${form.city}` : "",
      `Requirements: ${form.message}`
    ].filter(Boolean).join("\n");

    const link = buildWhatsAppLink(messageLines, whatsappNumber);
    if (!link) {
      setError(t("contactPage.whatsappUnavailable"));
      return;
    }
    setError("");
    window.open(link, "_blank", "noopener,noreferrer");
  }

  return (
    <Card className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
      <CardContent className="p-6 md:p-10">
        <h2 className="text-2xl font-extrabold text-foreground">
          {t("contactPage.formTitle")}
        </h2>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t("contactPage.formDescription")}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {error ? (
            <p className="rounded-xl border border-vermilion/30 bg-vermilion/10 p-3.5 text-xs font-semibold text-vermilion">
              {error}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">{t("contactPage.name")}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t("contactPage.name")}
              className="rounded-xl"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">{t("contactPage.phoneLabel")}</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                inputMode="numeric"
                maxLength={10}
                placeholder={t("orderForm.mobileHint")}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">{t("contactPage.city")}</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder={t("contactPage.city")}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">{t("contactPage.products")}</Label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder={t("contactPage.products")}
              className="rounded-xl min-h-[90px]"
            />
          </div>

          <Button type="submit" variant="gold" size="lg" className="w-full justify-center shadow-md">
            <MessageCircle className="h-5 w-5" />
            <span>{t("contactPage.submit")}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
