import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils";

export function WhatsAppFloat() {
  return (
    <a
      href={buildWhatsAppLink("Hello The Bulk Supplier, I want wholesale product rates.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-transform hover:scale-105"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
