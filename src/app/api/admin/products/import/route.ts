import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
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
  const workbook = new ExcelJS.Workbook();
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "csv" || file.type === "text/csv") {
    await workbook.csv.read(Readable.from([bytes.toString("utf8")]));
  } else if (extension === "xlsx") {
    await workbook.xlsx.read(Readable.from([bytes]));
  } else {
    throw new Error("Upload a .csv or .xlsx file.");
  }
  if (!workbook.worksheets.length) throw new Error("The import file has no worksheet.");
  return workbook.worksheets[0];
}

function parseRows(worksheet: ExcelJS.Worksheet) {
  const header = worksheet.getRow(1);
  const headerMap = new Map<string, number>();
  for (let column = 1; column <= header.cellCount; column += 1) {
    const name = cellText(header.getCell(column)).toLowerCase();
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
    const supabase = getSupabaseAdmin();
    const [{ data: brands, error: brandError }, { data: categories, error: categoryError }, { data: existing, error: existingError }] = await Promise.all([
      supabase.from("brands").select("id, name"),
      supabase.from("categories").select("id, name"),
      supabase.from("products").select("sku, slug").limit(10000)
    ]);
    if (brandError || categoryError || existingError) {
      return NextResponse.json({ error: "Unable to verify the import against the current catalogue." }, { status: 500 });
    }

    const brandIds = new Map((brands || []).map((brand) => [brand.name.toLowerCase(), brand.id]));
    const categoryIds = new Map((categories || []).map((category) => [category.name.toLowerCase(), category.id]));
    const existingSkus = new Set((existing || []).map((product) => product.sku?.trim().toLowerCase()).filter(Boolean));
    const existingSlugs = new Set((existing || []).map((product) => product.slug));
    const seenSkus = new Set<string>();
    const seenSlugs = new Set<string>();
    const validRows = [];
    const invalidRows: Array<{ row: number; errors: string[] }> = [];

    for (const { row, values } of rows) {
      const errors: string[] = [];
      let parsedProduct;
      try {
        const brandId = values.brand ? brandIds.get(values.brand.toLowerCase()) : undefined;
        const categoryId = values.category ? categoryIds.get(values.category.toLowerCase()) : undefined;
        if (values.brand && !brandId) errors.push(`Unknown brand "${values.brand}". Create it in Admin first.`);
        if (values.category && !categoryId) errors.push(`Unknown category "${values.category}". Create it in Admin first.`);

        const sku = nullableText(values.sku);
        const normalizedSku = sku?.toLowerCase();
        if (normalizedSku && (existingSkus.has(normalizedSku) || seenSkus.has(normalizedSku))) {
          errors.push(`Duplicate SKU "${sku}".`);
        }

        const slug = productSlug(values.name);
        if (!slug || existingSlugs.has(slug) || seenSlugs.has(slug)) errors.push(`Product name "${values.name}" conflicts with an existing slug.`);
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
        validRows.push({ row, product: parsedProduct, variants: [], images: [], price_tiers: [] });
      } else {
        invalidRows.push({ row, errors });
      }
    }

    return NextResponse.json(
      { validRows, invalidRows, totalRows: rows.length },
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
  const validRows = [];
  for (const item of rows) {
    if (!item || typeof item !== "object" || !("product" in item)) {
      return NextResponse.json({ error: "Import preview is invalid. Preview the file again." }, { status: 400 });
    }
    const parsed = productSchema.safeParse(item.product);
    if (!parsed.success) {
      return NextResponse.json({ error: "An import row changed after preview. Preview the file again." }, { status: 400 });
    }
    validRows.push({
      product: { ...parsed.data, slug: productSlug(parsed.data.name), image_url: parsed.data.image_url || null },
      variants: parsed.data.variants,
      images: parsed.data.images,
      price_tiers: parsed.data.price_tiers
    });
  }

  const skus = validRows.map((row) => row.product.sku?.trim().toLowerCase()).filter((sku): sku is string => Boolean(sku));
  if (new Set(skus).size !== skus.length) return NextResponse.json({ error: "Import includes duplicate SKUs." }, { status: 400 });

  try {
    const supabase = getSupabaseAdmin();
    if (skus.length) {
      const { data: existing, error } = await supabase.from("products").select("sku").in("sku", skus);
      if (error) return NextResponse.json({ error: "Unable to check existing SKUs." }, { status: 500 });
      if (existing?.length) return NextResponse.json({ error: "One or more SKUs were added since preview. Preview the file again." }, { status: 409 });
    }
    const { data, error } = await supabase.rpc("save_products_bulk", { p_products: validRows });
    if (error) {
      console.error("Bulk product import failed:", error.message);
      return NextResponse.json({ error: "Unable to import products. No rows were committed; check duplicate SKUs and migration setup." }, { status: 400 });
    }
    return NextResponse.json({ imported: Array.isArray(data) ? data.length : 0 }, { status: 201 });
  } catch (error) {
    console.error("Bulk product import failed:", error);
    return NextResponse.json({ error: "Unable to import products." }, { status: 500 });
  }
}
