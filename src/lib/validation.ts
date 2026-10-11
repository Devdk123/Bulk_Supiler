import { z } from "zod";

export const paymentMethods = ["UPI", "Cash", "Bank Transfer"] as const;
export const orderStatuses = ["New", "Contacted", "Confirmed", "Delivered", "Cancelled"] as const;

export const productSchema = z.object({
  name: z.string().trim().min(2, "Product name is required").max(100),
  price: z.string().trim().min(1, "Price is required").max(80),
  moq: z.string().trim().min(1, "MOQ is required").max(80),
  quality: z.string().trim().min(1, "Quality/category is required").max(120),
  packing: z.string().trim().min(1, "Packing is required").max(120),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  active: z.boolean().optional()
});

export const orderSchema = z.object({
  customer_name: z.string().trim().min(2, "Customer name is required"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit phone number"),
  whatsapp: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit WhatsApp number"),
  product_name: z.string().trim().min(2, "Select a product").max(100),
  quantity: z.string().trim().min(1, "Quantity is required").max(50),
  address: z.string().trim().min(8, "Delivery address is required"),
  city: z.string().trim().min(2, "Delivery city is required"),
  payment_method: z.enum(paymentMethods, {
    error: "Select a payment method"
  }),
  message: z.string().trim().max(500).optional().or(z.literal(""))
});

export const contactSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/),
  message: z.string().trim().min(8).max(500)
});
