import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeIndianRupee,
  Boxes,
  CheckCircle2,
  ClipboardList,
  MapPin,
  MessageCircle,
  MessageSquareText,
  PackageCheck,
  ShieldCheck,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { getStoreProducts } from "@/lib/products";
import { buildWhatsAppLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Wholesale Products at Best Price",
  description: "The Bulk Supplier supplies spices, agarbatti, tea and daily goods in bulk across India at wholesale rates."
};

const highlights = [
  { label: "Minimum order", value: "10kg / 50 pieces", icon: PackageCheck },
  { label: "Best wholesale rates", value: "Market-linked pricing", icon: BadgeIndianRupee },
  { label: "Direct godown supply", value: "Fresh bulk stock", icon: Boxes },
  { label: "WhatsApp order available", value: "+91 98394 50586", icon: MessageCircle },
  { label: "Bulk discount available", value: "For repeat buyers", icon: CheckCircle2 }
];

const reasons = [
  "Direct godown sourcing with dependable stock availability",
  "Bulk packing options for retailers, traders and caterers",
  "Clear MOQ, packing and quality details before confirmation",
  "WhatsApp-first ordering for fast quotations and follow-up"
];

export default async function HomePage() {
  const featuredProducts = await getStoreProducts({ limit: 6 });

  return (
    <>
      <section className="warehouse-hero relative overflow-hidden">
        <div className="container-page grid min-h-[calc(100vh-64px)] items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-3xl text-white">
            <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-accent backdrop-blur">
              Wholesale supply, made straightforward
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-normal md:text-6xl">
              Everyday essentials, sourced in bulk.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82 md:text-xl">
              Find the products your business needs, get a quote for your quantity, and arrange delivery with our team.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="gold" size="lg">
                <a
                  href={buildWhatsAppLink("Hello The Bulk Supplier, I want to place a bulk wholesale order.")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-5 w-5" /> Order on WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                <Link href="/products">
                  View Products <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-md">
            {highlights.map((item) => (
              <div key={item.label} className="flex items-center gap-4 rounded-md bg-white/92 p-4 text-primary">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-accent">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Featured stock"
            title="High movement wholesale products"
            description="Ready categories for grocery stores, kirana suppliers, puja product sellers and local distributors."
          />
          <div className="mt-10 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild>
              <Link href="/products">
                View Full Catalog <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Simple process"
            title="From product list to dispatch"
            description="A clear three-step process helps you get the right quote before confirming a bulk order."
          />
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Choose your products",
                description: "Browse the catalog and note the products, packing and quantities you need.",
                icon: ClipboardList
              },
              {
                number: "02",
                title: "Request a quote",
                description: "Send your requirement. Our team will confirm current rates and stock availability.",
                icon: MessageSquareText
              },
              {
                number: "03",
                title: "Confirm delivery",
                description: "Review the final order and arrange pickup or transport based on your city and quantity.",
                icon: Truck
              }
            ].map((step) => (
              <article key={step.number} className="rounded-xl border bg-background p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold tracking-[0.18em] text-accent">{step.number}</span>
                  <step.icon aria-hidden="true" className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-xl font-extrabold text-primary">{step.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{step.description}</p>
              </article>
            ))}
          </div>
          <Button asChild variant="gold" className="mt-7">
            <Link href="/order">
              Start an order enquiry <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="bg-primary py-16 text-white">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionHeading
            eyebrow="Delivery area"
            title="Bulk supply across India"
            description="We coordinate dispatch for city distributors, shop owners and recurring trade buyers. Delivery support depends on product quantity, city and transport availability."
            className="text-white [&_h2]:text-white [&_p]:text-white/75"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {["Local godown pickup", "City transport booking", "Carton and bag packing", "Bulk repeat supply"].map((item) => (
              <div key={item} className="rounded-lg border border-white/12 bg-white/8 p-5">
                <MapPin className="mb-4 h-6 w-6 text-accent" />
                <p className="font-bold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <SectionHeading eyebrow="Why choose us" title="Built for serious bulk buyers" />
            <div className="mt-8 grid gap-4">
              {reasons.map((reason) => (
                <div key={reason} className="flex gap-4 rounded-lg border bg-white p-5">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <p className="font-medium leading-7">{reason}</p>
                </div>
              ))}
            </div>
          </div>
          <Card className="border-accent/40 bg-[#fffaf0] premium-shadow">
            <CardContent className="p-8">
              <Truck className="h-10 w-10 text-accent" />
              <h3 className="mt-5 text-2xl font-extrabold text-primary">Bulk order only notice</h3>
              <p className="mt-4 leading-7 text-muted-foreground">
                Retail orders are not available. Please contact us for wholesale quantities, packing details and city-wise
                delivery confirmation.
              </p>
              <Button asChild variant="gold" className="mt-6">
                <Link href="/order">Create Order Lead</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-secondary py-14">
        <div className="container-page flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bold uppercase tracking-[0.18em] text-accent">Need wholesale rates?</p>
            <h2 className="mt-2 text-3xl font-extrabold text-primary">Send your product list and quantity.</h2>
          </div>
          <Button asChild variant="gold" size="lg">
            <a
              href={buildWhatsAppLink("Hello, please share wholesale rates for bulk products.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat on WhatsApp
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
