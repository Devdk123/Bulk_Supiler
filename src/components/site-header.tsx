"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Menu, MessageCircle, Moon, PackageCheck, Search, Sun, User, X } from "lucide-react";
import { useState, useSyncExternalStore, FormEvent, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn, buildWhatsAppLink } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { LanguageSelector } from "@/components/language-selector";
import { InstallPrompt } from "@/components/install-prompt";
import { useLanguage } from "@/context/language-context";
import { LocalizedCatalogueLabel } from "@/components/localized-product-description";
import type { ProductCataloguePage } from "@/lib/products";

type QuickCategory = Pick<ProductCataloguePage["categories"][number], "name" | "name_hi">;

const links = [
  { href: "/", label: "nav.home" },
  { href: "/products", label: "nav.products" },
  { href: "/#categories", label: "nav.categories" },
  { href: "/#brands", label: "nav.brands" },
  { href: "/order", label: "nav.bulkOrder" },
  { href: "/about", label: "nav.about" },
  { href: "/contact", label: "nav.contact" }
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
  const [quickCategories, setQuickCategories] = useState<QuickCategory[]>([]);
  const [quickCategoriesLoading, setQuickCategoriesLoading] = useState(false);
  const [quickCategoriesLoaded, setQuickCategoriesLoaded] = useState(false);
  const { user, profile } = useAuth();
  const { t } = useLanguage();
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

  function toggleMobileMenu() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (!nextOpen || quickCategoriesLoaded || quickCategoriesLoading) return;

    setQuickCategoriesLoading(true);
    void fetch("/api/catalogue?limit=1&offset=0")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load categories");
        const result = await response.json() as ProductCataloguePage;
        setQuickCategories(result.categories || []);
      })
      .catch(() => setQuickCategories([]))
      .finally(() => {
        setQuickCategoriesLoaded(true);
        setQuickCategoriesLoading(false);
      });
  }

  return (
    <>
      {/* 3A. Modern Announcement Strip */}
      <div className="border-b border-[#1b4b38] bg-[#143d2e] px-4 py-2 text-xs font-semibold text-[#FFF9F0] transition-colors">
        <div className="container-page flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span>{t("nav.marketService")}</span>
          </div>
          <div className="hidden items-center gap-4 text-[11px] sm:flex">
            <span className="text-[#FFF9F0]/80">{t("nav.tagline")}</span>
            {whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-accent hover:underline"
              >
                <MessageCircle className="h-3 w-3" /> {t("nav.whatsappDesk")}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md transition-colors duration-200">
        <div className="container-page flex h-20 items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="group flex shrink-0 items-center focus-visible:outline-none" aria-label={`Gayatri Store ${t("nav.home")}`}>
            <Image
              src="/images/gayatri-store-wordmark.svg"
              alt="Gayatri Store Logo"
              width={215}
              height={56}
              priority
              className="h-10 w-auto transition-transform duration-300 group-hover:scale-[1.02] sm:h-12"
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
                  {t(link.label)}
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
                placeholder={t("search.placeholder")}
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-8 text-xs font-medium text-foreground placeholder:text-muted-foreground/70 transition-all focus:border-fresh focus:outline-none focus:ring-1 focus:ring-fresh"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden rounded border border-border bg-secondary/80 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground lg:inline-block">
                /
              </kbd>
            </form>
          </div>

          {/* Actions & Buttons */}
          <div className="hidden items-center gap-2.5 xl:flex">
            <LanguageSelector compact />
            <span className="hidden sm:inline-flex"><InstallPrompt /></span>
            {/* Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={t(theme === "dark" ? "theme.switchToLight" : "theme.switchToDark")}
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
                <span>{user ? (profile?.business_name || profile?.full_name?.split(" ")[0] || t("nav.account")) : t("nav.signIn")}</span>
              </Link>
            </Button>

            {/* High-visibility Request a Quote action */}
            <Button asChild variant="gold" size="sm" className="h-10 rounded-xl px-4 font-bold shadow-xs">
              <Link href="/order" className="gap-2">
                <PackageCheck className="h-4 w-4" />
                <span>{t("nav.requestQuote")}</span>
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
          <LanguageSelector compact />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t(open ? "nav.closeMenu" : "nav.openMenu")}
            aria-expanded={open}
            onClick={toggleMobileMenu}
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
                placeholder={t("search.mobilePlaceholder")}
                className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-fresh focus:outline-none focus:ring-1 focus:ring-fresh"
              />
            </form>

            {/* Quick Search Chips */}
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-muted-foreground">{t("search.quick")}</span>
              {quickCategoriesLoading ? <span role="status" className="text-xs text-muted-foreground">{t("search.loadingCategories")}</span> : null}
              {quickCategories.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => {
                    router.push(`/products?category=${encodeURIComponent(category.name)}`);
                    setOpen(false);
                  }}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:border-fresh hover:text-fresh"
                >
                  <LocalizedCatalogueLabel english={category.name} hindi={category.name_hi || null} />
                </button>
              ))}
              {quickCategoriesLoaded && quickCategories.length === 0 ? <Link href="/products" onClick={() => setOpen(false)} className="text-xs font-semibold text-fresh">{t("search.browseAll")}</Link> : null}
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
                    <span>{t(link.label)}</span>
                    <ArrowRight className="h-4 w-4 opacity-40" />
                  </Link>
                );
              })}
            </nav>

            {/* Mobile CTAs */}
            <div className="mt-5 grid gap-2.5 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
                <span className="text-sm font-semibold text-foreground">{t("theme.label")}</span>
                <div className="flex items-center gap-2">
                  <InstallPrompt showLabel />
                  <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={t(theme === "dark" ? "theme.switchToLight" : "theme.switchToDark")}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground"
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
              <Button asChild variant="outline" size="lg" className="w-full justify-center">
                <Link href={user ? "/account" : "/login"} onClick={() => setOpen(false)}>
                  <User className={`h-5 w-5 mr-1.5 ${user ? "text-fresh" : ""}`} />
                  <span>{user ? t("nav.account") : t("account.signIn")}</span>
                </Link>
              </Button>

              <Button asChild variant="gold" size="lg" className="w-full justify-center">
                <Link href="/order" onClick={() => setOpen(false)}>
                  <PackageCheck className="h-5 w-5" /> {t("nav.buildQuote")}
                </Link>
              </Button>

              {whatsappLink ? (
                <Button asChild variant="outline" size="lg" className="w-full justify-center border-fresh/30 text-fresh hover:bg-fresh/10">
                  <a href={whatsappLink} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-5 w-5 text-fresh" /> {t("nav.whatsapp")}
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
