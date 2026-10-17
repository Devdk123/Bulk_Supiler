import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone, Timer } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/utils";
import { getPublicBusinessSettings } from "@/lib/business-settings";

export const metadata: Metadata = {
  title: "Contact Wholesale Sales Desk",
  description: "Get in touch with The Bulk Supplier for wholesale prices, bulk order dispatches, and dealership queries."
};

export default async function ContactPage() {
  const settings = await getPublicBusinessSettings();
  const whatsappLink = buildWhatsAppLink(
    "Hello The Bulk Supplier, I want to discuss wholesale rates for my store.",
    settings.whatsapp_number
  );
  const whatsappNumber = settings.contact_phone?.replace(/\D/g, "");

  return (
    <section className="py-12 md:py-16">
      <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        {/* Left Column: Contact Points */}
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Direct Wholesale Support"
            title="Connect With Our Godown Sales Team"
            description="Discuss rates, packing configurations, transport carriers, or request an official quotation for your store."
          />

          <div className="grid gap-4">
            {whatsappNumber ? (
              <div className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 shadow-xs">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fresh/10 text-fresh">
                  <Phone className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Phone & WhatsApp Desk
                  </p>
                  <a
                    href={`tel:+${whatsappNumber}`}
                    className="mt-1 block text-lg font-extrabold text-foreground hover:text-fresh transition-colors"
                  >
                    +{whatsappNumber}
                  </a>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Available during active godown operating hours for trade queries.
                  </p>
                </div>
              </div>
            ) : null}

            {settings.contact_email ? (
              <div className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 shadow-xs">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fresh/10 text-fresh">
                  <Mail className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Commercial Email
                  </p>
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="mt-1 block text-base font-bold text-foreground hover:text-fresh transition-colors"
                  >
                    {settings.contact_email}
                  </a>
                </div>
              </div>
            ) : null}

            {settings.business_address ? (
              <div className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 shadow-xs">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fresh/10 text-fresh">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Godown & Depot Location
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {settings.business_address}
                  </p>
                </div>
              </div>
            ) : null}

            {settings.business_hours ? (
              <div className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 shadow-xs">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fresh/10 text-fresh">
                  <Timer className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Business Hours
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {settings.business_hours}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {whatsappLink ? (
            <div className="pt-2">
              <Button asChild variant="gold" size="lg" className="w-full sm:w-auto shadow-md">
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Start Live WhatsApp Conversation</span>
                </a>
              </Button>
            </div>
          ) : null}
        </div>

        {/* Right Column: Contact Form */}
        <div>
          <ContactForm whatsappNumber={settings.whatsapp_number} />
        </div>
      </div>
    </section>
  );
}
