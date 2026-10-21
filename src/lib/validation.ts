import { z } from "zod";

export const orderStatuses = ["New", "Contacted", "Confirmed", "Delivered", "Cancelled"] as const;
export const enquiryStatuses = [
  "New",
  "Under Review",
  "Quotation Sent",
  "Confirmed",
  "Processing",
  "Dispatched",
  "Completed",
  "Cancelled"
] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const optionalPositiveNumber = z.number().positive().nullable().optional();

export const productVariantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(100),
  sku: optionalText(80),
  unit: optionalText(40),
  pack_size: optionalText(80),
  units_per_carton: z.number().int().positive().nullable().optional(),
  moq_quantity: optionalPositiveNumber,
  order_increment: optionalPositiveNumber,
  price_amount: optionalPositiveNumber,
  price_currency: z.string().trim().length(3).default("INR"),
  price_unit: optionalText(40),
  stock_status: z.enum(["unknown", "in_stock", "low_stock", "out_of_stock", "discontinued"]).default("unknown"),
  active: z.boolean().default(false)
});

export const productPriceTierSchema = z.object({
  variant_id: z.string().uuid().nullable().optional(),
  variant_name: optionalText(100),
  minimum_quantity: z.number().positive(),
  unit_price: z.number().positive(),
  currency: z.string().trim().length(3).default("INR"),
  price_unit: optionalText(40)
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Product name is required").max(100),
  sku: optionalText(80),
  description: optionalText(5000),
  brand_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  variant: optionalText(100),
  unit: optionalText(40),
  pack_size: optionalText(80),
  units_per_carton: z.number().int().positive().nullable().optional(),
  moq_quantity: optionalPositiveNumber,
  order_increment: optionalPositiveNumber,
  price_amount: optionalPositiveNumber,
  price_currency: z.string().trim().length(3).default("INR"),
  price_unit: optionalText(40),
  quote_only: z.boolean().default(true),
  stock_status: z.enum(["unknown", "in_stock", "low_stock", "out_of_stock", "discontinued"]).default("unknown"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  image_url: z.string().trim().url().nullable().optional(),
  images: z.array(z.object({ image_url: z.string().trim().url(), alt_text: optionalText(160) })).max(12).default([]),
  variants: z.array(productVariantSchema).max(100).default([]),
  price_tiers: z.array(productPriceTierSchema).max(100).default([])
});

export const enquirySchema = z.object({
  client_request_id: z.string().uuid(),
  customer_id: z.string().uuid().nullable().optional(),
  business_name: z.string().trim().min(2).max(160),
  contact_person: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit mobile number"),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pin_code: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid PIN code"),
  gstin: z.string().trim().max(15).optional().or(z.literal("")),
  delivery_requirements: z.string().trim().max(1000).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  customer_notes: optionalText(2000),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    variant_id: z.string().uuid().nullable().optional(),
    quantity: z.number().positive().max(1_000_000)
  })).min(1).max(30)
});

export const contactSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/),
  message: z.string().trim().min(8).max(500)
});
