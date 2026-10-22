import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductCatalogue } from "@/components/product-catalogue";
import { getStoreProductsPage, type ProductCataloguePage } from "@/lib/products";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Wholesale Product Catalogue | Gayatri Store",
  description:
    "Browse verified FMCG items from Gayatri Store, search by category or brand, and request wholesale bulk quotes for Maya Bazar and surrounding markets."
};

export default function ProductsPage() {
  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <Suspense fallback={<CatalogueSkeleton />}>
          <ProductCatalogueContent />
        </Suspense>
      </div>
    </section>
  );
}

async function ProductCatalogueContent() {
  let initialPage: ProductCataloguePage | null = null;
  let initialError = "";
  try {
    initialPage = await getStoreProductsPage({ limit: 24, offset: 0 });
  } catch {
    initialError = "The catalogue is temporarily unavailable. Please retry.";
  }
  return <ProductCatalogue initialPage={initialPage} initialError={initialError} />;
}

function CatalogueSkeleton() {
  return (
    <div aria-label="Loading product catalogue" className="mt-8 animate-pulse">
      <div className="h-11 rounded-xl bg-secondary" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-80 rounded-2xl bg-secondary/70" />)}
      </div>
    </div>
  );
}
