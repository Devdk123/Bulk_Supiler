import type { Metadata } from "next";
import { MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/utils";
import { getPublicBusinessSettings } from "@/lib/business-settings";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact The Bulk Supplier for wholesale product rates and bulk orders."
};

export default async function ContactPage() {
  const settings = await getPublicBusinessSettings();
  const whatsappLink = buildWhatsAppLink("Hello The Bulk Supplier, I want to discuss a wholesale quote.", settings.whatsapp_number);
  const whatsappNumber = settings.contact_phone?.replace(/\D/g, "");

  return (
    <section className="py-14">
      <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            eyebrow="Contact"
            title="Talk to us for wholesale pricing"
            description="Share your product list, city and expected quantity. We will help with rate, packing and delivery details."
          />
          {whatsappNumber ? (
            <div className="mt-8 grid gap-4">
              <Info icon={Phone} label="Phone / WhatsApp" value={`+${whatsappNumber}`} />
            </div>
          ) : null}
          {settings.contact_email || settings.business_address || settings.business_hours || settings.delivery_coverage ? (
            <div className="mt-4 grid gap-3">
              {settings.contact_email ? <p><strong>Email:</strong> {settings.contact_email}</p> : null}
              {settings.business_address ? <p><strong>Address:</strong> {settings.business_address}</p> : null}
              {settings.business_hours ? <p><strong>Hours:</strong> {settings.business_hours}</p> : null}
              {settings.delivery_coverage ? <p><strong>Delivery coverage:</strong> {settings.delivery_coverage}</p> : null}
            </div>
          ) : null}
          {whatsappLink ? (
            <Button asChild variant="gold" size="lg" className="mt-8">
              <a href={whatsappLink} target="_blank" rel="noreferrer">
                <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
              </a>
            </Button>
          ) : null}
        </div>
        <ContactForm whatsappNumber={settings.whatsapp_number} />
      </div>
    </section>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex gap-4 rounded-lg border bg-white p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-bold text-primary">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}
