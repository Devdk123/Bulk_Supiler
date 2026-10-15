import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

const headers = [
  "name", "brand", "category", "sku", "description", "variant", "unit", "pack_size",
  "units_per_carton", "moq_quantity", "order_increment", "price_amount", "price_currency",
  "price_unit", "quote_only", "stock_status", "status", "image_url",
  "variants_json", "price_tiers_json", "images_json"
];

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const format = new URL(request.url).searchParams.get("format") || "csv";
  if (format !== "csv" && format !== "xlsx") return NextResponse.json({ error: "Choose csv or xlsx format." }, { status: 400 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Products");
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = format === "xlsx"
    ? Buffer.from(await workbook.xlsx.writeBuffer())
    : Buffer.from(await workbook.csv.writeBuffer());
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": format === "xlsx"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bulk-supplier-products-template.${format}"`,
      "Cache-Control": "no-store"
    }
  });
}
