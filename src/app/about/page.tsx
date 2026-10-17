import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgePercent,
  Boxes,
  PackageCheck,
  ShieldCheck,
  Store,
  Truck
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Our Wholesale Operations",
  description: "Learn about The Bulk Supplier, an Indian B2B FMCG distribution partner supplying spices, edible oils, matches and daily trade goods."
};

const pillars = [
  {
    title: "Who We Are",
    text: "We are an FMCG wholesale distributor dedicated to supplying independent grocers, retail store owners, and trade buyers across India with fast-moving daily consumption goods.",
    icon: Store
  },
  {
    title: "Categories We Supply",
    text: "Our core inventory spans whole and ground spices, edible cooking oils, safety matchsticks, agarbatti, dhoop, camphor, and everyday trade staples.",
    icon: PackageCheck
  },
  {
    title: "Godown-Direct Pricing",
    text: "By coordinating dispatches directly from our warehouse and partner processing hubs, we offer transparent bulk margin structures tailored to retail shop economics.",
    icon: Boxes
  },
  {
    title: "Consolidated Multi-Category Dispatch",
    text: "Instead of dealing with half a dozen different category vendors, store owners can consolidate spices, oils, and pooja supplies into a single transport booking.",
    icon: Truck
  },
  {
    title: "Straightforward Quotations",
    text: "No hidden fees or rigid retail checkouts. Every enquiry receives an itemized quote reflecting live inventory and seasonal transport terms.",
    icon: ShieldCheck
  },
  {
    title: "High-Movement Volume Terms",
    text: "Repeat retail buyers and regional stockists can negotiate tiered pricing for full-carton or recurring weekly requirements.",
    icon: BadgePercent
  }
];

export default function AboutPage() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-page">
        {/* Intro Section */}
        <div className="max-w-3xl">
          <SectionHeading
            eyebrow="Company Overview"
            title="A Wholesale Supply Partner for Everyday Trade Goods"
            description="We bridge the gap between regional processing facilities and local retail shelves, providing reliable availability, clear carton quantities, and responsive communication."
          />
        </div>

        {/* Feature Grid */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((item) => (
            <div
              key={item.title}
              className="group flex flex-col justify-between rounded-3xl border border-border bg-card p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-fresh/40 hover:shadow-md"
            >
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fresh/10 text-fresh transition-colors group-hover:bg-fresh group-hover:text-white">
                  <item.icon className="h-6 w-6" />
                </span>
                <h2 className="mt-5 text-lg font-bold text-foreground">
                  {item.title}
                </h2>
                <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Block */}
        <div className="mt-16 rounded-3xl border border-border bg-secondary/40 p-8 sm:p-12 text-center md:text-left flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Interested in Stocking Our Product Lines?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Explore our current catalogue or submit your store details to discuss pricing and minimum order terms.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 shrink-0">
            <Button asChild variant="gold" size="lg">
              <Link href="/products">Explore Catalogue</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/order">Request Wholesale Quote</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
