import Link from "next/link";
import { MapPin, MessageCircle, Phone, Timer } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils";

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <h2 className="text-2xl font-extrabold">The Bulk Supplier</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/75">
            Premium wholesale supply for spices, agarbatti, dhoop, tea patti, machis and daily goods. Built for shops,
            traders, caterers and bulk buyers across India.
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
            <a className="flex items-center gap-2" href="tel:+919839450586">
              <Phone className="h-4 w-4 text-accent" /> +91 98394 50586
            </a>
            <a
              className="flex items-center gap-2"
              href={buildWhatsAppLink("Hello, I want wholesale rates.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4 text-accent" /> WhatsApp Orders
            </a>
            <span className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-accent" /> 9 AM - 7 PM
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> Godown supply across India
            </span>
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
