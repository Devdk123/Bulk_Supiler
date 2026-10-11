import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { ProductCatalog } from "@/components/product-catalog";
import { SectionHeading } from "@/components/section-heading";
import { getStoreProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Wholesale Product Catalog",
  description: "Bulk product catalog with wholesale rates, MOQ, quality and packing details."
};

export default async function ProductsPage() {
  const products = await getStoreProducts();

  return (
    <section className="py-14">
      <div className="container-page">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Wholesale catalog"
            title="Products available for bulk supply"
            description="Prices shown are indicative wholesale rates. Final pricing depends on quantity, quality grade, packing and transport."
          />
          <div className="rounded-lg border border-accent/50 bg-[#fff8e8] p-4 text-sm font-semibold text-primary">
            <AlertTriangle className="mb-2 h-5 w-5 text-accent" />
            Retail orders not available. Only bulk supply.
          </div>
        </div>

        <ProductCatalog products={products} />
      </div>
    </section>
  );
}
