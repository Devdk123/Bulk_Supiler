import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionHeading } from "@/components/section-heading";
import { OrderForm } from "@/components/order-form";
import { getStoreProducts } from "@/lib/products";
import { getPublicBusinessSettings } from "@/lib/business-settings";

export const metadata: Metadata = {
  title: "Request a Bulk Quote",
  description: "Send a multi-product wholesale quotation request."
};

export const dynamic = "force-dynamic";

export default async function OrderPage() {
  const [products, businessSettings] = await Promise.all([
    getStoreProducts(),
    getPublicBusinessSettings()
  ]);

  return (
    <section className="py-14">
      <div className="container-page grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <SectionHeading
            eyebrow="Wholesale enquiry"
            title="Request a quote for multiple products"
            description="Select products and quantities, then submit your business and delivery details. A reference is shown only after the enquiry is saved."
          />
          <div className="mt-8 rounded-lg bg-primary p-6 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">Wholesale only</p>
            <p className="mt-4 leading-7 text-white/75">
              Submitting a quotation request does not confirm an order or payment. Pricing, availability and fulfilment are confirmed separately.
            </p>
          </div>
        </div>
        <Suspense fallback={<div className="rounded-lg border bg-white p-8">Loading order form...</div>}>
          <OrderForm products={products} whatsappNumber={businessSettings.whatsapp_number} />
        </Suspense>
      </div>
    </section>
  );
}
