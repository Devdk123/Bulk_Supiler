"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calculator,
  Percent,
  Truck,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Tier {
  threshold: number;
  discountPercent: number;
  freightSubsidy: string;
  badge: string;
}

const TIERS: Tier[] = [
  { threshold: 25000, discountPercent: 5, freightSubsidy: "50% Freight Shared", badge: "Silver Tier" },
  { threshold: 50000, discountPercent: 8, freightSubsidy: "Free Transport to Godown", badge: "Gold Tier" },
  { threshold: 100000, discountPercent: 12, freightSubsidy: "Priority Direct Dispatch", badge: "Diamond Tier" }
];

export function WholesaleCalculator() {
  const [estimatedValue, setEstimatedValue] = useState<number>(50000);
  const [category, setCategory] = useState<string>("Masala & Spices");

  // Determine active tier
  const activeTier = TIERS.slice().reverse().find((t) => estimatedValue >= t.threshold);
  const discountPercent = activeTier ? activeTier.discountPercent : 0;
  const estimatedSavings = Math.round((estimatedValue * discountPercent) / 100);
  const netPayable = estimatedValue - estimatedSavings;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 md:p-10 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-fresh/15 px-3 py-1 text-xs font-bold text-fresh">
            <Calculator className="h-4 w-4" />
            <span>Interactive Wholesale Estimator</span>
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Estimate Bulk Order Savings & Margins
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Calculate volume-based rate discounts, transport subsidies, and trade margin benefits for your store.
          </p>
        </div>

        {activeTier ? (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-accent/20 border border-accent/40 px-4 py-2 text-xs font-bold text-primary dark:text-accent shrink-0">
            <ShieldCheck className="h-4 w-4" />
            <span>Unlocked: {activeTier.badge} ({activeTier.discountPercent}% Off)</span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Orders over ₹25,000 unlock additional wholesale tier savings.
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
        {/* Controls */}
        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Primary Category
            </label>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {[
                "Masala & Spices",
                "Edible Oils",
                "Agarbatti & Dhoop",
                "Matchsticks",
                "Kapoor & Pooja"
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    category === cat
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-border bg-background text-foreground hover:bg-secondary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="order-value-slider" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Estimated Order Value (₹)
              </label>
              <span className="text-lg font-black text-primary dark:text-accent">
                ₹{estimatedValue.toLocaleString("en-IN")}
              </span>
            </div>

            <input
              id="order-value-slider"
              type="range"
              min="10000"
              max="250000"
              step="5000"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(Number(e.target.value))}
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
            />

            <div className="mt-2 flex justify-between text-[11px] font-semibold text-muted-foreground">
              <span>₹10,000 (Standard)</span>
              <span>₹50,000 (Gold)</span>
              <span>₹1,00,000+ (Diamond)</span>
              <span>₹2,50,000</span>
            </div>
          </div>

          {/* Tier Milestones */}
          <div className="space-y-2.5 rounded-2xl border border-border/80 bg-background/60 p-4 text-xs">
            <span className="font-bold text-foreground">Active Trade Perks & Subsidies:</span>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-fresh shrink-0" />
                <span>
                  <strong>Carton-Level Godown Rates:</strong> Direct manufacturer batch pricing for {category}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck className="h-4 w-4 text-fresh shrink-0" />
                <span>
                  <strong>Logistics:</strong> {activeTier?.freightSubsidy || "Standard freight shared per transport transporter receipt"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Summary Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-fresh/20 bg-fresh/5 p-6 dark:bg-fresh/10">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-fresh">
              Estimated Order Breakdown
            </h3>

            <div className="mt-4 space-y-3 divide-y divide-border/60 text-sm">
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Gross Wholesale Value</span>
                <span className="font-semibold text-foreground">₹{estimatedValue.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between pt-3">
                <span className="inline-flex items-center gap-1.5 text-fresh font-medium">
                  <Percent className="h-3.5 w-3.5" /> Volume Tier Savings ({discountPercent}%)
                </span>
                <span className="font-bold text-fresh">- ₹{estimatedSavings.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between pt-3">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" /> Est. Retail Margin
                </span>
                <span className="font-semibold text-foreground">18% – 28%</span>
              </div>

              <div className="flex items-baseline justify-between pt-4">
                <span className="text-base font-extrabold text-foreground">Estimated Net Total</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-primary dark:text-accent">
                    ₹{netPayable.toLocaleString("en-IN")}
                  </span>
                  <p className="text-[10px] text-muted-foreground">+ Applicable GST / Transporter Bilti</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Button asChild variant="gold" size="lg" className="w-full gap-2 shadow-sm">
              <Link href={`/order?value=${estimatedValue}&category=${encodeURIComponent(category)}`}>
                <span>Proceed to Bulk Quotation</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <p className="text-center text-[11px] text-muted-foreground">
              Final rates are confirmed via formal quotation based on current live batch stocks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

