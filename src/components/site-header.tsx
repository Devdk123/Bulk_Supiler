"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Menu, MessageCircle, Moon, PackageCheck, Search, Sun, User, X } from "lucide-react";
import { useState, useSyncExternalStore, FormEvent, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn, buildWhatsAppLink } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/#categories", label: "Categories" },
  { href: "/#brands", label: "Brands" },
  { href: "/order", label: "Bulk Order" },
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, profile } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => "light");
  const whatsappLink = buildWhatsAppLink("Hello Gayatri Store, I want to request a wholesale quote for my store.", whatsappNumber);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("gayatristore-theme", nextTheme);
    localStorage.setItem("bulk-supplier-theme", nextTheme);
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setOpen(false);
    }
  }

  return (
    <>
      {/* 3A. Modern Announcement Strip */}
      <div className="border-b border-[#1b4b38] bg-[#143d2e] px-4 py-2 text-xs font-semibold text-[#FFF9F0] transition-colors">
        <div className="container-page flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span>Serving Maya Bazar &amp; Nearby Markets • Wholesale Inquiries &amp; Godown Supply</span>
          </div>
          <div className="hidden items-center gap-4 text-[11px] sm:flex">
            <span className="text-[#FFF9F0]/80">Har Dukaan Tak, Bharosemand Supply.</span>
            {whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-accent hover:underline"
              >
                <MessageCircle className="h-3 w-3" /> WhatsApp Desk
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md transition-colors duration-200">
        <div className="container-page flex h-20 items-center justify-between gap-4">
          <Link href="/" className="group flex shrink-0 items-center focus-visible:outline-none" aria-label="Gayatri Store home">
            <Image
              src="/images/gayatri-store-wordmark.svg"
              alt="Gayatri Store Logo"
              width={215}
              height={56}
              priority
              className="h-12 w-auto transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1.5 xl:flex">
            {links.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : link.href.startsWith("/#")
                  ? false
                  : pathname === link.href || pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-150",
                    isActive
                      ? "bg-fresh/10 text-fresh font-bold"
                      : "text-foreground/80 hover:bg-secondary hover:text-primary"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Quick Search Entry */}
          <div className="hidden items-center md:flex lg:w-56 xl:w-60">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands..."
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-8 text-xs font-medium text-foreground placeholder:text-muted-foreground/70 transition-all focus:border-fresh focus:outline-none focus:ring-1 focus:ring-fresh"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden rounded border border-border bg-secondary/80 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground lg:inline-block">
                /
              </kbd>
            </form>
          </div>

          {/* Actions & Buttons */}
          <div className="hidden items-center gap-2.5 sm:flex">
            {/* Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {theme === "dark" ? (
                <Sun className="h-4.5 w-4.5 text-accent" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-muted-foreground" />
              )}
            </button>

            {/* Account / Sign In Button */}
            <Button asChild variant="outline" size="sm" className="h-10 rounded-xl px-3.5 text-xs font-bold gap-1.5 border-border">
              <Link href={user ? "/account" : "/login"}>
                <User className={`h-4 w-4 ${user ? "text-fresh" : "text-muted-foreground"}`} />
                <span>{user ? (profile?.business_name || profile?.full_name?.split(" ")[0] || "Account") : "Sign In"}</span>
              </Link>
            </Button>

            {/* High-visibility Request a Quote action */}
            <Button asChild variant="gold" size="sm" className="h-10 rounded-xl px-4 font-bold shadow-xs">
              <Link href="/order" className="gap-2">
                <PackageCheck className="h-4 w-4" />
                <span>Request a Quote</span>
              </Link>
            </Button>
            {whatsappLink ? (
              <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex border-fresh/30 text-fresh hover:bg-fresh/10">
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="gap-1.5">
                  <MessageCircle className="h-4 w-4 text-fresh" />
                  <span>WhatsApp</span>
                </a>
              </Button>
            ) : null}
          </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 xl:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground sm:hidden"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-accent" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="rounded-xl border-border bg-background"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Responsive Mobile Drawer */}
      {open ? (
        <div className="border-t border-border bg-card shadow-lg xl:hidden animate-in slide-in-from-top-2 duration-200">
          <div className="container-page py-5">
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="relative mb-3">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, FMCG items..."
                className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-fresh focus:outline-none focus:ring-1 focus:ring-fresh"
              />
            </form>

            {/* Quick Search Chips */}
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-muted-foreground">Quick:</span>
              {["Masala", "Edible Oils", "Agarbatti", "Matchsticks", "Dhoop"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    router.push(`/products?category=${encodeURIComponent(cat)}`);
                    setOpen(false);
                  }}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:border-fresh hover:text-fresh"
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Mobile Links */}
            <nav className="grid gap-1">
              {links.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : link.href.startsWith("/#")
                    ? false
                    : pathname === link.href || pathname.startsWith(link.href + "/");

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-fresh/10 text-fresh font-bold"
                        : "text-foreground hover:bg-secondary"
                    )}
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="h-4 w-4 opacity-40" />
                  </Link>
                );
              })}
            </nav>

            {/* Mobile CTAs */}
            <div className="mt-5 grid gap-2.5 border-t border-border pt-4">
              <Button asChild variant="outline" size="lg" className="w-full justify-center">
                <Link href={user ? "/account" : "/login"} onClick={() => setOpen(false)}>
                  <User className={`h-5 w-5 mr-1.5 ${user ? "text-fresh" : ""}`} />
                  <span>{user ? "My Store Account & Enquiries" : "Sign In to Account"}</span>
                </Link>
              </Button>

              <Button asChild variant="gold" size="lg" className="w-full justify-center">
                <Link href="/order" onClick={() => setOpen(false)}>
                  <PackageCheck className="h-5 w-5" /> Build Bulk Order
                </Link>
              </Button>

              {whatsappLink ? (
                <Button asChild variant="outline" size="lg" className="w-full justify-center border-fresh/30 text-fresh hover:bg-fresh/10">
                  <a href={whatsappLink} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-5 w-5 text-fresh" /> Chat with Godown Team
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      </header>
    </>
  );
}
