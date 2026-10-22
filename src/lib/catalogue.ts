import { unstable_cache } from "next/cache";
import { getSupabasePublic, isSupabasePublicConfigured } from "@/lib/supabase";

export type CatalogueBrand = { id: string; name: string; slug: string; description: string | null; logo_url: string | null };
export type CatalogueCategory = { id: string; name: string; slug: string; description: string | null; image_url: string | null };

async function fetchCatalogueFacets() {
  if (!isSupabasePublicConfigured()) throw new Error("Catalogue database is not configured.");
  const supabase = getSupabasePublic();
  const [brands, categories] = await Promise.all([
    supabase.from("brands").select("id, name, slug, description, logo_url").eq("status", "published").order("name"),
    supabase.from("categories").select("id, name, slug, description, image_url").eq("status", "published").order("name")
  ]);

  if (brands.error || categories.error) {
    throw new Error(brands.error?.message || categories.error?.message);
  }
  return { brands: brands.data || [], categories: categories.data || [] };
}

export const getCatalogueFacets = unstable_cache(fetchCatalogueFacets, ["public-catalogue-facets-v1"], {
  revalidate: 300,
  tags: ["store-products", "store-brands", "store-categories"]
});
