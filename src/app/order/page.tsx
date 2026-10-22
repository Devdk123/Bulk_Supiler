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
import { getPublicBusinessSettings } from "@/lib/business-settings";
import { buildWhatsAppLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Build a Bulk Order & Request Quotation | Gayatri Store",
  description:
    "Select multi-product wholesale items across spices, oils, matchsticks and pooja essentials and receive proforma rates from Gayatri Store."
};

export const revalidate = 60;

export default async function OrderPage() {
  const [products, businessSettings] = await Promise.all([
    getStoreProducts(),
    getPublicBusinessSettings()
  ]);

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
            eyebrow="Commercial Order Desk"
            title="Build a Multi-Product Wholesale Order"
            description="Add multiple products and pack options into a single enquiry. Our godown team consolidates your dispatch to save shipping freight."
          />

          {/* Wholesale Policy Notice Card */}
          <div className="rounded-3xl border border-fresh/30 bg-[#174735] p-6 md:p-8 text-[#FFF9F0] shadow-md">
            <span className="inline-block rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#F4C542]">
              Strictly Wholesale & B2B
            </span>
            <h3 className="mt-4 text-xl font-extrabold text-white">
              How Your Quote is Handled
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#FFF9F0]/80">
              Submitting a quotation request does not require any online credit card or payment. We verify active godown stock, confirm transport options, apply volume discounts, and provide your formal invoice.
            </p>

            <ul className="mt-5 space-y-3 text-xs text-[#FFF9F0]/90">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#F4C542] shrink-0" />
                <span>Multi-category consolidated freight bookings</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#F4C542] shrink-0" />
                <span>Transparent tiered wholesale carton pricing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#F4C542] shrink-0" />
                <span>Direct coordination with transport godowns</span>
              </li>
            </ul>
          </div>

          {/* Direct WhatsApp Assistance */}
          {whatsappLink ? (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
              <h4 className="text-sm font-bold text-foreground">
                Need Immediate Stock Confirmation?
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Send your list of items directly to our wholesale sales desk on WhatsApp.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full justify-center border-fresh/30 text-fresh hover:bg-fresh/10">
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="gap-2">
                  <MessageCircle className="h-4 w-4 text-fresh" />
                  <span>Chat with Dispatch Team</span>
                </a>
              </Button>
            </div>
          ) : null}
        </div>

        {/* Right Side: Interactive Order Form */}
        <div>
          <Suspense fallback={<div className="rounded-3xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">Loading quotation system...</div>}>
            <OrderForm products={products} whatsappNumber={businessSettings.whatsapp_number} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
