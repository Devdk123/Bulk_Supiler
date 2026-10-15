import type { Metadata } from "next";
import { ProductCatalogue } from "@/components/product-catalogue";
import { SectionHeading } from "@/components/section-heading";
import { getStoreProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wholesale Product Catalogue",
  description: "Search published products and request wholesale quotations."
};

export default async function ProductsPage() {
  const products = await getStoreProducts();

  return (
    <section className="py-14">
      <div className="container-page">
        <SectionHeading
          eyebrow="Wholesale catalogue"
          title="Products published for business buyers"
          description="Search by product, brand, category or SKU. Request a quote for one or more products."
        />
        <ProductCatalogue products={products} />
      </div>
    </section>
  );
}
