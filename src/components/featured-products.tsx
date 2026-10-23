"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Boxes, ChevronRight, MessageCircle, Send } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { TranslatedText } from "@/components/translated-text";
import { useLanguage } from "@/context/language-context";
import type { Product, ProductCataloguePage } from "@/lib/products";

export function FeaturedProducts({ whatsappLink }: { whatsappLink: string | null }) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<ProductCataloguePage["brands"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch("/api/catalogue?limit=6&offset=0", { signal: controller.signal });
        const result = await response.json() as ProductCataloguePage;
        if (!response.ok) throw new Error("Catalogue request failed");
        setProducts(result.products.slice(0, 6));
        setBrands(result.brands || []);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [retry]);

  return (
    <>
    <section id="brands" aria-busy={loading} className="border-b border-border bg-secondary/30 py-16 md:py-24 transition-colors">
      <div className="container-page">
        <SectionHeading
          eyebrow={<TranslatedText id="home.brandEyebrow" />}
          title={<TranslatedText id="home.brandHeading" />}
          description={<TranslatedText id="home.brandDescription" />}
          align="center"
        />
        {loading && brands.length === 0 ? (
          <div role="status" aria-label={t("catalogue.updateLoading")} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-3xl bg-card" />)}
          </div>
        ) : brands.length ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/products?brand=${encodeURIComponent(brand.name)}`}
                prefetch={false}
                className="group flex min-h-36 flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 break-words text-xl font-black tracking-tight text-foreground transition-colors group-hover:text-primary dark:group-hover:text-accent">
                    {brand.name}
                  </h3>
                  <span className="shrink-0 rounded-full bg-fresh/10 px-3 py-1 text-xs font-bold text-fresh">
                    <TranslatedText id="home.brandSupply" />
                  </span>
                </div>
                <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-primary dark:text-accent">
                  <span><TranslatedText id="home.browseBrand" /> {brand.name}</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-border bg-background p-8 text-center">
            <p className="text-sm font-semibold text-muted-foreground"><TranslatedText id={error ? "home.featuredLoadError" : "home.noBrands"} /></p>
            {error ? <Button type="button" variant="outline" className="mt-4" onClick={() => setRetry((count) => count + 1)}>{t("common.retry")}</Button> : null}
          </div>
        )}
      </div>
    </section>

    <section className="border-b border-border bg-card py-16 md:py-24 transition-colors">
      <div className="container-page">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow={<TranslatedText id="home.inventoryEyebrow" />}
            title={<TranslatedText id="home.inventoryTitle" />}
            description={<TranslatedText id="home.inventoryDescription" />}
          />
          <Button asChild variant="gold"><Link href="/products" className="gap-2"><TranslatedText id="home.fullCatalogue" /><ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
        {loading && products.length === 0 ? (
          <div role="status" aria-label={t("catalogue.updateLoading")} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-80 animate-pulse rounded-2xl bg-secondary/70" />)}
          </div>
        ) : products.length ? (
          <div aria-busy={loading} className={`mt-12 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-border bg-background p-8 text-center sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fresh/10 text-fresh"><Boxes className="h-7 w-7" /></div>
            <h3 className="mt-4 text-lg font-extrabold text-foreground"><TranslatedText id={error ? "home.featuredLoadError" : "home.noProducts"} /></h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground"><TranslatedText id="home.noProductsDescription" /></p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {error ? <Button type="button" variant="outline" onClick={() => setRetry((count) => count + 1)}>{t("common.retry")}</Button> : null}
              <Button asChild variant="gold"><Link href="/order"><Send className="h-4 w-4" /><TranslatedText id="home.requestQuote" /></Link></Button>
              {whatsappLink ? <Button asChild variant="outline"><a href={whatsappLink} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 text-fresh" /> WhatsApp</a></Button> : null}
            </div>
          </div>
        )}
      </div>
    </section>
    </>
  );
}
