import Link from "next/link";
import { MessageCircle, Phone, Timer } from "lucide-react";
import type { BusinessSettings } from "@/lib/business-settings";
import { buildWhatsAppLink } from "@/lib/utils";

export function SiteFooter({ settings }: { settings: BusinessSettings }) {
  const whatsappLink = buildWhatsAppLink("Hello, I want wholesale rates.", settings.whatsapp_number);
  const whatsappNumber = settings.contact_phone?.replace(/\D/g, "");

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <h2 className="text-2xl font-extrabold">The Bulk Supplier</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/75">
            Wholesale catalogue and quotation requests for business buyers.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-accent">Quick Links</h3>
          <div className="mt-4 grid gap-3 text-sm text-white/75">
            <Link href="/products">Products</Link>
            <Link href="/order">Place Order</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-accent">Contact</h3>
          <div className="mt-4 grid gap-3 text-sm text-white/75">
            {settings.contact_email ? <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a> : null}
            {settings.business_address ? <p>{settings.business_address}</p> : null}
            {settings.business_hours ? <p>{settings.business_hours}</p> : null}
            {settings.delivery_coverage ? <p>{settings.delivery_coverage}</p> : null}
            {whatsappNumber ? (
              <a className="flex items-center gap-2" href={`tel:+${whatsappNumber}`}>
                <Phone className="h-4 w-4 text-accent" /> +{whatsappNumber}
              </a>
            ) : null}
            {whatsappLink ? (
              <a className="flex items-center gap-2" href={whatsappLink} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4 text-accent" /> WhatsApp
              </a>
            ) : null}
            <Link href="/order" className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-accent" /> Request a quotation
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5">
        <div className="container-page flex flex-col gap-2 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 The Bulk Supplier. All rights reserved.</p>
          <p>Retail orders not available. Only bulk supply.</p>
        </div>
      </div>
    </footer>
  );
}
