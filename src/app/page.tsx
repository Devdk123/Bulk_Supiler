import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  MapPin,
  MessageCircle,
  PackageCheck,
  PackageSearch,
  Percent,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Truck
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { WholesaleCalculator } from "@/components/wholesale-calculator";
import { Button } from "@/components/ui/button";
import { getStoreProducts } from "@/lib/products";
import { getPublicBusinessSettings } from "@/lib/business-settings";
import { buildWhatsAppLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gayatri Store | B2B Wholesale FMCG & Daily Goods",
  description:
    "Direct godown wholesale supply for spices, edible oils, matchsticks, agarbatti, dhoop and everyday essentials for Maya Bazar and surrounding regional markets."
};

const categories = [
  {
    name: "Masala & Spices",
    description: "Pure turmeric, chilli, coriander, blended garam masala & whole spices",
    image: "/images/Chilli-powder.jpeg",
    slug: "Masala & Spices",
    tag: "High Demand",
    featured: true
  },
  {
    name: "Edible Oils",
    description: "Pure mustard, refined, groundnut & bulk cooking oils in tins & jars",
    image: "/images/hero-wholesale-products.jpg",
    slug: "Edible Oils",
    tag: "Bulk Tins & Jars",
    featured: false
  },
  {
    name: "Matchsticks",
    description: "Safety matchboxes, moisture-resistant splints & master bundle cartons",
    image: "/images/Match-Stick.png",
    slug: "Matchsticks",
    tag: "Master Cartons",
    featured: false
  },
  {
    name: "Agarbatti",
    description: "Floral, chandan, mogra, gulab & long-burning incense bamboo sticks",
    image: "/images/agarbatti.jpeg",
    slug: "Agarbatti",
    tag: "Fast Moving",
    featured: true
  },
  {
    name: "Dhoop",
    description: "Wet & dry dhoop batti, cones, hawan cups & aromatic pooja samagri",
    image: "/images/hero-wholesale-products.jpg",
    slug: "Dhoop",
    tag: "Devotional",
    featured: false
  },
  {
    name: "Kapoor & Pooja Products",
    description: "Pure camphor tablets, pooja cotton wicks, roli, chandan & hawan items",
    image: "/images/Pansari.jpg",
    slug: "Kapoor & Pooja Products",
    tag: "Mandir & Home",
    featured: false
  },
  {
    name: "Other FMCG Essentials",
    description: "Tea patti, salt, daily provisions & high-movement counter items",
    image: "/images/tea-patti.jpeg",
    slug: "Other FMCG Essentials",
    tag: "Daily Goods",
    featured: false
  }
];

const featuredBrands = [
  {
    name: "Jhaveri's Mast!",
    category: "Masalas & Ground Spices",
    highlight: "Authentic spice blends with verified aroma and batch consistency",
    badge: "Spices"
  },
  {
    name: "Kisan",
    category: "Matchsticks & Essentials",
    highlight: "Long-standing safety matches with reliable friction striker heads",
    badge: "Matchsticks"
  },
  {
    name: "Bharat Jyoti",
    category: "Edible Oils",
    highlight: "Wholesale cooking oils packaged in durable tins and retail bottles",
    badge: "Cooking Oils"
  },
  {
    name: "Bhola",
    category: "FMCG Trade Goods",
    highlight: "Consistent movement daily retail goods for grocery & general stores",
    badge: "FMCG Staples"
  },
  {
    name: "GrahShanti",
    category: "Aromatic Dhoop",
    highlight: "Long-lasting spiritual fragrances popular in regional retail counters",
    badge: "Dhoop Batti"
  },
  {
    name: "Sukoon",
    category: "Devotional Agarbatti",
    highlight: "Reliable quality incense packs with dependable wholesale retailer margins",
    badge: "Agarbatti"
  }
];

const processSteps = [
  {
    number: "01",
    title: "Browse the Catalogue",
    description: "Explore our verified inventory across spices, oils, matches, agarbatti, and daily goods with clear carton packaging."
  },
  {
    number: "02",
    title: "Select Products & Quantities",
    description: "Add items to your bulk order with carton or unit counts tailored to your retail shop's weekly requirement."
  },
  {
    number: "03",
    title: "Confirm Pricing & Fulfilment",
    description: "Receive an itemized wholesale quotation from our godown team, verify live lot availability, and coordinate dispatch."
  }
];

const advantages = [
  {
    icon: Boxes,
    title: "Multi-Category Sourcing",
    description: "Consolidate spices, cooking oils, matchboxes, and pooja supplies into a single delivery, reducing multiple vendor hassles."
  },
  {
    icon: MapPin,
    title: "Maya Bazar & Local Reach",
    description: "Dedicated to independent grocers and general store owners across Maya Bazar and nearby regional markets (~50+ km radius)."
  },
  {
    icon: Percent,
    title: "Direct Godown Margins",
    description: "Transparent B2B rates with healthy profit margins structured specifically for retail shop economics and wholesale traders."
  },
  {
    icon: MessageCircle,
    title: "Direct WhatsApp & Phone Support",
    description: "Prompt, human-first business communication to verify stock availability, dispatch timelines, and GST tax invoice queries."
  }
];

export default async function HomePage() {
  const [products, businessSettings] = await Promise.all([
    getStoreProducts({ limit: 6 }),
    getPublicBusinessSettings()
  ]);

  const whatsappLink = buildWhatsAppLink(
    "Hello Gayatri Store, I want to discuss wholesale rates for my store.",
    businessSettings.whatsapp_number
  );

  return (
    <div className="flex flex-col gap-0">
      {/* 1. SIGNATURE SPLIT-LAYOUT HERO (LIGHT-FIRST EDITORIAL) */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-[#FFF9F0] to-[#F8F1E3] py-12 md:py-20 lg:py-24 transition-colors">
        <div className="container-page">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.95fr] lg:gap-14">
            {/* Left side (approx 55% space) */}
            <div className="flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary dark:border-accent/40 dark:bg-accent/10 dark:text-accent">
                <Store className="h-3.5 w-3.5" />
                <span>YOUR LOCAL WHOLESALE PARTNER</span>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-primary sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.12] dark:text-[#F4C542]">
                Big Variety. Better Supply.
                <br />
                <span className="text-[#347754] dark:text-[#52B47F]">Built for Your Business.</span>
              </h1>

              <p className="mt-5 text-base leading-relaxed text-[#252A24]/85 sm:text-lg dark:text-[#F8F4EC]/85 max-w-xl">
                Discover wholesale products across spices, edible oils, matchsticks, agarbatti, dhoop and everyday essentials. Build your product list and request a quote from Gayatri Store.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button asChild variant="gold" size="lg" className="h-12 rounded-xl px-7 text-sm font-extrabold shadow-md hover:shadow-lg transition-all">
                  <Link href="/products" className="gap-2">
                    <PackageSearch className="h-4.5 w-4.5" />
                    <span>Explore Products</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg" className="h-12 rounded-xl border-primary/25 bg-card px-6 text-sm font-bold text-primary hover:bg-secondary dark:border-border dark:text-foreground">
                  <Link href="/order" className="gap-2">
                    <PackageCheck className="h-4.5 w-4.5 text-[#347754]" />
                    <span>Build Bulk Order</span>
                  </Link>
                </Button>
              </div>

              {/* Supporting Trust Note */}
              <div className="mt-8 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-semibold text-[#666D64] dark:text-[#A6AEA4]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#347754]" /> Wholesale enquiries
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#347754]" /> Multiple product categories
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#347754]" /> Direct business support
                </span>
              </div>

              {/* Local Area Verification Tag */}
              <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 px-3.5 py-2 text-xs font-medium text-foreground shadow-xs">
                <MapPin className="h-3.5 w-3.5 text-[#E66A50] shrink-0" />
                <span>
                  Supplying kirana shops &amp; retail stores across <strong>Maya Bazar</strong> and nearby regional markets (~50+ km).
                </span>
              </div>
            </div>

            {/* Right side (approx 45% space) */}
            <div className="relative">
              {/* Decorative warm aura */}
              <div className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-tr from-[#F4C542]/20 via-[#347754]/15 to-transparent blur-xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-[#EAE3D7] bg-card p-3 shadow-xl dark:border-[#2B3D34]">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-secondary/50">
                  <Image
                    src="/images/hero-wholesale-products.jpg"
                    alt="Gayatri Store wholesale merchandise featuring spices, edible oils, matchsticks, and incense"
                    fill
                    priority
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-cover object-center transition-transform duration-700 hover:scale-105"
                  />
                </div>

                {/* Floating badge */}
                <div className="mt-3 flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary dark:text-accent">
                    <Sparkles className="h-4 w-4 text-[#F4C542]" />
                    <span>Fresh Godown Lots • Direct Wholesale Supply</span>
                  </div>
                  <span className="rounded-md bg-fresh/10 px-2 py-0.5 text-[11px] font-bold text-fresh">
                    B2B Trade
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION A: EXPLORE CATEGORIES (EDITORIAL ASYMMETRICAL GRID) */}
      <section id="categories" className="border-b border-border bg-card py-16 md:py-24 transition-colors">
        <div className="container-page">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <SectionHeading
              eyebrow="Category Directory"
              title="Explore Wholesale Product Categories"
              description="Sourced from verified processing hubs and master packaging godowns. Pick a category to browse inventory and request instant quotations."
            />
            <Button asChild variant="outline" className="w-fit">
              <Link href="/products" className="gap-2">
                <span>View All Products</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Asymmetrical / Editorial Category Grid */}
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((cat, index) => {
              const isLarge = index === 0 || index === 3;
              return (
                <Link
                  key={cat.name}
                  href={`/products?category=${encodeURIComponent(cat.slug)}`}
                  prefetch={false}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-background p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#347754]/50 hover:shadow-lg ${
                    isLarge ? "sm:col-span-2 lg:col-span-1 xl:col-span-1" : ""
                  }`}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-secondary/40">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-108"
                    />
                    <div className="absolute top-3 left-3 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-bold text-primary shadow-xs backdrop-blur-xs">
                      {cat.tag}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-base font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary dark:group-hover:text-accent">
                        {cat.name}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {cat.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-fresh group-hover:underline">
                      <span>Browse Wholesale Lots</span>
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. SECTION B: FEATURED BRANDS */}
      <section id="brands" className="border-b border-border bg-secondary/30 py-16 md:py-24 transition-colors">
        <div className="container-page">
          <SectionHeading
            eyebrow="Verified Suppliers"
            title="Featured Wholesale Brands"
            description="We stock established regional and national FMCG brand lines with reliable batch quality and retail counter demand."
            align="center"
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredBrands.map((brand) => (
              <Link
                key={brand.name}
                href={`/products?brand=${encodeURIComponent(brand.name)}`}
                prefetch={false}
                className="group flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-fresh/10 px-3 py-1 text-xs font-bold text-fresh">
                      {brand.badge}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      B2B Supply
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black tracking-tight text-foreground group-hover:text-primary dark:group-hover:text-accent transition-colors">
                    {brand.name}
                  </h3>
                  <p className="mt-1 text-xs font-bold text-fresh">
                    {brand.category}
                  </p>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    {brand.highlight}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-primary dark:text-accent">
                  <span>Browse {brand.name} products</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SECTION C: FEATURED WHOLESALE PRODUCTS */}
      <section className="border-b border-border bg-card py-16 md:py-24 transition-colors">
        <div className="container-page">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <SectionHeading
              eyebrow="Available Inventory"
              title="Products Ready for Bulk Quotation"
              description="Live packaging specifications, master carton details, and direct enquiry actions for store owners."
            />
            <Button asChild variant="gold">
              <Link href="/products" className="gap-2">
                <span>View Full Catalogue</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {products.length > 0 ? (
            <div className="mt-12 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border border-dashed border-border bg-background p-8 text-center sm:p-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fresh/10 text-fresh">
                <Boxes className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-foreground">
                Digital Inventory Syncing
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Our active godown lots across Spices, Edible Oils, Incense, and Matches are being catalogued. You can build a custom quotation or contact the Gayatri Store team directly for live lot rates.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild variant="gold">
                  <Link href="/order">Submit Custom Quotation</Link>
                </Button>
                {whatsappLink ? (
                  <Button asChild variant="outline">
                    <a href={whatsappLink} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-4 w-4 text-fresh" /> Chat with Godown Team
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. INTERACTIVE WHOLESALE SAVINGS CALCULATOR */}
      <section className="border-b border-border bg-background py-16 md:py-24 transition-colors">
        <div className="container-page">
          <WholesaleCalculator />
        </div>
      </section>

      {/* 6. SECTION D: WHY CHOOSE GAYATRI STORE? (EDITORIAL LAYOUT) */}
      <section className="border-b border-border bg-secondary/30 py-16 md:py-24 transition-colors">
        <div className="container-page">
          <SectionHeading
            eyebrow="Commercial Value"
            title="Why Store Owners Choose Gayatri Store"
            description="Designed specifically to support independent retail grocers and trade buyers across Maya Bazar with dependable wholesale supply."
            align="center"
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((item) => (
              <div
                key={item.title}
                className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-fresh/40 hover:shadow-md"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fresh/10 text-fresh">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-base font-extrabold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. SECTION E: SIMPLE 3-STEP ORDERING EXPERIENCE */}
      <section className="border-b border-border bg-card py-16 md:py-24 transition-colors">
        <div className="container-page">
          <SectionHeading
            eyebrow="Simple 3-Step Process"
            title="How Bulk Ordering Works"
            description="A clear, transparent enquiry and fulfilment journey built for local shopkeepers and commercial traders."
            align="center"
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {processSteps.map((step) => (
              <div
                key={step.number}
                className="relative flex flex-col justify-between rounded-3xl border border-border bg-background p-8 transition-all duration-300 hover:border-fresh/40"
              >
                <div>
                  <span className="font-mono text-3xl font-black text-accent">
                    {step.number}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. SECTION F: BOLD CALL-TO-ACTION (FOREST GREEN + WARM IVORY + TURMERIC) */}
      <section className="py-16 md:py-20">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#174735] px-6 py-12 text-[#FFF9F0] shadow-2xl sm:px-12 md:py-16">
            {/* Subtle decorative background aura */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#F4C542]/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#347754]/25 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#F4C542]">
                  Direct Godown Supply • Maya Bazar
                </span>
                <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl">
                  Let&apos;s Stock Your Next Big Sale.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[#FFF9F0]/85 sm:text-lg">
                  Create a bulk enquiry for your store and discuss your requirements with Gayatri Store.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
                <Button asChild variant="gold" size="lg" className="h-12 rounded-xl px-7 font-extrabold shadow-lg">
                  <Link href="/order" className="gap-2">
                    <Send className="h-4.5 w-4.5" />
                    <span>Start a Bulk Enquiry</span>
                  </Link>
                </Button>
                {whatsappLink ? (
                  <Button asChild variant="outline" size="lg" className="h-12 rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20">
                    <a href={whatsappLink} target="_blank" rel="noreferrer" className="gap-2">
                      <MessageCircle className="h-4.5 w-4.5 text-[#F4C542]" />
                      <span>WhatsApp Rates</span>
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
