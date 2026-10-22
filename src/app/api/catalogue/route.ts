import { NextResponse } from "next/server";
import { getStoreProductsPage, type ProductCatalogueOptions } from "@/lib/products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit") || 24);
  const rawOffset = Number(searchParams.get("offset") || 0);
  if (!Number.isInteger(rawLimit) || !Number.isInteger(rawOffset) || rawOffset < 0) {
    return NextResponse.json({ error: "Invalid catalogue page." }, { status: 400 });
  }

  const options: ProductCatalogueOptions = {
    limit: Math.min(rawLimit, 48),
    offset: rawOffset,
    search: searchParams.get("search") || undefined,
    brand: searchParams.get("brand") || undefined,
    category: searchParams.get("category") || undefined,
    stockOnly: searchParams.get("stock") === "true",
    moqTier: searchParams.get("moq") === "low" || searchParams.get("moq") === "bulk"
      ? searchParams.get("moq") as "low" | "bulk"
      : "all",
    sort: searchParams.get("sort") === "name" || searchParams.get("sort") === "name_desc"
      ? searchParams.get("sort") as "name" | "name_desc"
      : "newest"
  };

  try {
    const result = await getStoreProductsPage(options);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" }
    });
  } catch (error) {
    console.error("Public product catalogue query failed:", error);
    return NextResponse.json(
      { error: "The catalogue is temporarily unavailable. Please retry in a moment." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
