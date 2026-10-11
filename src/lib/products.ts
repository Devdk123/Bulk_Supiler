export type Product = {
  name: string;
  slug: string;
  price: string;
  moq: string;
  quality: string;
  packing: string;
  imageUrl: string;
  badge?: string;
};

export type ProductRecord = Product & {
  id: string;
  active: boolean;
  created_at: string;
};

type ProductSeed = {
  name: string;
  category: string;
  imageUrl?: string;
  moq?: string;
  packing?: string;
  badge?: string;
};

const productSeeds: ProductSeed[] = [
  ...[
    "Rice",
    "Wheat",
    "Flour (Atta)",
    "Maida",
    "Suji",
    "Besan",
    "Pulses (Dal)",
    "Sugar",
    "Salt",
    "Jaggery (Gud)",
    "Dry Fruits",
    "Nuts",
    "Poha",
    "Vermicelli",
    "Oats",
    "Corn Flour"
  ].map((name) => ({ name, category: "Grocery & Food", moq: "25kg", packing: "Loose / bag packing" })),
  {
    name: "Turmeric Powder",
    category: "Spices (Masala)",
    imageUrl: "/images/Haldi-Powder.webp",
    moq: "20kg",
    packing: "5kg / 10kg bags",
    badge: "Best seller"
  },
  {
    name: "Red Chilli Powder",
    category: "Spices (Masala)",
    imageUrl: "/images/Chilli-powder.jpeg",
    moq: "20kg",
    packing: "5kg / 10kg bags"
  },
  {
    name: "Coriander Powder",
    category: "Spices (Masala)",
    imageUrl: "/images/dhaniya-powder.png",
    moq: "20kg",
    packing: "5kg / 10kg bags"
  },
  ...[
    "Cumin Powder",
    "Garam Masala",
    "Black Pepper",
    "Mustard Seeds",
    "Fenugreek Seeds",
    "Fennel Seeds",
    "Cardamom",
    "Cloves",
    "Cinnamon",
    "Bay Leaf",
    "Asafoetida (Hing)",
    "Kitchen King Masala"
  ].map((name) => ({
    name,
    category: "Spices (Masala)",
    imageUrl: name === "Black Pepper" ? "/images/kaali-mirch.jpeg" : undefined,
    moq: "10kg",
    packing: "1kg / 5kg packs"
  })),
  { name: "Chaat Masala", category: "Spices (Masala)", imageUrl: "/images/chat-masala.jpg", moq: "10kg", packing: "1kg / 5kg packs" },
  { name: "Pav Bhaji Masala", category: "Spices (Masala)", moq: "10kg", packing: "1kg / 5kg packs" },
  { name: "Biryani Masala", category: "Spices (Masala)", moq: "10kg", packing: "1kg / 5kg packs" },
  ...[
    "Mustard Oil",
    "Sunflower Oil",
    "Soybean Oil",
    "Groundnut Oil",
    "Coconut Oil",
    "Rice Bran Oil",
    "Palm Oil",
    "Olive Oil",
    "Sesame Oil",
    "Cottonseed Oil"
  ].map((name) => ({ name, category: "Edible Oils", moq: "12 litres", packing: "1L / 5L / tin packing" })),
  ...["Tea", "Coffee", "Green Tea", "Soft Drinks", "Fruit Juice", "Energy Drinks", "Packaged Water"].map((name) => ({
    name,
    category: "Beverages",
    imageUrl: name === "Tea" ? "/images/tea-patti.jpeg" : undefined,
    moq: "1 carton",
    packing: "Carton packing"
  })),
  ...["Chips", "Namkeen", "Biscuits", "Cookies", "Chocolates", "Candy", "Instant Noodles", "Popcorn"].map((name) => ({
    name,
    category: "Snacks & Namkeen",
    moq: "1 carton",
    packing: "Carton packing"
  })),
  ...[
    "Soap",
    "Shampoo",
    "Hair Oil",
    "Face Wash",
    "Toothpaste",
    "Toothbrush",
    "Talcum Powder",
    "Deodorant",
    "Perfume",
    "Hand Wash",
    "Sanitizer"
  ].map((name) => ({ name, category: "Personal Care", moq: "1 carton", packing: "Carton packing" })),
  ...[
    "Detergent Powder",
    "Detergent Liquid",
    "Dishwash Bar",
    "Dishwash Liquid",
    "Floor Cleaner",
    "Toilet Cleaner",
    "Glass Cleaner",
    "Phenyl",
    "Bleaching Powder"
  ].map((name) => ({ name, category: "Cleaning Products", moq: "1 carton", packing: "Carton / bulk packing" })),
  ...[
    "Agarbatti",
    "Dhoop Sticks",
    "Dhoop Cones",
    "Camphor (Kapoor)",
    "Cotton Wicks",
    "Diyas",
    "Ghee",
    "Puja Oil",
    "Incense Holders",
    "Havan Samagri",
    "Kumkum",
    "Roli",
    "Chandan Powder",
    "Kalash",
    "Puja Thali"
  ].map((name) => ({
    name,
    category: "Pooja Items",
    imageUrl: ["Agarbatti", "Dhoop Sticks", "Dhoop Cones"].includes(name) ? "/images/agarbatti.jpeg" : undefined,
    moq: "50 pieces",
    packing: "Carton packing"
  }))
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function externalImageUrl(name: string, category: string) {
  const label = encodeURIComponent(`${name}\n${category}`);

  return `https://placehold.co/640x480/f8edd7/51351a/png?font=montserrat&text=${label}`;
}

export const products: Product[] = productSeeds.map((product) => ({
  name: product.name,
  slug: slugify(product.name),
  price: "Contact for rate",
  moq: product.moq || "Bulk only",
  quality: product.category,
  packing: product.packing || "Bulk packing",
  imageUrl: product.imageUrl || externalImageUrl(product.name, product.category),
  badge: product.badge
}));

export const productNames = products.map((product) => product.name);

export function productImageUrl(name: string, category: string) {
  return externalImageUrl(name, category);
}

export function productSlug(value: string) {
  return slugify(value);
}

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: string;
  moq: string;
  quality: string;
  packing: string;
  image_url: string | null;
  active: boolean;
  created_at: string;
};

function mapProductRow(row: ProductRow): ProductRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: row.price,
    moq: row.moq,
    quality: row.quality,
    packing: row.packing,
    imageUrl: row.image_url || productImageUrl(row.name, row.quality),
    active: row.active,
    created_at: row.created_at
  };
}

export async function getStoreProducts(options: { includeInactive?: boolean; limit?: number } = {}) {
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase");
    const supabase = getSupabaseAdmin();
    let query = supabase.from("products").select("*").order("created_at", { ascending: false });

    if (!options.includeInactive) {
      query = query.eq("active", true);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error || !data?.length) {
      return products.slice(0, options.limit);
    }

    return (data as ProductRow[]).map(mapProductRow);
  } catch {
    return products.slice(0, options.limit);
  }
}
