import Link from "next/link";
import Image from "next/image";
import { Boxes, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Timer, Truck } from "lucide-react";
import type { BusinessSettings } from "@/lib/business-settings";
import { buildWhatsAppLink } from "@/lib/utils";
import { TranslatedText } from "@/components/translated-text";

const productCategories = [
  { name: "Masala & Spices", href: "/products?category=Masala+%26+Spices" },
  { name: "Edible Oils", href: "/products?category=Edible+Oils" },
  { name: "Matchsticks", href: "/products?category=Matchsticks" },
  { name: "Agarbatti & Dhoop", href: "/products?category=Agarbatti" },
  { name: "Kapoor & Pooja Products", href: "/products?category=Kapoor+%26+Pooja+Products" },
  { name: "FMCG Daily Essentials", href: "/products?category=Other+FMCG+Essentials" }
];

const quickLinks = [
  { name: "Wholesale Catalogue", href: "/products" },
  { name: "Featured Brands", href: "/#brands" },
  { name: "Build Bulk Order", href: "/order" },
  { name: "About Distribution", href: "/about" },
  { name: "Contact & Enquiry", href: "/contact" }
];

export function SiteFooter({ settings }: { settings: BusinessSettings }) {
  const whatsappLink = buildWhatsAppLink(
    "Hello Gayatri Store, I would like to request wholesale rates for my store.",
    settings.whatsapp_number
  );
  const whatsappNumber = settings.contact_phone?.replace(/\D/g, "");

  return (
    <footer className="border-t border-[#1f5742] bg-[#143d2e] text-[#FFF9F0] transition-colors">
      {/* Top Banner Feature Bar */}
      <div className="border-b border-white/10 bg-[#0f3024] py-8">
        <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent">
              <Boxes className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-white"><TranslatedText id="footer.supply" /></p>
              <p className="text-xs text-[#FFF9F0]/70"><TranslatedText id="footer.supplyDescription" /></p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-white"><TranslatedText id="footer.sourcing" /></p>
              <p className="text-xs text-[#FFF9F0]/70"><TranslatedText id="footer.sourcingDescription" /></p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent">
              <Timer className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-white"><TranslatedText id="footer.quotes" /></p>
              <p className="text-xs text-[#FFF9F0]/70"><TranslatedText id="footer.quotesDescription" /></p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-white"><TranslatedText id="footer.local" /></p>
              <p className="text-xs text-[#FFF9F0]/70"><TranslatedText id="footer.localDescription" /></p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image src="/images/gayatri-store-logo.svg" alt="Gayatri Store" width={40} height={40} className="h-10 w-10 rounded-xl" />
            <span className="text-xl font-black tracking-tight text-white">
              Gayatri Store
            </span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#FFF9F0]/80">
            <TranslatedText id="footer.description" />
          </p>
          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F4C542]">
              <TranslatedText id="footer.tagline" />
            </p>
            <p className="mt-1 text-xs text-[#FFF9F0]/75">
              <TranslatedText id="footer.b2b" />
            </p>
          </div>
        </div>

        {/* Categories Column */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#F4C542]">
            <TranslatedText id="footer.categories" />
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {productCategories.map((category, index) => (
              <li key={category.name}>
                <Link
                  href={category.href}
                  className="text-[#FFF9F0]/80 transition-colors hover:text-[#F4C542]"
                >
                  <TranslatedText id={`footer.categoryNames.${index}`} />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation Links */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#F4C542]">
            <TranslatedText id="footer.navigation" />
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {quickLinks.map((link, index) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className="text-[#FFF9F0]/80 transition-colors hover:text-[#F4C542]"
                >
                  <TranslatedText id={`footer.quickLinks.${index}`} />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Column */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#F4C542]">
            <TranslatedText id="footer.support" />
          </h3>
          <div className="space-y-3 text-sm text-[#FFF9F0]/85">
            {whatsappNumber ? (
              <a
                href={`tel:+${whatsappNumber}`}
                className="flex items-center gap-3 text-white font-medium hover:text-[#F4C542] transition-colors"
              >
                <Phone className="h-4.5 w-4.5 text-[#F4C542] shrink-0" />
                <span>+{whatsappNumber}</span>
              </a>
            ) : null}

            {whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2F7554] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#398963]"
              >
                <MessageCircle className="h-4 w-4" />
                <span><TranslatedText id="footer.whatsapp" /></span>
              </a>
            ) : null}

            {settings.contact_email ? (
              <a
                href={`mailto:${settings.contact_email}`}
                className="flex items-center gap-3 hover:text-[#F4C542] transition-colors"
              >
                <Mail className="h-4.5 w-4.5 text-[#F4C542] shrink-0" />
                <span>{settings.contact_email}</span>
              </a>
            ) : null}

            {settings.business_address ? (
              <div className="flex items-start gap-3">
                <MapPin className="h-4.5 w-4.5 text-[#F4C542] shrink-0 mt-0.5" />
                <span>{settings.business_address}</span>
              </div>
            ) : null}

            {settings.business_hours ? (
              <p className="text-xs text-[#FFF9F0]/70 pt-1">
                <TranslatedText id="footer.hours" />: {settings.business_hours}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Bottom Legal / Policy Bar */}
      <div className="border-t border-white/10 bg-[#0d2a1f] py-6">
        <div className="container-page flex flex-col gap-3 text-xs text-[#FFF9F0]/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Gayatri Store. <TranslatedText id="footer.copyright" /></p>
          <div className="flex flex-wrap gap-4">
            <span><TranslatedText id="footer.nearby" /></span>
            <span>•</span>
            <span><TranslatedText id="footer.quoteTerms" /></span>
            <span>•</span>
            <span><TranslatedText id="footer.moq" /></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
