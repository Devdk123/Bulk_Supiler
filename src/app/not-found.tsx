"use client";

import Link from "next/link";
import { Home, Search, PackageCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";

export default function NotFound() {
  const { t } = useLanguage();
  const quickCategories = [
    { name: "Masala & Spices", href: "/products?category=Masala%20%26%20Spices", key: "home.categories.0.0" },
    { name: "Edible Oils", href: "/products?category=Edible%20Oils", key: "home.categories.1.0" },
    { name: "Agarbatti", href: "/products?category=Agarbatti", key: "home.categories.3.0" },
    { name: "Matchsticks", href: "/products?category=Matchsticks", key: "home.categories.2.0" }
  ];

  return (
    <section className="flex min-h-[70vh] items-center justify-center py-16 px-4">
      <div className="mx-auto max-w-xl text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-accent/15 dark:text-accent">
          <AlertCircle className="h-8 w-8" />
        </div>

        <p className="mt-6 text-xs font-extrabold uppercase tracking-widest text-fresh">
          {t("notFound.code")}
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t("notFound.title")}
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t("notFound.description")}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="gold" size="lg">
            <Link href="/" className="gap-2">
              <Home className="h-4 w-4" />
              <span>{t("notFound.home")}</span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link href="/products" className="gap-2">
              <Search className="h-4 w-4" />
              <span>{t("notFound.catalogue")}</span>
            </Link>
          </Button>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-left shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("notFound.categories")}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {quickCategories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-fresh hover:text-fresh"
              >
                <PackageCheck className="h-3.5 w-3.5 text-fresh" />
                {t(cat.key) || cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

