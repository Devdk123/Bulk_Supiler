import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CheckCircle2,
  MessageCircle
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { OrderForm } from "@/components/order-form";
import { Button } from "@/components/ui/button";
import { getStoreProducts } from "@/lib/products";
import { getDefaultBusinessSettings } from "@/lib/business-settings";
import { buildWhatsAppLink } from "@/lib/utils";
import { TranslatedText } from "@/components/translated-text";

export const metadata: Metadata = {
  title: "Build a Bulk Order & Request Quotation | Gayatri Store",
  description:
    "Select multi-product wholesale items across spices, oils, matchsticks and pooja essentials and receive proforma rates from Gayatri Store."
};

export const revalidate = 60;

export default function OrderPage() {
  const businessSettings = getDefaultBusinessSettings();
  const whatsappLink = buildWhatsAppLink(
    "Hello Gayatri Store, I want to discuss a bulk wholesale quotation for my business.",
    businessSettings.whatsapp_number
  );

  return (
    <section className="py-12 md:py-16">
      <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        {/* Left Side: Wholesale Guidelines & Business Context */}
        <div className="space-y-6">
          <SectionHeading
            eyebrow={<TranslatedText id="orderPage.eyebrow" />}
            title={<TranslatedText id="orderPage.title" />}
            description={<TranslatedText id="orderPage.description" />}
          />

          {/* Wholesale Policy Notice Card */}
          <div className="rounded-3xl border border-fresh/30 bg-[#174735] p-6 md:p-8 text-[#FFF9F0] shadow-md">
            <span className="inline-block rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#F4C542]">
              <TranslatedText id="orderPage.wholesaleOnly" />
            </span>
            <h3 className="mt-4 text-xl font-extrabold text-white">
              <TranslatedText id="orderPage.howHandled" />
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#FFF9F0]/80">
              <TranslatedText id="orderPage.policy" />
            </p>

            <ul className="mt-5 space-y-3 text-xs text-[#FFF9F0]/90">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#F4C542] shrink-0" />
                <span><TranslatedText id="orderPage.benefit1" /></span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#F4C542] shrink-0" />
                <span><TranslatedText id="orderPage.benefit2" /></span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#F4C542] shrink-0" />
                <span><TranslatedText id="orderPage.benefit3" /></span>
              </li>
            </ul>
          </div>

          {/* Direct WhatsApp Assistance */}
          {whatsappLink ? (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
              <h4 className="text-sm font-bold text-foreground">
                <TranslatedText id="orderPage.immediateTitle" />
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                <TranslatedText id="orderPage.immediateDescription" />
              </p>
              <Button asChild variant="outline" className="mt-4 w-full justify-center border-fresh/30 text-fresh hover:bg-fresh/10">
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="gap-2">
                  <MessageCircle className="h-4 w-4 text-fresh" />
                  <span><TranslatedText id="orderPage.whatsapp" /></span>
                </a>
              </Button>
            </div>
          ) : null}
        </div>

        {/* Right Side: Interactive Order Form */}
        <div>
          <Suspense fallback={<div className="rounded-3xl border border-border bg-card p-12 text-center text-sm text-muted-foreground"><TranslatedText id="orderPage.loading" /></div>}>
            <OrderFormContent whatsappNumber={businessSettings.whatsapp_number} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

async function OrderFormContent({ whatsappNumber }: { whatsappNumber: string }) {
  const products = await getStoreProducts();
  return <OrderForm products={products} whatsappNumber={whatsappNumber} />;
}
