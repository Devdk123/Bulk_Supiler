"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, PackageCheck, Search, User } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

export function MobileWholesaleDock({ whatsappNumber }: { whatsappNumber: string }) {
  const pathname = usePathname();
  const { user } = useAuth();
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
    <div className="fixed inset-x-0 bottom-0 z-40 block border-t border-border bg-card/95 px-3 py-2 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between gap-1.5">
        <Link
          href="/products"
          className={`flex flex-1 flex-col items-center justify-center rounded-xl py-1 text-[11px] font-bold transition-colors ${
            isProducts
              ? "bg-fresh/15 text-fresh"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="mb-0.5 h-4 w-4" />
          <span>Catalogue</span>
        </Link>

        <Link
          href={user ? "/account" : "/login"}
          className={`flex flex-1 flex-col items-center justify-center rounded-xl py-1 text-[11px] font-bold transition-colors ${
            isAccount
              ? "bg-fresh/15 text-fresh"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="mb-0.5 h-4 w-4" />
          <span>{user ? "Account" : "Sign In"}</span>
        </Link>

        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 flex-col items-center justify-center rounded-xl py-1 text-[11px] font-bold text-muted-foreground transition-colors hover:text-[#25D366]"
          >
            <MessageCircle className="mb-0.5 h-4 w-4 text-[#25D366]" />
            <span>WhatsApp</span>
          </a>
        ) : null}

        <Link
          href="/order"
          className={`flex flex-[1.3] items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold shadow-xs transition-transform active:scale-95 ${
            isOrder
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground"
          }`}
        >
          <PackageCheck className="h-4 w-4 shrink-0" />
          <span>Build Quote</span>
        </Link>
      </div>
    </div>
  );
}

