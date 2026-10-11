"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildWhatsAppLink } from "@/lib/utils";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [error, setError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.name.trim().length < 2 || !/^[6-9]\d{9}$/.test(form.phone) || form.message.trim().length < 8) {
      setError("Please enter a valid name, 10 digit phone number and message.");
      return;
    }
    setError("");
    window.open(
      buildWhatsAppLink(`Contact enquiry\nName: ${form.name}\nPhone: ${form.phone}\nMessage: ${form.message}`),
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <Card className="premium-shadow">
      <CardContent className="p-6 md:p-8">
        <h2 className="text-2xl font-extrabold text-primary">Send enquiry</h2>
        <form onSubmit={submit} className="mt-6 grid gap-5">
          {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" />
          </div>
          <div className="grid gap-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} inputMode="numeric" placeholder="10 digit mobile" />
          </div>
          <div className="grid gap-2">
            <Label>Message</Label>
            <Textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Tell us product and quantity" />
          </div>
          <Button type="submit" variant="gold">
            <Send className="h-4 w-4" /> Send on WhatsApp
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
