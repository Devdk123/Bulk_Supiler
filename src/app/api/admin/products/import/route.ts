import ExcelJS from "exceljs";
import JSZip from "jszip";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { productSlug } from "@/lib/products";
import { productSchema } from "@/lib/validation";

export const runtime = "nodejs";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const MAX_IMPORT_ROWS = 500;
const columns = [
  "name", "brand", "category", "sku", "description", "variant", "unit", "pack_size",
  "units_per_carton", "moq_quantity", "order_increment", "price_amount", "price_currency",
  "price_unit", "quote_only", "stock_status", "status", "image_url",
  "variants_json", "price_tiers_json", "images_json"
];

function cellText(cell: ExcelJS.Cell) {
  const value = cell.value;
  if (value && typeof value === "object" && "formula" in value) {
    throw new Error("Formula cells are not accepted. Use plain values in the import file.");
  }
  return cell.text.trim();
}

function nullableText(value: string) {
  return value === "" ? undefined : value;
}

function nullableNumber(value: string, label: string) {
  if (!value) return undefined;
  const result = Number(value);
  if (!Number.isFinite(result) || result <= 0) {
    throw new Error(`${label} must be a number greater than zero, or blank.`);
  }
  return result;
}

function parseBoolean(value: string) {
  if (!value) return undefined;
  if (["true", "yes", "1"].includes(value.toLowerCase())) return true;
  if (["false", "no", "0"].includes(value.toLowerCase())) return false;
  throw new Error("quote_only must be true or false.");
}

async function readWorkbook(file: File) {
  if (file.size <= 0 || file.size > MAX_IMPORT_BYTES) throw new Error("Choose a non-empty CSV or Excel file up to 5 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "csv" || file.type === "text/csv") {
    const workbook = new ExcelJS.Workbook();
    await workbook.csv.read(Readable.from([bytes.toString("utf8")]));
    if (!workbook.worksheets.length) throw new Error("The import file has no worksheet.");
    return workbook.worksheets[0];
  }

  if (extension !== "xlsx") throw new Error("Upload a .csv or .xlsx file.");

  let workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(bytes as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  } catch {
    // Accept valid Office workbooks that prefix SpreadsheetML tags and include Excel tables.
    const zip = await JSZip.loadAsync(bytes);
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir || !path.endsWith(".xml")) continue;
      let xml = await entry.async("string");
      if (path.startsWith("xl/worksheets/")) {
        xml = xml.replace(/<x:tableParts.*?<\/x:tableParts>/g, "");
      }
      xml = xml.replaceAll("<x:", "<").replaceAll("</x:", "</");
      zip.file(path, xml);
    }
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await zip.generateAsync({ type: "nodebuffer" }) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  }

  if (!workbook.worksheets.length) throw new Error("The import file has no worksheet.");
  return workbook.getWorksheet("Products_Import") || workbook.worksheets[0];
}

const headerAliases: Record<string, string | null> = {
  name: "name",
  productname: "name",
  brand: "brand",
  category: "category",
  sku: "sku",
  internalskusuggested: "sku",
  description: "description",
  variant: "variant",
  variantfragrance: "variant",
  unit: "unit",
  packsize: "pack_size",
  unitspercarton: "units_per_carton",
  moq: "moq_quantity",
  moqquantity: "moq_quantity",
  orderincrement: "order_increment",
  priceamount: "price_amount",
  wholesalepriceinr: "price_amount",
  pricecurrency: "price_currency",
  priceunit: "price_unit",
  quoteonly: "quote_only",
  priceonrequest: "quote_only",
  stockstatus: "stock_status",
  status: "status",
  published: "status",
  imageurl: "image_url",
  imagepathurl: "image_url",
  variantsjson: "variants_json",
  pricetiersjson: "price_tiers_json",
  imagesjson: "images_json",
  imageverificationnotes: null
};

function canonicalHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

type TaxonomyRow = { id: string; name: string; slug: string; status: string; is_active: boolean };

async function loadTaxonomy(supabase: ReturnType<typeof getSupabaseAdmin>, table: "brands" | "categories") {
  const { data, error } = await supabase.from(table).select("id,name,slug,status,is_active");
  if (error) throw new Error(`Unable to load ${table}.`);
  return new Map((data as TaxonomyRow[] || []).map((row) => [row.name.trim().toLowerCase(), row]));
}

async function ensurePublishedTaxonomy(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  table: "brands" | "categories",
  name: string,
  records: Map<string, TaxonomyRow>
) {
  const normalizedName = name.trim().toLowerCase();
  const existing = records.get(normalizedName);
  if (existing) {
    if (existing.status !== "published" || !existing.is_active) {
      const { error } = await supabase.from(table).update({ status: "published", is_active: true }).eq("id", existing.id);
      if (error) throw new Error(`Unable to publish ${table.slice(0, -1)} "${name}".`);
      existing.status = "published";
      existing.is_active = true;
    }
    return existing.id;
  }

  const slug = productSlug(name);
  if (!slug) throw new Error(`Invalid ${table.slice(0, -1)} name.`);
  const collision = [...records.values()].find((record) => record.slug === slug);
  if (collision) throw new Error(`The ${table.slice(0, -1)} name "${name}" conflicts with an existing slug.`);

  const { data, error } = await supabase.from(table)
    .insert({ name: name.trim(), slug, status: "published", is_active: true })
    .select("id,name,slug,status,is_active")
    .single();
  if (error || !data) throw new Error(`Unable to create ${table.slice(0, -1)} "${name}".`);
  const record = data as TaxonomyRow;
  records.set(normalizedName, record);
  return record.id;
}

function parseRows(worksheet: ExcelJS.Worksheet) {
  const starterCatalogue = worksheet.name === "Products_Import";
  const header = worksheet.getRow(1);
  const headerMap = new Map<string, number>();
  for (let column = 1; column <= header.cellCount; column += 1) {
    const rawName = canonicalHeader(cellText(header.getCell(column)));
    if (!rawName) continue;
    const name = Object.hasOwn(headerAliases, rawName) ? headerAliases[rawName] : rawName;
    if (name) headerMap.set(name, column);
  }
  if (!headerMap.has("name")) throw new Error("The first row must contain the required 'name' column.");
  const unknown = [...headerMap.keys()].filter((name) => !columns.includes(name));
  if (unknown.length) throw new Error(`Unknown columns: ${unknown.join(", ")}.`);

  const rows: Array<{ row: number; values: Record<string, string> }> = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    if (!row.hasValues) continue;
    const values: Record<string, string> = {};
    for (const column of columns) {
      const index = headerMap.get(column);
      values[column] = index ? cellText(row.getCell(index)) : "";
    }
    if (starterCatalogue) {
      // Workbook descriptions and verification notes contain provisional details; keep them internal.
      values.description = "";
      values.image_url = "";
      values.status = ["yes", "true", "1"].includes(values.status.toLowerCase()) ? "published" : "draft";
    }
    rows.push({ row: rowNumber, values });
  }
  if (rows.length > MAX_IMPORT_ROWS) throw new Error(`Import is limited to ${MAX_IMPORT_ROWS} rows at a time.`);
  if (!rows.length) throw new Error("The file contains no product rows.");
  return rows;
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Invalid import file." }, { status: 400 }); }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a CSV or Excel file." }, { status: 400 });

  try {
    const worksheet = await readWorkbook(file);
    const rows = parseRows(worksheet);
    const starterCatalogue = worksheet.name === "Products_Import";
    const supabase = getSupabaseAdmin();
    const [{ data: brands, error: brandError }, { data: categories, error: categoryError }, { data: existing, error: existingError }] = await Promise.all([
      supabase.from("brands").select("id, name, status, is_active"),
      supabase.from("categories").select("id, name, status, is_active"),
      supabase.from("products").select("id, sku, slug").limit(10000)
    ]);
    if (brandError || categoryError || existingError) {
      return NextResponse.json({ error: "Unable to verify the import against the current catalogue." }, { status: 500 });
    }

    const brandIds = new Map((brands || []).map((brand) => [brand.name.trim().toLowerCase(), brand.id]));
    const categoryIds = new Map((categories || []).map((category) => [category.name.trim().toLowerCase(), category.id]));
    const existingBySku = new Map((existing || []).filter((product) => product.sku).map((product) => [product.sku!.trim().toLowerCase(), product]));
    const existingBySlug = new Map((existing || []).map((product) => [product.slug, product]));
    const seenSkus = new Set<string>();
    const seenSlugs = new Set<string>();
    const validRows = [];
    const invalidRows: Array<{ row: number; errors: string[] }> = [];

    for (const { row, values } of rows) {
      const errors: string[] = [];
      let parsedProduct;
      let existingSku: { id: string; sku: string | null; slug: string } | undefined;
      const brandName = values.brand.trim();
      const categoryName = values.category.trim();
      try {
        const brandId = brandName ? brandIds.get(brandName.toLowerCase()) : undefined;
        const categoryId = categoryName ? categoryIds.get(categoryName.toLowerCase()) : undefined;
        if (brandName && !brandId && !starterCatalogue) errors.push(`Unknown brand "${brandName}". Create it in Admin first.`);
        if (categoryName && !categoryId && !starterCatalogue) errors.push(`Unknown category "${categoryName}". Create it in Admin first.`);

        const sku = nullableText(values.sku);
        const normalizedSku = sku?.toLowerCase();
        existingSku = normalizedSku ? existingBySku.get(normalizedSku) : undefined;
        if (normalizedSku && seenSkus.has(normalizedSku)) {
          errors.push(`Duplicate SKU "${sku}" appears more than once in this file.`);
        }

        const slug = productSlug(values.name);
        const slugOwner = existingBySlug.get(slug);
        if (!slug || (slugOwner && slugOwner.id !== existingSku?.id) || seenSlugs.has(slug)) {
          errors.push(`Product name "${values.name}" conflicts with an existing slug.`);
        }
        const stockStatus = nullableText(values.stock_status) || "unknown";
        const status = nullableText(values.status) || "draft";
        const quoteOnly = parseBoolean(values.quote_only) ?? true;
        const priceAmount = nullableNumber(values.price_amount, "price_amount");
        if (quoteOnly && priceAmount !== undefined) errors.push("Remove price_amount or set quote_only to false.");
        const variants = values.variants_json ? JSON.parse(values.variants_json) : [];
        const sourcePriceTiers = values.price_tiers_json ? JSON.parse(values.price_tiers_json) : [];
        const variantNames = new Map(
          Array.isArray(variants)
            ? variants.map((variant: { id?: string; name?: string }) => [variant.id, variant.name])
            : []
        );
        const priceTiers = Array.isArray(sourcePriceTiers)
          ? sourcePriceTiers.map((tier: { variant_id?: string | null; variant_name?: string | null }) => ({
            ...tier,
            variant_name: tier.variant_name || (tier.variant_id ? variantNames.get(tier.variant_id) : undefined),
            variant_id: null
          }))
          : sourcePriceTiers;
        const images = values.images_json ? JSON.parse(values.images_json) : [];

        const product = {
          name: values.name,
          sku,
          description: nullableText(values.description),
          brand_id: brandId,
          category_id: categoryId,
          variant: nullableText(values.variant),
          unit: nullableText(values.unit),
          pack_size: nullableText(values.pack_size),
          units_per_carton: values.units_per_carton ? Number(values.units_per_carton) : undefined,
          moq_quantity: nullableNumber(values.moq_quantity, "moq_quantity"),
          order_increment: nullableNumber(values.order_increment, "order_increment"),
          price_amount: priceAmount,
          price_currency: nullableText(values.price_currency) || "INR",
          price_unit: nullableText(values.price_unit),
          quote_only: quoteOnly,
          stock_status: stockStatus,
          status,
          image_url: nullableText(values.image_url),
          images,
          variants,
          price_tiers: priceTiers
        };
        const validated = productSchema.safeParse(product);
        if (!validated.success) errors.push(...validated.error.issues.map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`));
        else parsedProduct = { ...validated.data, slug };
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Invalid row.");
      }

      if (!errors.length && parsedProduct) {
        const normalizedSku = parsedProduct.sku?.toLowerCase();
        if (normalizedSku) seenSkus.add(normalizedSku);
        seenSlugs.add(parsedProduct.slug);
        validRows.push({
          row,
          product: parsedProduct,
          variants: [],
          images: [],
          price_tiers: [],
          brand_name: brandName || null,
          category_name: categoryName || null,
          already_exists: Boolean(existingSku)
        });
      } else {
        invalidRows.push({ row, errors });
      }
    }

    return NextResponse.json(
      {
        validRows,
        invalidRows,
        totalRows: rows.length,
        existingRows: validRows.filter((row) => row.already_exists).length,
        newRows: validRows.filter((row) => !row.already_exists).length
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to read import file." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid import commit request." }, { status: 400 }); }
  if (!body || typeof body !== "object" || !("rows" in body) || !Array.isArray(body.rows) || body.rows.length < 1 || body.rows.length > MAX_IMPORT_ROWS) {
    return NextResponse.json({ error: `Select between 1 and ${MAX_IMPORT_ROWS} valid rows to import.` }, { status: 400 });
  }

  const rows = body.rows as unknown[];
  const preparedRows: Array<{
    product: z.infer<typeof productSchema> & { slug: string };
    brandName: string;
    categoryName: string;
    variants: unknown[];
    images: unknown[];
    price_tiers: unknown[];
  }> = [];
  for (const item of rows) {
    if (!item || typeof item !== "object" || !("product" in item)) {
      return NextResponse.json({ error: "Import preview is invalid. Preview the file again." }, { status: 400 });
    }
    const record = item as Record<string, unknown>;
    const parsed = productSchema.safeParse(record.product);
    if (!parsed.success) {
      return NextResponse.json({ error: "An import row changed after preview. Preview the file again." }, { status: 400 });
    }
    const brandName = typeof record.brand_name === "string" ? record.brand_name.trim() : "";
    const categoryName = typeof record.category_name === "string" ? record.category_name.trim() : "";
    if (!brandName || !categoryName) {
      return NextResponse.json({ error: "Every imported product needs a brand and category." }, { status: 400 });
    }
    preparedRows.push({
      product: { ...parsed.data, slug: productSlug(parsed.data.name), image_url: parsed.data.image_url || null },
      brandName,
      categoryName,
      variants: parsed.data.variants,
      images: parsed.data.images,
      price_tiers: parsed.data.price_tiers
    });
  }

  const skus = preparedRows.map((row) => row.product.sku?.trim().toLowerCase()).filter((sku): sku is string => Boolean(sku));
  if (new Set(skus).size !== skus.length) return NextResponse.json({ error: "Import includes duplicate SKUs." }, { status: 400 });

  try {
    const supabase = getSupabaseAdmin();
    const [{ data: existing, error: existingError }, brandRecords, categoryRecords] = await Promise.all([
      skus.length ? supabase.from("products").select("sku").in("sku", skus) : Promise.resolve({ data: [], error: null }),
      loadTaxonomy(supabase, "brands"),
      loadTaxonomy(supabase, "categories")
    ]);
    if (existingError) return NextResponse.json({ error: "Unable to check existing SKUs." }, { status: 500 });
    const existingSkus = new Set((existing || []).map((row) => row.sku?.trim().toLowerCase()).filter(Boolean));
    const skippedExisting = preparedRows.filter((row) => row.product.sku && existingSkus.has(row.product.sku.toLowerCase())).length;
    const newRows = preparedRows.filter((row) => !row.product.sku || !existingSkus.has(row.product.sku.toLowerCase()));

    if (!newRows.length) {
      return NextResponse.json({ imported: 0, skippedExisting, totalRows: preparedRows.length }, { status: 200 });
    }

    // Check the existing RPC before creating any taxonomy records.
    const { error: rpcCheckError } = await supabase.rpc("save_products_bulk", { p_products: [] });
    if (rpcCheckError) return NextResponse.json({ error: "Product import database function is unavailable; apply the current Supabase migrations first." }, { status: 503 });

    const slugs = newRows.map((row) => row.product.slug);
    const { data: slugConflicts, error: slugError } = await supabase.from("products").select("slug").in("slug", slugs);
    if (slugError) return NextResponse.json({ error: "Unable to check product names against the current catalogue." }, { status: 500 });
    if (slugConflicts?.length) return NextResponse.json({ error: "A product name was added since preview. Preview the file again." }, { status: 409 });

    for (const row of newRows) {
      row.product.brand_id = await ensurePublishedTaxonomy(supabase, "brands", row.brandName, brandRecords);
      row.product.category_id = await ensurePublishedTaxonomy(supabase, "categories", row.categoryName, categoryRecords);
    }

    const importRows = newRows.map(({ product, variants, images, price_tiers }) => ({ product, variants, images, price_tiers }));
    const { data, error } = await supabase.rpc("save_products_bulk", { p_products: importRows });
    if (error) {
      console.error("Bulk product import failed:", error.message);
      return NextResponse.json({ error: "Unable to import products. No rows were committed; check duplicate SKUs and migration setup." }, { status: 400 });
    }
    return NextResponse.json({ imported: Array.isArray(data) ? data.length : 0, skippedExisting, totalRows: preparedRows.length }, { status: 201 });
  } catch (error) {
    console.error("Bulk product import failed:", error);
    return NextResponse.json({ error: "Unable to import products." }, { status: 500 });
  }
}
