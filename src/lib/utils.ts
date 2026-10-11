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

export function buildWhatsAppLink(message: string) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919839450586";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
