"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, PhoneCall, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";

interface FAQItem {
  id: string;
  category: "Orders" | "Logistics" | "Billing" | "Products";
}

const FAQS: FAQItem[] = [
  { id: "faq-1", category: "Orders" },
  { id: "faq-2", category: "Logistics" },
  { id: "faq-3", category: "Products" },
  { id: "faq-4", category: "Billing" },
  { id: "faq-5", category: "Billing" },
  { id: "faq-6", category: "Orders" }
];

export function WholesaleFAQ() {
  const { t } = useLanguage();
  const [openId, setOpenId] = useState<string>("faq-1");
  const [filter, setFilter] = useState<string>("All");

  const categories = ["All", "Orders", "Logistics", "Billing", "Products"] as const;

  const filteredFaqs = filter === "All" ? FAQS : FAQS.filter((f) => f.category === filter);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? "" : id));
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-fresh/15 px-3 py-1 text-xs font-bold text-fresh">
            <HelpCircle className="h-4 w-4" />
            <span>{t("faq.eyebrow")}</span>
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {t("faq.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("faq.description")}
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="w-fit gap-2">
          <Link href="/contact">
            <PhoneCall className="h-4 w-4 text-fresh" />
            <span>{t("faq.contact")}</span>
          </Link>
        </Button>
      </div>

      {/* Category Pills */}
      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((cat, index) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === cat
                ? "bg-primary text-primary-foreground shadow-xs"
                : "border border-border bg-background text-foreground hover:bg-secondary"
            }`}
          >
            {t(`faq.filters.${index}`)}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="mt-6 divide-y divide-border">
        {filteredFaqs.map((faq) => {
          const faqIndex = Number(faq.id.split("-")[1]) - 1;
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className="py-4">
              <button
                type="button"
                onClick={() => toggle(faq.id)}
                className="flex w-full items-center justify-between text-left text-sm font-bold text-foreground transition-colors hover:text-fresh sm:text-base"
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-muted-foreground">
                    Q
                  </span>
                  {t(`faq.questions.${faqIndex}.0`)}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-fresh" : ""
                  }`}
                />
              </button>

              {isOpen ? (
                <div className="mt-3 pl-9 pr-4 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  <p>{t(`faq.questions.${faqIndex}.1`)}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between rounded-2xl bg-secondary/40 p-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-fresh" /> {t("faq.verifiedPolicy")}
        </span>
        <a
          href="/contact"
          className="font-bold text-fresh hover:underline"
        >
          {t("faq.contact")} →
        </a>
      </div>
    </div>
  );
}

