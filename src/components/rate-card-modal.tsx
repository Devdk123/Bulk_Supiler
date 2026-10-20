"use client";

import { useState } from "react";
import { Printer, FileText, X, CheckCircle2, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/products";

export function RateCardModal({
  products,
  categoryFilter,
  brandFilter
}: {
  products: Product[];
  categoryFilter?: string;
  brandFilter?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function handlePrint() {
    window.print();
  }

  function handleShareWhatsApp() {
    const filterInfo = [categoryFilter, brandFilter].filter(Boolean).join(" • ");
    const summary = `*Gayatri Store — Wholesale Rate Sheet*\nDate: ${currentDate}\n${filterInfo ? `Category / Brand: ${filterInfo}\n` : ""}Products: ${products.length} wholesale items\nGodown: Maya Bazar\nCatalogue link: ${typeof window !== "undefined" ? window.location.href : "https://bulksupiler.in/products"}\nDirect WhatsApp: +91 884 926 3377`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(summary)}`, "_blank");
  }

  function handleCopyLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2 border-primary/20 text-primary hover:bg-primary/5 dark:text-accent dark:border-accent/30"
      >
        <FileText className="h-4 w-4" />
        <span>Wholesale Rate Sheet</span>
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-6 py-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-fresh" />
                <h3 className="font-extrabold text-foreground">
                  Wholesale Godown Rate Sheet
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleShareWhatsApp}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 text-xs font-bold"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">WhatsApp Share</span>
                </Button>
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-bold"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-fresh" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{copied ? "Copied!" : "Copy Link"}</span>
                </Button>
                <Button
                  onClick={handlePrint}
                  variant="gold"
                  size="sm"
                  className="gap-2 shadow-xs"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print / Save PDF</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 print:p-0">
              {/* Sheet Header */}
              <div className="border-b-2 border-primary/30 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-primary uppercase dark:text-accent">
                      Gayatri Store
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      B2B Direct Godown Wholesale &amp; FMCG Distribution — Maya Bazar
                    </p>
                  </div>
                  <div className="text-left sm:text-right text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">Date: {currentDate}</p>
                    <p>Status: Active Batch Rates</p>
                  </div>
                </div>

                {(categoryFilter || brandFilter) ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-fresh/10 px-3 py-1 text-xs font-semibold text-fresh">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>
                      Filtered by: {[categoryFilter, brandFilter].filter(Boolean).join(" • ")}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Products Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50 font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Brand</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Pack / Unit</th>
                      <th className="py-2.5 px-3">MOQ</th>
                      <th className="py-2.5 px-3 text-right">Wholesale Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No products found matching the current criteria.
                        </td>
                      </tr>
                    ) : (
                      products.map((item, index) => (
                        <tr key={item.id} className="hover:bg-secondary/20">
                          <td className="py-2.5 px-3 font-semibold text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-foreground">
                            {item.name}
                            {item.sku ? (
                              <span className="block text-[10px] text-muted-foreground font-normal">
                                SKU: {item.sku}
                              </span>
                            ) : null}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {item.brandName || "General"}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {item.categoryName || "FMCG"}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {item.packSize || item.unit || "Carton / Master"}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-foreground">
                            {item.moq ? `${item.moq} MOQ` : "1 Carton"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-primary dark:text-accent">
                            {item.price || "Quote on Request"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sheet Terms & Footer */}
              <div className="mt-8 border-t border-border pt-4 text-[11px] text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground">Commercial Terms & Instructions:</p>
                <ul className="mt-1.5 list-disc pl-4 space-y-1">
                  <li>Rates listed are godown wholesale prices subject to live batch availability and transit freight bilty.</li>
                  <li>Official order confirmation and GST invoicing provided upon quotation verification.</li>
                  <li>WhatsApp Order Desk: +91 884 926 3377 • Gayatri Store (Maya Bazar)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

