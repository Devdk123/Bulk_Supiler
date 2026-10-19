import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  MessageCircle,
  PackageSearch,
  Percent,
  Send,
  ShieldCheck
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
  title: "The Bulk Supplier | B2B Wholesale FMCG & Daily Goods",
  description: "Direct godown wholesale supply for spices, edible oils, matchsticks, agarbatti, dhoop and everyday essentials across India."
};

const categories = [
  {
    name: "Masala & Spices",
    description: "Turmeric, red chilli, coriander, garam masala & whole spices",
    image: "/images/Chilli-powder.jpeg",
    slug: "Masala & Spices",
    tag: "High Demand"
  },
  {
    name: "Edible Oils",
    description: "Pure mustard, refined, groundnut & bulk cooking oils",
    image: "/images/hero-wholesale-products.jpg",
    slug: "Edible Oils",
    tag: "Bulk Tins & Bottles"
  },
  {
    name: "Matchsticks",
    description: "Quality safety matches, moisture-resistant splints & bundles",
    image: "/images/Match-Stick.png",
    slug: "Matchsticks",
    tag: "Carton Packs"
  },
  {
    name: "Agarbatti",
    description: "Fragrant floral, chandan, mogra & premium daily incense",
    image: "/images/agarbatti.jpeg",
    slug: "Agarbatti",
    tag: "Popular"
  },
  {
    name: "Dhoop",
    description: "Wet & dry dhoop sticks, cones, sambrani cups & pooja items",
    image: "/images/hero-wholesale-products.jpg",
    slug: "Dhoop",
    tag: "Pooja Essential"
  },
  {
    name: "Kapoor & Pooja Products",
    description: "Pure camphor tablets, pooja cotton wicks, hawan samagri",
    image: "/images/Pansari.jpg",
    slug: "Kapoor & Pooja Products",
    tag: "Fast Moving"
  },
  {
    name: "Other FMCG Essentials",
    description: "Tea patti, daily groceries, salt and staple trade provisions",
    image: "/images/tea-patti.jpeg",
    slug: "Other FMCG Essentials",
    tag: "Daily Goods"
  }
];

const featuredBrands = [
  {
    name: "Jhaveri's Mast!",
    category: "Spices & Blended Masalas",
    highlight: "Authentic spice blends with verified aroma and batch consistency",
    color: "from-amber-600/15 to-amber-700/5"
  },
  {
    name: "Kisan",
    category: "Pooja Goods & Camphor",
    highlight: "Pure grade camphor, pooja essentials and household trade supplies",
    color: "from-emerald-600/15 to-emerald-700/5"
  },
  {
    name: "Bharat Jyoti",
    category: "Safety Matchsticks",
    highlight: "Trusted long-burning matchboxes packed in sturdy master cartons",
    color: "from-red-600/15 to-red-700/5"
  },
  {
    name: "Bhola",
    category: "FMCG & Trade Products",
    highlight: "Consistent movement daily retail goods for grocery & general stores",
    color: "from-yellow-600/15 to-yellow-700/5"
  },
  {
    name: "GrahShanti",
    category: "Agarbatti & Aromatic Dhoop",
    highlight: "Long-lasting spiritual fragrances popular in regional retail counters",
    color: "from-teal-600/15 to-teal-700/5"
  },
  {
    name: "Sukoon",
    category: "Household & Devotional Essentials",
    highlight: "Reliable quality consumer packs with dependable wholesale margins",
    color: "from-indigo-600/15 to-indigo-700/5"
  }
];

const processSteps = [
  {
    number: "01",
    title: "Browse & Build Your Order",
    description: "Select items across spices, edible oils, matches and pooja essentials with required carton or packet quantities."
  },
  {
    number: "02",
    title: "Submit Business Enquiry",
    description: "Share your shop or trading business details, destination city, and any specific packing or transport preferences."
  },
  {
    number: "03",
    title: "Receive Quotation & Confirm",
    description: "Our godown team verifies live stock, applies tier discounts, provides a complete rate sheet, and coordinates dispatch."
  }
];

const advantages = [
  {
    icon: Boxes,
    title: "Multiple Categories in One Order",
    description: "Combine spices, cooking oils, matchboxes and agarbatti in a single transport booking to reduce freight costs."
  },
  {
    icon: Percent,
    title: "Direct Godown Wholesale Pricing",
    description: "Competitive margins designed for retailers and distributors, with transparent tier pricing on higher carton volumes."
  },
  {
    icon: ClipboardList,
    title: "Custom Quote-Based Ordering",
    description: "No rigid checkouts. We customize rates to your specific delivery city, seasonal demand, and quantity requirements."
  },
  {
    icon: MessageCircle,
    title: "Direct Business Support",
    description: "Dedicated WhatsApp and phone support with real humans to confirm stock, dispatch tracking, and invoice details."
  }
];

export default async function HomePage() {
  const [products, businessSettings] = await Promise.all([
    getStoreProducts({ limit: 6 }),
    getPublicBusinessSettings()
  ]);
  const whatsappLink = buildWhatsAppLink(
    "Hello The Bulk Supplier, I would like to request wholesale rates for my store.",
    businessSettings.whatsapp_number
  );

  return (
    <div className="flex flex-col gap-0">
      <section className="relative isolate flex min-h-[620px] items-center overflow-hidden border-b border-primary/20 bg-[#10271d] py-20 text-white sm:min-h-[680px] lg:min-h-[720px]">
        <Image
          src="/images/hero-wholesale-products.jpg"
          alt="Indian wholesale assortment of spices, cooking oils, incense, matches and pooja essentials"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover object-[66%_center] motion-safe:animate-[hero-drift_24s_ease-in-out_infinite_alternate]"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,31,22,0.96)_0%,rgba(12,37,26,0.91)_38%,rgba(13,39,27,0.48)_70%,rgba(13,39,27,0.12)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(8,26,18,0.66)_0%,transparent_38%)]" />

        <div className="container-page w-full">
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-black/20 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.17em] text-accent backdrop-blur-sm sm:text-xs">
              <ShieldCheck className="h-4 w-4" />
              Trusted wholesale partner across India
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.04] tracking-[-0.045em] text-white sm:text-5xl md:text-6xl lg:text-[4.5rem]">
              Stock smarter.
              <br />
              <span className="text-accent">Grow your business.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg md:text-xl">
              Your trusted source for quality spices, oils, incense, pooja essentials and daily goods — all in one wholesale order.
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild variant="gold" size="lg" className="h-12 rounded-xl px-6 font-bold shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5">
                <Link href="/products" className="gap-2.5">
                  <PackageSearch className="h-5 w-5" />
                  <span>Explore Products</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-xl border-white/30 bg-white/10 px-6 font-bold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white">
                <Link href="/order" className="gap-2.5">
                  <Send className="h-4 w-4" />
                  <span>Build a Bulk Order</span>
                </Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-white/85">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Wholesale enquiries</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Multiple categories, one order</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Direct business support</span>
            </div>
          </div>
        </div>

        <div className="container-page pointer-events-none absolute inset-x-0 bottom-5 hidden justify-end sm:flex">
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-white shadow-xl backdrop-blur-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary"><Boxes className="h-5 w-5" /></span>
            <span>
              <span className="block text-sm font-bold">One trusted source</span>
              <span className="block text-xs text-white/70">Spices · Oils · Incense · Daily goods</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. SECTION A: EXPLORE CATEGORIES */}
      <section id="categories" className="border-b border-border bg-card py-16 md:py-24">
        <div className="container-page">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <SectionHeading
              eyebrow="Category Directory"
              title="Explore Wholesale Product Categories"
              description="Sourced directly from verified processors and master packaging facilities. Choose a category to browse inventory and request quotes."
            />
            <Button asChild variant="outline" className="w-fit">
              <Link href="/products" className="gap-2">
                <span>All Categories</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Category Tiles Grid */}
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((cat, index) => (
              <Link
                key={cat.name}
                href={`/products?category=${encodeURIComponent(cat.slug)}`}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-background p-5 transition-all duration-300 hover:-translate-y-1 hover:border-fresh/50 hover:shadow-lg ${
                  index === 0 ? "sm:col-span-2 lg:col-span-2" : ""
                }`}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-fresh/10 px-2.5 py-1 text-[11px] font-bold text-fresh">
                      {cat.tag}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-foreground group-hover:text-primary">
                    {cat.name}
                  </h3>
                  <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
                    {cat.description}
                  </p>
                </div>

                {/* Visual Thumbnail */}
                <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl border border-border/60 bg-secondary/30">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SECTION B: FEATURED BRANDS */}
      <section id="brands" className="border-b border-border bg-secondary/40 py-16 md:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Commercial Brand Partners"
            title="Supplied FMCG Brands"
            description="We stock and distribute genuine brand packaging across retail essentials. Click on any brand to inspect its products."
            align="center"
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredBrands.map((brand) => (
              <Link
                key={brand.name}
                href={`/products?brand=${encodeURIComponent(brand.name)}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-fresh/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-fresh">
                      {brand.category}
                    </span>
                    <span className="rounded-full bg-secondary p-1 text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-white">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-extrabold text-foreground group-hover:text-primary">
                    {brand.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {brand.highlight}
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-accent">
                  <span>Browse {brand.name} items</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SECTION C: FEATURED WHOLESALE PRODUCTS */}
      <section className="border-b border-border bg-card py-16 md:py-24">
        <div className="container-page">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <SectionHeading
              eyebrow="Published Inventory"
              title="Products Available for Bulk Quotation"
              description="Each product card features active packaging details, MOQ specifications, and instant bulk enquiry capability."
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
            <div className="mt-10 rounded-2xl border border-dashed border-border bg-background p-8 text-center sm:p-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fresh/10 text-fresh">
                <Boxes className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">
                Digital Catalogue Updating
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Our fresh godown lots across Spices, Edible Oils, Incense, and Matches are currently being catalogued. You can build a custom quotation or contact our team directly for current stock.
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

      {/* 5. SECTION D: WHY BUY FROM US? */}
      <section className="border-b border-border bg-secondary/30 py-16 md:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Wholesale Value"
            title="Why Store Owners Partner With Us"
            description="Designed specifically to support retail grocers, general store owners, and regional distributors with dependable wholesale trade supply."
            align="center"
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((item) => (
              <div
                key={item.title}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fresh/10 text-fresh">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-foreground">
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

      {/* INTERACTIVE WHOLESALE SAVINGS CALCULATOR */}
      <section className="border-b border-border bg-background py-16 md:py-24">
        <div className="container-page">
          <WholesaleCalculator />
        </div>
      </section>

      {/* 6. SECTION E: HOW BULK ORDERING WORKS */}
      <section className="border-b border-border bg-card py-16 md:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Simple 3-Step Process"
            title="How Bulk Ordering Works"
            description="A clear, transparent enquiry and fulfilment journey built for business buyers."
            align="center"
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {processSteps.map((step) => (
              <div
                key={step.number}
                className="relative flex flex-col justify-between rounded-2xl border border-border bg-background p-7 transition-all duration-300 hover:border-fresh/40"
              >
                <div>
                  <span className="font-mono text-3xl font-extrabold text-accent">
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

      {/* 7. SECTION F: WHOLESALE ENQUIRY BANNER */}
      <section className="py-16 md:py-20">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-[#174735] px-6 py-12 text-[#FFF9F0] shadow-2xl sm:px-12 md:py-16">
            {/* Subtle decorative background glow */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#F4C542]/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#2F7554]/20 blur-3xl" />

            <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#F4C542]">
                  Direct Godown Supply
                </span>
                <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                  Ready to Stock Your Store?
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[#FFF9F0]/80 sm:text-lg">
                  Create a multi-product enquiry and discuss wholesale pricing with our team.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
                <Button asChild variant="gold" size="lg" className="shadow-lg">
                  <Link href="/order" className="gap-2">
                    <Send className="h-5 w-5" />
                    <span>Build Your Bulk Order</span>
                  </Link>
                </Button>
                {whatsappLink ? (
                  <Button asChild variant="outline" size="lg" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                    <a href={whatsappLink} target="_blank" rel="noreferrer" className="gap-2">
                      <MessageCircle className="h-5 w-5 text-[#F4C542]" />
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
