"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";

export function WholesaleCalculator() {
  const [budget, setBudget] = useState(50000);
  const { t } = useLanguage();

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 md:p-10">
      <div className="inline-flex items-center gap-2 rounded-lg bg-fresh/15 px-3 py-1 text-xs font-bold text-fresh">
        <Calculator className="h-4 w-4" />
        <span>{t("wholesalePlanner.eyebrow")}</span>
      </div>
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
        {t("wholesalePlanner.title")}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {t("wholesalePlanner.description")}
      </p>

      <div className="mt-7 max-w-xl">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="order-budget" className="text-sm font-semibold text-foreground">
            {t("wholesalePlanner.budgetLabel")}
          </label>
          <output htmlFor="order-budget" className="text-lg font-black text-primary dark:text-accent">
            ₹{budget.toLocaleString("en-IN")}
          </output>
        </div>
        <input
          id="order-budget"
          type="range"
          min="10000"
          max="250000"
          step="5000"
          value={budget}
          onChange={(event) => setBudget(Number(event.target.value))}
          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>₹10,000</span>
          <span>₹2,50,000</span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("wholesalePlanner.disclaimer")}</p>
      </div>

      <Button asChild variant="gold" size="lg" className="mt-6 gap-2">
        <Link href={`/order?budget=${budget}`}>
          <span>{t("wholesalePlanner.action")}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </section>
  );
}
