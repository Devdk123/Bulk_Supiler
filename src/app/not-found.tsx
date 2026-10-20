import Link from "next/link";
import { ArrowLeft, Home, Search, PackageCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const quickCategories = [
    { name: "Spices & Masala", href: "/products?category=masala" },
    { name: "Edible Oils", href: "/products?category=oil" },
    { name: "Agarbatti & Dhoop", href: "/products?category=agarbatti" },
    { name: "Matchsticks", href: "/products?category=match" }
  ];

  return (
    <section className="flex min-h-[70vh] items-center justify-center py-16 px-4">
      <div className="mx-auto max-w-xl text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-accent/15 dark:text-accent">
          <AlertCircle className="h-8 w-8" />
        </div>

        <p className="mt-6 text-xs font-extrabold uppercase tracking-widest text-fresh">
          404 — Page Not Found
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          We Couldn&apos;t Find That Page
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          The product or page you are looking for might have been moved, updated, or is temporarily out of stock in our wholesale inventory.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="gold" size="lg">
            <Link href="/" className="gap-2">
              <Home className="h-4 w-4" />
              <span>Return Home</span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link href="/products" className="gap-2">
              <Search className="h-4 w-4" />
              <span>Browse Catalogue</span>
            </Link>
          </Button>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-left shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Explore Wholesale Categories
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {quickCategories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-fresh hover:text-fresh"
              >
                <PackageCheck className="h-3.5 w-3.5 text-fresh" />
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

