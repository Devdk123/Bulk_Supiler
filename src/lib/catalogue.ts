import { unstable_cache } from "next/cache";
import { getSupabasePublic, isSupabasePublicConfigured } from "@/lib/supabase";

export type CatalogueBrand = { id: string; name: string; slug: string; description: string | null; logo_url: string | null };
export type CatalogueCategory = { id: string; name: string; name_hi: string | null; slug: string; description: string | null; description_hi: string | null; image_url: string | null };

async function fetchCatalogueFacets() {
  if (!isSupabasePublicConfigured()) throw new Error("Catalogue database is not configured.");
  const supabase = getSupabasePublic();
  const [brands, localizedCategories] = await Promise.all([
    supabase.from("brands").select("id, name, slug, description, logo_url").eq("status", "published").order("name")
      .abortSignal(AbortSignal.timeout(2500)),
    supabase.from("categories").select("id, name, name_hi, slug, description, description_hi, image_url").eq("status", "published").order("name")
      .abortSignal(AbortSignal.timeout(2500))
  ]);

  let categories: CatalogueCategory[] = (localizedCategories.data || []) as CatalogueCategory[];
  let categoryError = localizedCategories.error;
  if (categoryError && /name_hi|description_hi|column/i.test(categoryError.message)) {
    const fallback = await supabase.from("categories")
      .select("id, name, slug, description, image_url")
      .eq("status", "published")
      .order("name")
      .abortSignal(AbortSignal.timeout(2500));
    categoryError = fallback.error;
    categories = (fallback.data || []).map((category) => ({ ...category, name_hi: null, description_hi: null }));
  }

  if (brands.error || categoryError) {
    throw new Error(brands.error?.message || categoryError?.message);
  }
  return { brands: brands.data || [], categories };
}

export const getCatalogueFacets = unstable_cache(fetchCatalogueFacets, ["public-catalogue-facets-v1"], {
  revalidate: 300,
  tags: ["store-products", "store-brands", "store-categories"]
});
