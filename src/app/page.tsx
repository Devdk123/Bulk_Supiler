import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  MapPin,
  MessageCircle,
  PackageCheck,
  PackageSearch,
  Percent,
  Send,
  Sparkles,
  Store
} from "lucide-react";
import { FeaturedProducts } from "@/components/featured-products";
import { SectionHeading } from "@/components/section-heading";
import { WholesaleCalculator } from "@/components/wholesale-calculator";
import { Button } from "@/components/ui/button";
import { TranslatedText } from "@/components/translated-text";
import { getDefaultBusinessSettings } from "@/lib/business-settings";
import { buildWhatsAppLink } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Gayatri Store | B2B Wholesale FMCG & Daily Goods",
  description:
    "Browse Gayatri Store's published wholesale product listings and ask the team for current prices and availability."
};

const categories = [
  {
    name: "Masala & Spices",
    image: "/images/Chilli-powder.jpeg",
    slug: "Masala & Spices"
  },
  {
    name: "Edible Oils",
    image: "/images/hero-wholesale-products.jpg",
    slug: "Edible Oils"
  },
  {
    name: "Matchsticks",
    image: "/images/Match-Stick.png",
    slug: "Matchsticks"
  },
  {
    name: "Agarbatti",
    image: "/images/agarbatti.jpeg",
    slug: "Agarbatti"
  },
  {
    name: "Dhoop",
    image: "/images/hero-wholesale-products.jpg",
    slug: "Dhoop"
  },
  {
    name: "Kapoor & Pooja Products",
    image: "/images/Pansari.jpg",
    slug: "Kapoor & Pooja Products"
  },
  {
    name: "Other FMCG Essentials",
    image: "/images/tea-patti.jpeg",
    slug: "Other FMCG Essentials"
  }
];

const processSteps = ["01", "02", "03"];

const advantages = [
  Boxes,
  MapPin,
  Percent,
  MessageCircle
];

export default function HomePage() {
  const businessSettings = getDefaultBusinessSettings();

  const whatsappLink = buildWhatsAppLink(
    "Hello Gayatri Store, I want to discuss wholesale rates for my store.",
    businessSettings.whatsapp_number
  );

  return (
    <div className="flex flex-col gap-0">
      {/* 1. SIGNATURE SPLIT-LAYOUT HERO (LIGHT-FIRST EDITORIAL) */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-[#FFF9F0] to-[#F8F1E3] py-12 md:py-20 lg:py-24 transition-colors">
        <div className="container-page">
          <div className="grid w-full min-w-0 grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_0.95fr] lg:gap-14">
            {/* Left side (approx 55% space) */}
            <div className="flex min-w-0 flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary dark:border-accent/40 dark:bg-accent/10 dark:text-accent">
                <Store className="h-3.5 w-3.5" />
                <TranslatedText id="home.heroEyebrow" />
              </div>

              <h1 className="mt-5 w-full min-w-0 max-w-full whitespace-normal break-words text-[clamp(1.375rem,7vw,1.875rem)] font-black leading-tight tracking-tight text-primary sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.12] dark:text-[#F4C542]">
                <span className="block max-w-full"><TranslatedText id="home.heroTitle" /></span>
                <span className="block max-w-full text-[#347754] dark:text-[#52B47F]"><TranslatedText id="home.heroTitleSecond" /></span>
              </h1>

              <p className="mt-5 w-full min-w-0 max-w-xl text-base leading-relaxed text-[#252A24]/85 sm:text-lg dark:text-[#F8F4EC]/85">
                <TranslatedText id="home.heroDescription" />
              </p>

              {/* CTAs */}
              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button asChild variant="gold" size="lg" className="h-12 w-full min-w-0 rounded-xl px-7 text-sm font-extrabold shadow-md transition-all hover:shadow-lg sm:w-auto">
                  <Link href="/products" className="min-w-0 gap-2">
                    <PackageSearch className="h-4.5 w-4.5" />
                    <TranslatedText id="home.explore" />
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg" className="h-12 w-full min-w-0 rounded-xl border-primary/25 bg-card px-6 text-sm font-bold text-primary hover:bg-secondary dark:border-border dark:text-foreground sm:w-auto">
                  <Link href="/order" className="min-w-0 gap-2">
                    <PackageCheck className="h-4.5 w-4.5 text-[#347754]" />
                    <TranslatedText id="home.buildOrder" />
                  </Link>
                </Button>
              </div>

              {/* Supporting Trust Note */}
              <div className="mt-8 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-semibold text-[#666D64] dark:text-[#A6AEA4]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#347754]" /> <TranslatedText id="home.trust1" />
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#347754]" /> <TranslatedText id="home.trust2" />
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#347754]" /> <TranslatedText id="home.trust3" />
                </span>
              </div>

              {/* Local Area Verification Tag */}
              <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 px-3.5 py-2 text-xs font-medium text-foreground shadow-xs">
                <MapPin className="h-3.5 w-3.5 text-[#E66A50] shrink-0" />
                <span>
                  <TranslatedText id="home.serviceArea" />
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
                    <TranslatedText id="home.heroBadge" />
                  </div>
                  <span className="rounded-md bg-fresh/10 px-2 py-0.5 text-[11px] font-bold text-fresh">
                    <TranslatedText id="home.b2b" />
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
              eyebrow={<TranslatedText id="home.categoryEyebrow" />}
              title={<TranslatedText id="home.categoryHeading" />}
              description={<TranslatedText id="home.categoryDescription" />}
            />
            <Button asChild variant="outline" className="w-fit">
              <Link href="/products" className="gap-2">
                <TranslatedText id="home.allProducts" />
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
                      <TranslatedText id={`home.categories.${index}.2`} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-base font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary dark:group-hover:text-accent">
                        <TranslatedText id={`home.categories.${index}.0`} />
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        <TranslatedText id={`home.categories.${index}.1`} />
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-fresh group-hover:underline">
                      <TranslatedText id="home.browseLots" />
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <FeaturedProducts whatsappLink={whatsappLink} />

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
            eyebrow={<TranslatedText id="home.advantageEyebrow" />}
            title={<TranslatedText id="home.advantageTitle" />}
            description={<TranslatedText id="home.advantageDescription" />}
            align="center"
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((Icon, index) => (
              <div
                key={index}
                className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-fresh/40 hover:shadow-md"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fresh/10 text-fresh">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-base font-extrabold text-foreground">
                    <TranslatedText id={`home.advantages.${index}.0`} />
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    <TranslatedText id={`home.advantages.${index}.1`} />
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
            eyebrow={<TranslatedText id="home.processEyebrow" />}
            title={<TranslatedText id="home.processTitle" />}
            description={<TranslatedText id="home.processDescription" />}
            align="center"
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {processSteps.map((number, index) => (
              <div
                key={number}
                className="relative flex flex-col justify-between rounded-3xl border border-border bg-background p-8 transition-all duration-300 hover:border-fresh/40"
              >
                <div>
                  <span className="font-mono text-3xl font-black text-accent">
                    {number}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-foreground">
                    <TranslatedText id={`home.steps.${index}.0`} />
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    <TranslatedText id={`home.steps.${index}.1`} />
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
                  <TranslatedText id="home.ctaBadge" />
                </span>
                <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl">
                  <TranslatedText id="home.ctaTitle" />
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[#FFF9F0]/85 sm:text-lg">
                  <TranslatedText id="home.ctaDescription" />
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
                <Button asChild variant="gold" size="lg" className="h-12 rounded-xl px-7 font-extrabold shadow-lg">
                  <Link href="/order" className="gap-2">
                    <Send className="h-4.5 w-4.5" />
                    <TranslatedText id="home.ctaStart" />
                  </Link>
                </Button>
                {whatsappLink ? (
                  <Button asChild variant="outline" size="lg" className="h-12 rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20">
                    <a href={whatsappLink} target="_blank" rel="noreferrer" className="gap-2">
                      <MessageCircle className="h-4.5 w-4.5 text-[#F4C542]" />
                      <TranslatedText id="home.whatsappRates" />
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
