import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";

export const metadata: Metadata = {
  metadataBase: new URL("https://thebulksupplier.in"),
  title: {
    default: "The Bulk Supplier - Wholesale Products at Best Price",
    template: "%s | The Bulk Supplier"
  },
  description: "Wholesale supplier for spices, agarbatti, tea patti, machis and daily goods in bulk across India.",
  openGraph: {
    title: "The Bulk Supplier",
    description: "Direct godown wholesale supply across India.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body className="antialiased">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
