import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function buildWhatsAppLink(message: string, contactNumber?: string | null) {
  const configured = contactNumber === undefined ? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER : contactNumber;
  const number = configured?.replace(/\D/g, "");
  if (!number || number.length < 10 || number.length > 15) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
