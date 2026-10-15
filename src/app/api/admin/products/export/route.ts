import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const fields = [
  "name", "brand", "category", "sku", "description", "variant", "unit", "pack_size",
  "units_per_carton", "moq_quantity", "order_increment", "price_amount", "price_currency",
  "price_unit", "quote_only", "stock_status", "status", "image_url",
  "variants_json", "price_tiers_json", "images_json"
];

function spreadsheetSafe(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const format = new URL(request.url).searchParams.get("format") || "xlsx";
  if (format !== "csv" && format !== "xlsx") return NextResponse.json({ error: "Choose csv or xlsx format." }, { status: 400 });

  try {
    const supabase = getSupabaseAdmin();
    const rows = [];
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase
        .from("products")
        .select("name, sku, description, variant, unit, pack_size, units_per_carton, moq_quantity, order_increment, price_amount, price_currency, price_unit, quote_only, stock_status, status, image_url, brand:brands(name), category:categories(name), variants:product_variants(id, name, sku, unit, pack_size, units_per_carton, moq_quantity, order_increment, price_amount, price_currency, price_unit, stock_status, active), price_tiers:product_price_tiers(variant_id, minimum_quantity, unit_price, currency, price_unit), images:product_images(image_url, alt_text, sort_order)")
        .order("created_at", { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) return NextResponse.json({ error: "Unable to export catalogue." }, { status: 500 });
      rows.push(...(data || []));
      if (!data || data.length < pageSize) break;
      if (rows.length >= 50_000) return NextResponse.json({ error: "Export is limited to 50,000 products per file." }, { status: 413 });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Products");
    sheet.addRow(fields);
    sheet.getRow(1).font = { bold: true };
    for (const product of rows) {
      const variants = Array.isArray(product.variants) ? product.variants.map((variant: Record<string, unknown>) => ({
        id: undefined,
        name: variant.name,
        sku: variant.sku,
        unit: variant.unit,
        pack_size: variant.pack_size,
        units_per_carton: variant.units_per_carton,
        moq_quantity: variant.moq_quantity,
        order_increment: variant.order_increment,
        price_amount: variant.price_amount,
        price_currency: variant.price_currency,
        price_unit: variant.price_unit,
        stock_status: variant.stock_status,
        active: variant.active
      })) : [];
      const variantNames = new Map(variants.map((variant: Record<string, unknown>) => [String(variant.id), String(variant.name)]));
      const priceTiers = Array.isArray(product.price_tiers) ? product.price_tiers.map((tier: Record<string, unknown>) => ({
        variant_id: null,
        variant_name: tier.variant_id ? variantNames.get(String(tier.variant_id)) || null : null,
        minimum_quantity: tier.minimum_quantity,
        unit_price: tier.unit_price,
        currency: tier.currency,
        price_unit: tier.price_unit
      })) : [];
      sheet.addRow([
        spreadsheetSafe(product.name),
        spreadsheetSafe((product.brand as { name?: string } | null)?.name),
        spreadsheetSafe((product.category as { name?: string } | null)?.name),
        spreadsheetSafe(product.sku),
        spreadsheetSafe(product.description),
        spreadsheetSafe(product.variant),
        spreadsheetSafe(product.unit),
        spreadsheetSafe(product.pack_size),
        product.units_per_carton,
        product.moq_quantity,
        product.order_increment,
        product.price_amount,
        spreadsheetSafe(product.price_currency),
        spreadsheetSafe(product.price_unit),
        product.quote_only,
        spreadsheetSafe(product.stock_status),
        spreadsheetSafe(product.status),
        spreadsheetSafe(product.image_url),
        JSON.stringify(variants),
        JSON.stringify(priceTiers),
        JSON.stringify(product.images || [])
      ]);
    }

    const buffer = format === "xlsx"
      ? Buffer.from(await workbook.xlsx.writeBuffer())
      : Buffer.from(await workbook.csv.writeBuffer());
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bulk-supplier-products.${format}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("Catalogue export failed:", error);
    return NextResponse.json({ error: "Unable to export catalogue." }, { status: 500 });
  }
}
