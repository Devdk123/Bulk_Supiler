import type { Metadata } from "next";
import { MapPin, MessageCircle, Phone, Timer, Truck } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact The Bulk Supplier for wholesale product rates and bulk orders."
};

export default function ContactPage() {
  return (
    <section className="py-14">
      <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            eyebrow="Contact"
            title="Talk to us for wholesale pricing"
            description="Share your product list, city and expected quantity. We will help with rate, packing and delivery details."
          />
          <div className="mt-8 grid gap-4">
            <Info icon={Phone} label="Mobile number" value="+91 98394 50586" />
            <Info icon={MessageCircle} label="WhatsApp number" value="+91 98394 50586" />
            <Info icon={MapPin} label="Godown address" value="The Bulk Supplier Godown, India" />
            <Info icon={Timer} label="Timing" value="9 AM - 7 PM" />
            <Info icon={Truck} label="Delivery area" value="Bulk supply and transport support across India" />
          </div>
          <Button asChild variant="gold" size="lg" className="mt-8">
            <a
              href={buildWhatsAppLink("Hello The Bulk Supplier, I want to discuss a wholesale order.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
            </a>
          </Button>
        </div>
        <ContactForm />
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
