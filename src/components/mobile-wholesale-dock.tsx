"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, PackageCheck, Search, User } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { useQuoteCart } from "@/context/quote-cart-context";

export function MobileWholesaleDock({ whatsappNumber }: { whatsappNumber: string }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { items, hydrated } = useQuoteCart();
  const whatsappHref = buildWhatsAppLink(
    "Hello Gayatri Store, I am inquiring about wholesale product pricing and minimum order quantities.",
    whatsappNumber
  );

  // Do not render dock on administrative routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/about/admin")) {
    return null;
  }

  const isProducts = pathname.startsWith("/products");
  const isAccount = pathname.startsWith("/account") || pathname.startsWith("/login") || pathname.startsWith("/register");
  const isOrder = pathname.startsWith("/order");

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 block border-t border-border bg-card/95 px-2.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between gap-1">
        <Link
          href="/products"
          className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl py-1 text-[11px] font-bold transition-colors ${
            isProducts
              ? "bg-fresh/15 text-fresh"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="mb-0.5 h-4 w-4" />
          <span>{t("nav.catalogue")}</span>
        </Link>

        <Link
          href={user ? "/account" : "/login"}
          className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl py-1 text-[11px] font-bold transition-colors ${
            isAccount
              ? "bg-fresh/15 text-fresh"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="mb-0.5 h-4 w-4" />
          <span>{user ? t("nav.account") : t("nav.signIn")}</span>
        </Link>

        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl py-1 text-[11px] font-bold text-muted-foreground transition-colors hover:text-[#25D366]"
          >
            <MessageCircle className="mb-0.5 h-4 w-4 text-[#25D366]" />
            <span>{t("nav.whatsapp")}</span>
          </a>
        ) : null}

        <Link
          href="/order"
          className={`flex min-w-0 flex-[1.15] items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-extrabold shadow-xs transition-transform active:scale-95 sm:gap-1.5 sm:px-3 sm:text-xs ${
            isOrder
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground"
          }`}
        >
          <PackageCheck className="h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate">{t("nav.quoteShort")}{hydrated && items.length ? ` (${items.length})` : ""}</span>
        </Link>
      </div>
    </div>
  );
}

