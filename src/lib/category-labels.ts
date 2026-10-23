const categoryTranslationKeys: Record<string, string> = {
  "masala and spices": "home.categories.0.0",
  "edible oils": "home.categories.1.0",
  matchsticks: "home.categories.2.0",
  agarbatti: "home.categories.3.0",
  dhoop: "home.categories.4.0",
  "kapoor and pooja products": "home.categories.5.0",
  "other fmcg essentials": "home.categories.6.0"
};

export function categoryTranslationKey(name: string | null | undefined) {
  if (!name) return null;
  const normalized = name.trim().toLowerCase().replace(/\s*&\s*/g, " and ").replace(/\s+/g, " ");
  return categoryTranslationKeys[normalized] || null;
}
