"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Boxes,
  CheckCircle2,
  Filter,
  RotateCcw,
  Search,
  Send,
  SlidersHorizontal,
  X
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { RateCardModal } from "@/components/rate-card-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/products";
import Link from "next/link";

const allKnownCategories = [
  "Masala & Spices",
  "Edible Oils",
  "Matchsticks",
  "Agarbatti",
  "Dhoop",
  "Kapoor & Pooja Products",
  "Other FMCG Essentials"
];

const allKnownBrands = [
  "Jhaveri's Mast!",
  "Kisan",
  "Bharat Jyoti",
  "Bhola",
  "GrahShanti",
  "Sukoon"
];

export function ProductCatalogue({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlCategory = searchParams.get("category") || "";
  const urlBrand = searchParams.get("brand") || "";
  const urlSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(urlSearch);
  const [brand, setBrand] = useState(urlBrand);
  const [category, setCategory] = useState(urlCategory);
  const [sort, setSort] = useState("newest");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [moqTier, setMoqTier] = useState<"all" | "low" | "bulk">("all");

  // If user hasn't modified local state, fallback to URL params
  const effectiveCategory = category || urlCategory;
  const effectiveBrand = brand || urlBrand;
  const effectiveSearch = search || urlSearch;

  const brands = useMemo(() => {
    const list = [...new Set([
      ...allKnownBrands,
      ...products.map((p) => p.brandName).filter((v): v is string => Boolean(v))
    ])].sort();
    return list;
  }, [products]);

  const categories = useMemo(() => {
    const list = [...new Set([
      ...allKnownCategories,
      ...products.map((p) => p.categoryName).filter((v): v is string => Boolean(v))
    ])].sort();
    return list;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = effectiveSearch.trim().toLowerCase();
    return products
      .filter((product) => {
        const matchesSearch =
          !query ||
          [
            product.name,
            product.brandName || "",
            product.categoryName || "",
            product.sku || "",
            product.description || ""
          ].some((value) => value.toLowerCase().includes(query));

        const matchesBrand =
          !effectiveBrand ||
          (product.brandName && product.brandName.toLowerCase() === effectiveBrand.toLowerCase());

        const matchesCategory =
          !effectiveCategory ||
          (product.categoryName && product.categoryName.toLowerCase() === effectiveCategory.toLowerCase());

        const matchesStock = !onlyInStock || product.stockStatus === "in_stock";

        let matchesMoq = true;
        if (moqTier !== "all") {
          const numMatch = product.moq?.match(/\d+/);
          const parsed = numMatch ? parseInt(numMatch[0], 10) : null;
          if (moqTier === "low") {
            matchesMoq = parsed !== null ? parsed <= 20 : true;
          } else if (moqTier === "bulk") {
            matchesMoq = parsed !== null ? parsed > 20 : false;
          }
        }

        return matchesSearch && matchesBrand && matchesCategory && matchesStock && matchesMoq;
      })
      .sort((left, right) => {
        if (sort === "name") return left.name.localeCompare(right.name);
        if (sort === "name_desc") return right.name.localeCompare(left.name);
        if (sort === "category") return (left.categoryName || "").localeCompare(right.categoryName || "");
        return 0;
      });
  }, [effectiveBrand, effectiveCategory, effectiveSearch, moqTier, onlyInStock, products, sort]);

  function resetFilters() {
    setSearch("");
    setBrand("");
    setCategory("");
    setSort("newest");
    setOnlyInStock(false);
    setMoqTier("all");
    router.push("/products");
  }

  const activeFilterCount =
    (effectiveSearch ? 1 : 0) +
    (effectiveBrand ? 1 : 0) +
    (effectiveCategory ? 1 : 0) +
    (onlyInStock ? 1 : 0) +
    (moqTier !== "all" ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="mt-8">
      {/* Quick Category Filter Bar */}
      <div className="no-scrollbar mb-6 flex items-center gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => {
            setCategory("");
            if (urlCategory) router.push("/products");
          }}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
            effectiveCategory === ""
              ? "bg-primary text-primary-foreground shadow-xs"
              : "border border-border bg-card text-foreground hover:bg-secondary"
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              const next = effectiveCategory.toLowerCase() === cat.toLowerCase() ? "" : cat;
              setCategory(next);
              if (urlCategory) router.push("/products");
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
              effectiveCategory.toLowerCase() === cat.toLowerCase()
                ? "bg-fresh text-white shadow-xs"
                : "border border-border bg-card text-foreground hover:bg-secondary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Filter Control Box */}
      <div className="grid gap-3.5 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs md:grid-cols-[1.2fr_0.8fr_0.8fr_0.6fr]">
        {/* Search Input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 rounded-xl pl-9 pr-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, brands, SKU..."
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                if (urlSearch) router.push("/products");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Brand Dropdown */}
        <label className="grid gap-1 text-xs font-bold text-muted-foreground">
          Brand Filter
          <select
            value={effectiveBrand}
            onChange={(e) => {
              setBrand(e.target.value);
              if (urlBrand) router.push("/products");
            }}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-fresh focus:outline-none"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>

        {/* Category Dropdown */}
        <label className="grid gap-1 text-xs font-bold text-muted-foreground">
          Category Filter
          <select
            value={effectiveCategory}
            onChange={(e) => {
              setCategory(e.target.value);
              if (urlCategory) router.push("/products");
            }}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-fresh focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        {/* Sort Dropdown */}
        <label className="grid gap-1 text-xs font-bold text-muted-foreground">
          Sort Order
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-fresh focus:outline-none"
          >
            <option value="newest">Recently Added</option>
            <option value="name">Product Name (A-Z)</option>
            <option value="name_desc">Product Name (Z-A)</option>
            <option value="category">Category (A-Z)</option>
          </select>
        </label>
      </div>

      {/* Secondary Quick-Filter Toolbar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-secondary/40 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
            <SlidersHorizontal className="h-3.5 w-3.5 text-fresh" /> MOQ Tier:
          </span>
          <button
            type="button"
            onClick={() => setMoqTier("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              moqTier === "all"
                ? "bg-primary text-white shadow-xs"
                : "bg-card text-foreground hover:bg-card/80 border border-border"
            }`}
          >
            All MOQs
          </button>
          <button
            type="button"
            onClick={() => setMoqTier("low")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              moqTier === "low"
                ? "bg-fresh text-white shadow-xs"
                : "bg-card text-foreground hover:bg-card/80 border border-border"
            }`}
          >
            Kirana Trial (≤ 20 pcs)
          </button>
          <button
            type="button"
            onClick={() => setMoqTier("bulk")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              moqTier === "bulk"
                ? "bg-fresh text-white shadow-xs"
                : "bg-card text-foreground hover:bg-card/80 border border-border"
            }`}
          >
            Bulk Cases (20+ pcs)
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOnlyInStock(!onlyInStock)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
            onlyInStock
              ? "border-fresh bg-fresh/15 text-fresh"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              onlyInStock ? "bg-fresh animate-pulse" : "bg-muted-foreground/40"
            }`}
          />
          In-Stock Only
          {onlyInStock ? <CheckCircle2 className="h-3.5 w-3.5 text-fresh" /> : null}
        </button>
      </div>

      {/* Results Header with Active Filters */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-semibold text-foreground">
            Showing <span className="font-bold text-primary dark:text-accent">{filteredProducts.length}</span>{" "}
            {filteredProducts.length === 1 ? "wholesale item" : "wholesale items"}
          </p>
          <RateCardModal
            products={filteredProducts}
            categoryFilter={effectiveCategory}
            brandFilter={effectiveBrand}
          />
        </div>

        {hasActiveFilters ? (
          <div className="flex flex-wrap items-center gap-2">
            {effectiveCategory ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-fresh/10 px-2.5 py-1 text-xs font-bold text-fresh">
                Category: {effectiveCategory}
                <button
                  type="button"
                  onClick={() => {
                    setCategory("");
                    if (urlCategory) router.push("/products");
                  }}
                  className="hover:opacity-75"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null}

            {effectiveBrand ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-fresh/10 px-2.5 py-1 text-xs font-bold text-fresh">
                Brand: {effectiveBrand}
                <button
                  type="button"
                  onClick={() => {
                    setBrand("");
                    if (urlBrand) router.push("/products");
                  }}
                  className="hover:opacity-75"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null}

            {effectiveSearch ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-fresh/10 px-2.5 py-1 text-xs font-bold text-fresh">
                Search: &ldquo;{effectiveSearch}&rdquo;
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    if (urlSearch) router.push("/products");
                  }}
                  className="hover:opacity-75"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null}

            {onlyInStock ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-fresh/10 px-2.5 py-1 text-xs font-bold text-fresh">
                In Stock Only
                <button
                  type="button"
                  onClick={() => setOnlyInStock(false)}
                  className="hover:opacity-75"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null}

            {moqTier !== "all" ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-fresh/10 px-2.5 py-1 text-xs font-bold text-fresh">
                MOQ: {moqTier === "low" ? "≤ 20 pcs" : "Bulk (20+ pcs)"}
                <button
                  type="button"
                  onClick={() => setMoqTier("all")}
                  className="hover:opacity-75"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null}

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-vermilion hover:underline"
            >
              <RotateCcw className="h-3 w-3" /> Clear all ({activeFilterCount})
            </button>
          </div>
        ) : null}
      </div>

      {/* Product Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <div className="mt-6 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center sm:p-14">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Boxes className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-foreground">
            {products.length > 0
              ? "No products match your current filters"
              : "Wholesale Catalogue is Being Updated"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {products.length > 0
              ? "Try clearing your search query or choosing a different brand or category."
              : "Our godown catalogue across Spices, Oils, Matchsticks and Pooja items is active for custom wholesale quotation. Request a direct quotation below."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {hasActiveFilters ? (
              <Button type="button" variant="outline" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4" /> Reset Filters
              </Button>
            ) : null}
            <Button asChild variant="gold">
              <Link href="/order" className="gap-2">
                <Send className="h-4 w-4" /> Build Custom Bulk Quote
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
