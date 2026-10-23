"use client";

import { useState } from "react";
import { Printer, FileText, X, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
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
  const { t, language } = useLanguage();
  const currentDate = new Date().toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });

  function handleShareWhatsApp() {
    const filterInfo = [categoryFilter, brandFilter].filter(Boolean).join(" • ");
    const summary = `${t("rateCard.title")}\n${t("rateCard.date")}: ${currentDate}\n${filterInfo ? `${t("rateCard.filteredBy")}: ${filterInfo}\n` : ""}${t("rateCard.products")}: ${products.length}\n${t("rateCard.priceRequest")}\n${typeof window !== "undefined" ? window.location.href : "https://bulk-supiler.vercel.app/products"}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(summary)}`, "_blank", "noopener,noreferrer");
  }

  async function handleCopyLink() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setIsOpen(true)} className="gap-2 border-primary/20 text-primary hover:bg-primary/5 dark:text-accent dark:border-accent/30">
        <FileText className="h-4 w-4" />
        <span>{t("rateCard.open")}</span>
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/30 px-4 py-4 sm:px-6 print:hidden">
              <h3 className="flex items-center gap-2 font-extrabold text-foreground"><FileText className="h-5 w-5 text-fresh" />{t("rateCard.title")}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleShareWhatsApp} variant="outline" size="sm" className="gap-1.5 text-xs"><Share2 className="h-3.5 w-3.5" /><span>{t("rateCard.share")}</span></Button>
                <Button onClick={handleCopyLink} variant="outline" size="sm" className="gap-1.5 text-xs">
                  {copied ? <Check className="h-3.5 w-3.5 text-fresh" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? t("rateCard.copied") : t("rateCard.copyLink")}</span>
                </Button>
                <Button onClick={() => window.print()} variant="gold" size="sm" className="gap-2"><Printer className="h-4 w-4" /><span>{t("rateCard.print")}</span></Button>
                <button type="button" onClick={() => setIsOpen(false)} aria-label={t("rateCard.close")} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 print:p-0">
              <div className="flex flex-col justify-between gap-2 border-b-2 border-primary/30 pb-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-primary dark:text-accent">Gayatri Store</h1>
                  <p className="text-xs text-muted-foreground">{t("rateCard.subtitle")}</p>
                </div>
                <p className="text-xs text-muted-foreground">{t("rateCard.date")}: {currentDate}</p>
              </div>

              {(categoryFilter || brandFilter) ? <p className="mt-3 text-xs font-semibold text-fresh">{t("rateCard.filteredBy")}: {[categoryFilter, brandFilter].filter(Boolean).join(" • ")}</p> : null}

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-xs">
                  <thead><tr className="border-b border-border bg-secondary/50 font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2.5">#</th><th className="px-3 py-2.5">{t("rateCard.product")}</th><th className="px-3 py-2.5">{t("rateCard.brand")}</th><th className="px-3 py-2.5">{t("rateCard.category")}</th><th className="px-3 py-2.5">{t("rateCard.pack")}</th><th className="px-3 py-2.5">{t("rateCard.moq")}</th><th className="px-3 py-2.5 text-right">{t("rateCard.price")}</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {products.length === 0 ? <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">{t("rateCard.empty")}</td></tr> : products.map((item, index) => (
                      <tr key={item.id} className="hover:bg-secondary/20">
                        <td className="px-3 py-2.5 font-semibold text-muted-foreground">{index + 1}</td>
                        <td className="px-3 py-2.5 font-bold text-foreground">{item.name}{item.sku ? <span className="block text-[10px] font-normal text-muted-foreground">SKU: {item.sku}</span> : null}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{item.brandName || t("rateCard.unspecified")}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{language === "hi" ? item.categoryNameHi || item.categoryName || t("rateCard.unspecified") : item.categoryName || t("rateCard.unspecified")}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{item.packSize || item.packing || item.unit || t("rateCard.unspecified")}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{item.moq || t("rateCard.unspecified")}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-primary dark:text-accent">{item.quoteOnly || !item.price ? t("rateCard.priceRequest") : item.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                <p>{t("rateCard.notice")}</p>
                <p className="mt-2">{t("rateCard.contact")}: <a className="font-semibold text-fresh underline" href="https://wa.me/918849263377" target="_blank" rel="noreferrer">+91 884 926 3377</a></p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
