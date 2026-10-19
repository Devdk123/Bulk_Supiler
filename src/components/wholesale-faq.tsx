"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, PhoneCall, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "Orders" | "Logistics" | "Billing" | "Products";
}

const FAQS: FAQItem[] = [
  {
    id: "faq-1",
    question: "What is the Minimum Order Quantity (MOQ) across categories?",
    answer:
      "Most packaged spices and agarbatti have an MOQ of 1 master carton (typically 12 to 24 units). For bulk edible oils, the MOQ is 5 tins or 1 master case. You can combine different products and categories into a single consolidated wholesale order.",
    category: "Orders"
  },
  {
    id: "faq-2",
    question: "How does freight and transport delivery (Bilty) work across India?",
    answer:
      "We partner with major regional and pan-India transport services (V-Trans, TCI, Safechem, local bilty transporters). Orders are dispatched from our central godown to your nearest transporter hub. Freight charges are shared or subsidized based on order volume.",
    category: "Logistics"
  },
  {
    id: "faq-3",
    question: "Can I combine multiple brands and categories in one quotation?",
    answer:
      "Yes! Our multi-item wholesale builder allows you to select Jhaveri's Mast! spices, Kisan oils, Bharat Jyoti matchsticks, and GrahShanti incense together in a single order, saving you freight overheads.",
    category: "Products"
  },
  {
    id: "faq-4",
    question: "Do you provide GST tax invoices for business input tax credit?",
    answer:
      "Every wholesale shipment is accompanied by a 100% compliant GST invoice with appropriate HSN codes, allowing registered retail and wholesale businesses to claim complete ITC.",
    category: "Billing"
  },
  {
    id: "faq-5",
    question: "What payment terms and modes are supported for bulk orders?",
    answer:
      "We support direct Bank Transfer (RTGS / NEFT / IMPS), verified UPI, and Transporter Bank CAD (Cash Against Delivery via Transport Bilty) for verified regular trade partners.",
    category: "Billing"
  },
  {
    id: "faq-6",
    question: "How do I receive live sample lots or test batch quality?",
    answer:
      "First-time commercial buyers can request sample cartons or test batches by contacting our godown desk on WhatsApp (+91 884 926 3377) before committing to full truckload or container orders.",
    category: "Orders"
  }
];

export function WholesaleFAQ() {
  const [openId, setOpenId] = useState<string>("faq-1");
  const [filter, setFilter] = useState<string>("All");

  const categories = ["All", "Orders", "Logistics", "Billing", "Products"];

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
            <span>Buyer Knowledge Base</span>
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Frequently Asked Wholesale Questions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Clear, transparent answers regarding minimum orders, transporter delivery, GST invoicing, and trade policies.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="w-fit gap-2">
          <Link href="/contact">
            <PhoneCall className="h-4 w-4 text-fresh" />
            <span>Contact Godown Desk</span>
          </Link>
        </Button>
      </div>

      {/* Category Pills */}
      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
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
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="mt-6 divide-y divide-border">
        {filteredFaqs.map((faq) => {
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
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-fresh" : ""
                  }`}
                />
              </button>

              {isOpen ? (
                <div className="mt-3 pl-9 pr-4 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  <p>{faq.answer}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between rounded-2xl bg-secondary/40 p-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-fresh" /> Verified wholesale policies adhering to Indian FMCG trade norms.
        </span>
        <a
          href="https://wa.me/918849263377"
          target="_blank"
          rel="noreferrer"
          className="font-bold text-fresh hover:underline"
        >
          Ask on WhatsApp →
        </a>
      </div>
    </div>
  );
}
