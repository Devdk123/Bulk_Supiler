import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle, PackageSearch, Send, ShieldCheck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { getStoreProducts } from "@/lib/products";
import { getPublicBusinessSettings } from "@/lib/business-settings";
import { buildWhatsAppLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wholesale Catalogue and Bulk Quotes",
  description: "Browse published wholesale products and request a multi-product quotation."
};

export default async function HomePage() {
  const products = await getStoreProducts({ limit: 6 });
  const businessSettings = await getPublicBusinessSettings();
  const brands = [...new Set(products.map((product) => product.brandName).filter((brand): brand is string => Boolean(brand)))];
  const categories = [...new Set(products.map((product) => product.categoryName).filter((category): category is string => Boolean(category)))];
  const whatsappLink = buildWhatsAppLink("Hello, I would like to request a wholesale quote.", businessSettings.whatsapp_number);

  return (
    <>
      <section className="border-b bg-secondary/60 py-16 md:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full border bg-background px-4 py-2 text-sm font-bold uppercase tracking-[0.14em] text-primary">
              Business catalogue
            </p>
            <h1 className="text-4xl font-extrabold leading-tight text-primary md:text-6xl">
              Wholesale products, quoted to your requirements.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Browse verified published products, build a multi-item enquiry, and request current pricing and fulfilment details.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="gold" size="lg">
                <Link href="/products">
                  <PackageSearch className="h-5 w-5" /> Explore wholesale catalogue
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/order">
                  <Send className="h-5 w-5" /> Request bulk quote
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 rounded-xl border bg-card p-6 premium-shadow">
            <div className="flex gap-4">
              <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-accent" />
              <div>
                <h2 className="font-bold text-primary">Catalogue details are configurable</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Published product information is managed from the admin catalogue.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <MessageCircle className="mt-1 h-6 w-6 shrink-0 text-accent" />
              <div>
                <h2 className="font-bold text-primary">A quote is not an order confirmation</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Final price, quantity and delivery arrangements are confirmed separately.
                </p>
              </div>
            </div>
            {whatsappLink ? (
              <Button asChild variant="outline" className="mt-1 w-fit">
                <a href={whatsappLink} target="_blank" rel="noreferrer">
                  WhatsApp contact <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {brands.length || categories.length ? (
        <section className="py-12">
          <div className="container-page grid gap-8 md:grid-cols-2">
            {brands.length ? <Taxonomy title="Published brands" items={brands} /> : null}
            {categories.length ? <Taxonomy title="Browse categories" items={categories} /> : null}
          </div>
        </section>
      ) : null}

      <section className="py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Published catalogue"
            title="Products available for quotation"
            description="Only products published by an administrator appear here. Product availability and price are shown only when verified and configured."
          />
          {products.length ? (
            <div className="mt-10 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-dashed bg-card p-8 text-center">
              <p className="font-semibold text-primary">The catalogue is being prepared.</p>
              <p className="mt-2 text-sm text-muted-foreground">Please check back after products have been published.</p>
            </div>
          )}
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/products">View full catalogue <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-white">
        <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="font-bold uppercase tracking-[0.16em] text-accent">How quotes work</p>
            <h2 className="mt-3 text-3xl font-extrabold">A clear enquiry, followed by confirmation.</h2>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              "Select published products and quantities",
              "Submit business contact and delivery details",
              "Discuss availability, pricing and fulfilment"
            ].map((step, index) => (
              <li key={step} className="rounded-lg border border-white/20 bg-white/10 p-5">
                <span className="text-sm font-bold text-accent">0{index + 1}</span>
                <p className="mt-3 font-semibold leading-6">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-14">
        <div className="container-page flex flex-col gap-5 rounded-xl border bg-card p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bold uppercase tracking-[0.16em] text-accent">Need a quotation?</p>
            <h2 className="mt-2 text-2xl font-extrabold text-primary">Send products and quantities in one request.</h2>
          </div>
          <Button asChild variant="gold" size="lg">
            <Link href="/order">Start quote request <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Taxonomy({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border bg-card px-3 py-2 text-sm font-semibold text-primary">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
