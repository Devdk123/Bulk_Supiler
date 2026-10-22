import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getSupabasePublic, isSupabasePublicConfigured } from "@/lib/supabase";

export type ProductVariant = {
  id: string;
  name: string;
  unit: string | null;
  pack_size: string | null;
  units_per_carton: number | null;
  moq_quantity: number | null;
  order_increment: number | null;
  active: boolean;
};

export type ProductImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
};

export type ProductPriceTier = {
  variant_id: string | null;
  minimum_quantity: number;
  unit_price: number;
  currency: string;
  price_unit: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  price: string | null;
  moq: string | null;
  quality: string | null;
  packing: string | null;
  imageUrl: string | null;
  sku: string | null;
  description: string | null;
  variant: string | null;
  unit: string | null;
  packSize: string | null;
  brandName: string | null;
  categoryName: string | null;
  stockStatus: string;
  quoteOnly: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  priceTiers: ProductPriceTier[];
};

export type ProductRecord = Product & {
  active: boolean;
  status: "draft" | "published" | "archived";
  created_at: string;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: string | null;
  moq: string | null;
  quality: string | null;
  packing: string | null;
  image_url: string | null;
  active: boolean;
  created_at: string;
  status: ProductRecord["status"];
  sku: string | null;
  description: string | null;
  variant: string | null;
  unit: string | null;
  pack_size: string | null;
  units_per_carton: number | null;
  moq_quantity: number | null;
  order_increment: number | null;
  price_amount: number | null;
  price_currency: string | null;
  price_unit: string | null;
  quote_only: boolean;
  stock_status: string;
  brand: { name: string } | { name: string }[] | null;
  category: { name: string } | { name: string }[] | null;
  variants: ProductVariant[];
  images: ProductImage[];
  price_tiers: ProductPriceTier[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function productImageUrl() {
  return "/images/product-placeholder.svg";
}

export function productSlug(value: string) {
  return slugify(value);
}

function formatPrice(row: ProductRow) {
  if (row.quote_only || row.price_amount === null) {
    return null;
  }

  const amount = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2
  }).format(row.price_amount);
  return `${row.price_currency || "INR"} ${amount}${row.price_unit ? ` / ${row.price_unit}` : ""}`;
}

function formatMoq(row: ProductRow) {
  if (row.moq_quantity === null || !row.unit) {
    return null;
  }

  return `${row.moq_quantity} ${row.unit}`;
}

function mapProductRow(row: ProductRow): Product {
  const brand = Array.isArray(row.brand) ? row.brand[0] : row.brand;
  const category = Array.isArray(row.category) ? row.category[0] : row.category;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: formatPrice(row),
    moq: formatMoq(row),
    quality: row.quality,
    packing: row.pack_size || row.packing,
    imageUrl: row.image_url,
    sku: row.sku,
    description: row.description,
    variant: row.variant,
    unit: row.unit,
    packSize: row.pack_size,
    brandName: brand?.name || null,
    categoryName: category?.name || row.quality,
    stockStatus: row.stock_status,
    quoteOnly: row.quote_only || row.price_amount === null,
    variants: (row.variants || []).filter((variant) => variant.active),
    images: row.images || [],
    priceTiers: row.price_tiers || []
  };
}

const storeProductSelect = `
  id, name, slug, price, moq, quality, packing, image_url, active, created_at,
  status, sku, description, variant, unit, pack_size, units_per_carton,
  moq_quantity, order_increment, price_amount, price_currency, price_unit,
  quote_only, stock_status, brand:brands(name), category:categories(name),
  variants:product_variants(id, name, unit, pack_size, units_per_carton, moq_quantity, order_increment, active),
  images:product_images(id, image_url, alt_text, sort_order),
  price_tiers:product_price_tiers(variant_id, minimum_quantity, unit_price, currency, price_unit)
`;

async function fetchStoreProducts(limit?: number): Promise<Product[]> {
  if (!isSupabasePublicConfigured()) {
    return [];
  }

  try {
    const supabase = getSupabasePublic();
    let query = supabase
      .from("products")
      .select(storeProductSelect)
      .eq("status", "published")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
      timer = setTimeout(() => {
        resolve({ data: null, error: { message: "Products query timed out (3000ms limit)." } });
      }, 3000);
    });

    const result = await Promise.race([
      query.then((res) => {
        if (timer) clearTimeout(timer);
        return res;
      }),
      timeoutPromise
    ]);

    if (result.error) {
      console.warn("Unable to load published products from Supabase:", result.error.message);
      return [];
    }

    return ((result.data || []) as ProductRow[]).map(mapProductRow);
  } catch (error) {
    console.warn("Unable to reach Supabase while loading published products:", error);
    return [];
  }
}

const getCachedStoreProducts = unstable_cache(
  async (limit?: number) => fetchStoreProducts(limit),
  ["store-products-list"],
  {
    revalidate: 60,
    tags: ["store-products"]
  }
);

export const getStoreProducts = cache(async function getStoreProducts(options: { limit?: number } = {}) {
  try {
    return await getCachedStoreProducts(options.limit);
  } catch {
    return fetchStoreProducts(options.limit);
  }
});

async function fetchStoreProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabasePublicConfigured()) {
    return null;
  }

  try {
    const supabase = getSupabasePublic();
    const query = supabase
      .from("products")
      .select(storeProductSelect)
      .eq("slug", slug)
      .eq("status", "published")
      .eq("active", true)
      .maybeSingle();

    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
      timer = setTimeout(() => {
        resolve({ data: null, error: { message: "Product by slug query timed out (3000ms limit)." } });
      }, 3000);
    });

    const result = await Promise.race([
      query.then((res) => {
        if (timer) clearTimeout(timer);
        return res;
      }),
      timeoutPromise
    ]);

    if (result.error) {
      console.warn("Unable to load product details from Supabase:", result.error.message);
      return null;
    }

    return result.data ? mapProductRow(result.data as ProductRow) : null;
  } catch (error) {
    console.warn("Unable to reach Supabase while loading product details:", error);
    return null;
  }
}

const getCachedStoreProductBySlug = unstable_cache(
  async (slug: string) => fetchStoreProductBySlug(slug),
  ["store-product-by-slug"],
  {
    revalidate: 60,
    tags: ["store-products"]
  }
);

export const getStoreProductBySlug = cache(async function getStoreProductBySlug(slug: string) {
  try {
    return await getCachedStoreProductBySlug(slug);
  } catch {
    return fetchStoreProductBySlug(slug);
  }
});
