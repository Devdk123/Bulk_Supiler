"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageCircle, Moon, Package2, Sun } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { cn, buildWhatsAppLink } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/order", label: "Order" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getThemeSnapshot(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function SiteHeader({ whatsappNumber }: { whatsappNumber: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => "light");
  const whatsappLink = buildWhatsAppLink("Hello The Bulk Supplier, I want to request a wholesale quote.", whatsappNumber);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("bulk-supplier-theme", nextTheme);
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/92 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-accent">
            <Package2 className="h-6 w-6" />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-extrabold text-primary">The Bulk Supplier</span>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:block">
              Direct Godown Supply
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-secondary",
                pathname === link.href ? "bg-secondary text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button type="button" variant="outline" size="icon" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {whatsappLink ? (
            <Button asChild variant="gold">
              <a href={whatsappLink} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Button type="button" variant="outline" size="icon" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} variant="outline" size="icon" onClick={() => setOpen(!open)}>
            {open ? <span aria-hidden="true">×</span> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t bg-white lg:hidden">
          <nav className="container-page grid gap-2 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-3 text-sm font-semibold",
                  pathname === link.href ? "bg-secondary text-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            {whatsappLink ? (
              <Button asChild variant="gold" className="mt-2">
                <a href={whatsappLink} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" /> Order on WhatsApp
                </a>
              </Button>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
