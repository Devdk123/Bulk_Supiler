import Link from "next/link";
import { Boxes, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Timer, Truck } from "lucide-react";
import type { BusinessSettings } from "@/lib/business-settings";
import { buildWhatsAppLink } from "@/lib/utils";

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
    "Hello The Bulk Supplier, I would like to request wholesale rates for my store.",
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
              <p className="text-sm font-bold text-white">Direct Godown Supply</p>
              <p className="text-xs text-[#FFF9F0]/70">Wholesale pricing for retail store owners</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">Multi-Category Sourcing</p>
              <p className="text-xs text-[#FFF9F0]/70">Combine spices, oils & pooja in one dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent">
              <Timer className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">Transparent Quotations</p>
              <p className="text-xs text-[#FFF9F0]/70">Clear carton rates before order confirmation</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">Verified FMCG Brands</p>
              <p className="text-xs text-[#FFF9F0]/70">Genuine packaging and batch quality</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4C542] text-[#174735]">
              <Boxes className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-white">
              The Bulk Supplier
            </span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#FFF9F0]/80">
            A trusted Indian wholesale and distribution partner supplying spices, edible oils, matchsticks, agarbatti, dhoop and everyday FMCG essentials to shopkeepers and traders.
          </p>
          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F4C542]">
              Trade Inquiries
            </p>
            <p className="mt-1 text-sm text-[#FFF9F0]/80">
              Retail orders not accepted. Dedicated exclusively to wholesale supply.
            </p>
          </div>
        </div>

        {/* Categories Column */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#F4C542]">
            Product Categories
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {productCategories.map((category) => (
              <li key={category.name}>
                <Link
                  href={category.href}
                  className="text-[#FFF9F0]/80 transition-colors hover:text-[#F4C542]"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation Links */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#F4C542]">
            Navigation
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {quickLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className="text-[#FFF9F0]/80 transition-colors hover:text-[#F4C542]"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Column */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#F4C542]">
            Direct Business Support
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
                <span>Chat on WhatsApp</span>
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
                Hours: {settings.business_hours}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Bottom Legal / Policy Bar */}
      <div className="border-t border-white/10 bg-[#0d2a1f] py-6">
        <div className="container-page flex flex-col gap-3 text-xs text-[#FFF9F0]/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} The Bulk Supplier. All commercial rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <span>B2B Quotation Terms</span>
            <span>•</span>
            <span>Fulfilment & Dispatch Policy</span>
            <span>•</span>
            <span>Wholesale MOQ Applicable</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
