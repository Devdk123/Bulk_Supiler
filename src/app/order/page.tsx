import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionHeading } from "@/components/section-heading";
import { OrderForm } from "@/components/order-form";
import { getStoreProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Place Bulk Order",
  description: "Submit a wholesale order enquiry for spices, agarbatti, tea and daily goods."
};

export default async function OrderPage() {
  const products = await getStoreProducts();

  return (
    <section className="py-14">
      <div className="container-page grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <SectionHeading
            eyebrow="Order lead"
            title="Share your bulk requirement"
            description="Your enquiry is saved for follow-up and a WhatsApp message is prepared with all order details."
          />
          <div className="mt-8 rounded-lg bg-primary p-6 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">Wholesale only</p>
            <p className="mt-4 leading-7 text-white/75">
              Minimum quantities apply. A team member will confirm final price, packing and dispatch details before order
              confirmation.
            </p>
          </div>
        </div>
        <Suspense fallback={<div className="rounded-lg border bg-white p-8">Loading order form...</div>}>
          <OrderForm products={products} />
        </Suspense>
      </div>
    </section>
  );
}
