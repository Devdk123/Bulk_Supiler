import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductCatalogue } from "@/components/product-catalogue";
import { SectionHeading } from "@/components/section-heading";
import { getStoreProducts } from "@/lib/products";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Wholesale Product Catalogue | Gayatri Store",
  description:
    "Browse verified FMCG items from Gayatri Store, search by category or brand, and request wholesale bulk quotes for Maya Bazar and surrounding markets."
};

export default async function ProductsPage() {
  const products = await getStoreProducts();

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <SectionHeading
          eyebrow="Direct Wholesale Catalogue"
          title="Products Published for Business Buyers"
          description="Browse by brand, category, or SKU. Select products and add them directly to your bulk quotation request."
        />
        <Suspense fallback={<div className="mt-8 rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">Loading wholesale catalogue...</div>}>
          <ProductCatalogue products={products} />
        </Suspense>
      </div>
    </section>
  );
}
