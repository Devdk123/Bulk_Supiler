"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/products";

export function ProductCatalogue({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");

  const brands = useMemo(
    () => [...new Set(products.map((product) => product.brandName).filter((value): value is string => Boolean(value)))].sort(),
    [products]
  );
  const categories = useMemo(
    () => [...new Set(products.map((product) => product.categoryName).filter((value): value is string => Boolean(value)))].sort(),
    [products]
  );
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return products
      .filter((product) => {
        const matchesSearch = !query || [
          product.name,
          product.brandName || "",
          product.categoryName || "",
          product.sku || ""
        ].some((value) => value.toLocaleLowerCase().includes(query));
        return matchesSearch && (!brand || product.brandName === brand) && (!category || product.categoryName === category);
      })
      .sort((left, right) => sort === "name" ? left.name.localeCompare(right.name) : 0);
  }, [brand, category, products, search, sort]);

  return (
    <div className="mt-8">
      <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_0.7fr_0.7fr_0.6fr]">
        <label className="relative">
          <span className="sr-only">Search products, brands, categories, or SKU</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalogue" />
        </label>
        <Filter label="Brand" value={brand} onChange={setBrand} options={brands} />
        <Filter label="Category" value={category} onChange={setCategory} options={categories} />
        <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
          Sort
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 rounded-md border bg-background px-3 text-sm text-foreground">
            <option value="newest">Recently added</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">
        {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
      </p>

      {filteredProducts.length ? (
        <div className="mt-4 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed bg-card p-8 text-center">
          <p className="font-semibold text-primary">{products.length ? "No matching products." : "No products have been published yet."}</p>
          <p className="mt-2 text-sm text-muted-foreground">Adjust the search or filters, or check back later.</p>
        </div>
      )}
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border bg-background px-3 text-sm text-foreground">
        <option value="">All {label.toLowerCase()}s</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
