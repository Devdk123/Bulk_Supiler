"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/products";

export function ProductCatalog({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All products");

  const categories = useMemo(
    () => ["All products", ...new Set(products.map((product) => product.quality).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return products.filter((product) => {
      const matchesCategory = selectedCategory === "All products" || product.quality === selectedCategory;
      const matchesQuery =
        !normalizedQuery ||
        `${product.name} ${product.quality} ${product.moq} ${product.packing}`.toLocaleLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [products, query, selectedCategory]);

  const hasFilters = query.trim().length > 0 || selectedCategory !== "All products";

  return (
    <>
      <div className="mt-8 rounded-xl border bg-white p-5 premium-shadow">
        <label htmlFor="product-search" className="mb-3 block text-sm font-bold text-primary">
          Find products by name, category or packing
        </label>
        <div className="relative">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="product-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try turmeric, spices or 25kg"
            className="h-12 w-full rounded-md border bg-background pl-10 pr-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter products by category">
          {categories.map((category) => {
            const isSelected = selectedCategory === category;

            return (
              <button
                key={category}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  isSelected
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-6 text-sm font-medium text-muted-foreground" aria-live="polite">
        Showing {filteredProducts.length} of {products.length} products
      </p>

      {filteredProducts.length ? (
        <div className="mt-4 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed bg-white px-6 py-12 text-center">
          <h2 className="text-xl font-bold text-primary">No matching products</h2>
          <p className="mt-2 text-muted-foreground">Try another search or clear your filters to see the full catalog.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSelectedCategory("All products");
            }}
            className="mt-5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#154d3d]"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
