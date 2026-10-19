import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { AiAssistant } from "@/components/ai-assistant";
import { getPublicBusinessSettings } from "@/lib/business-settings";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bulksupiler.in"),
  title: {
    default: "The Bulk Supplier | B2B Wholesale & FMCG Distribution",
    template: "%s | The Bulk Supplier"
  },
  description:
    "Direct godown wholesale supplier for spices, edible oils, agarbatti, dhoop, matchsticks and FMCG daily goods across India.",
  keywords: [
    "wholesale supplier India",
    "FMCG distributor",
    "bulk spices wholesale",
    "edible oil wholesale",
    "agarbatti bulk rate",
    "dhoop wholesale market",
    "B2B grocery supply"
  ],
  authors: [{ name: "The Bulk Supplier" }],
  openGraph: {
    title: "The Bulk Supplier - Premium Wholesale Supply",
    description: "Everything your store needs. Direct godown wholesale supply across India.",
    type: "website",
    locale: "en_IN",
    siteName: "The Bulk Supplier"
  },
  twitter: {
    card: "summary_large_image",
    title: "The Bulk Supplier | B2B Wholesale & FMCG Distribution",
    description: "Direct godown wholesale supplier for spices, edible oils, and FMCG daily goods."
  }
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const businessSettings = await getPublicBusinessSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bulksupiler.in";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WholesaleStore",
    name: "The Bulk Supplier",
    description:
      "Direct godown wholesale supplier for spices, edible oils, agarbatti, dhoop, matchsticks and FMCG daily goods across India.",
    url: siteUrl,
    telephone: businessSettings.contact_phone || businessSettings.whatsapp_number || "+918849263377",
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN"
    },
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    areaServed: "IN"
  };

  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const t=localStorage.getItem("bulk-supplier-theme");document.documentElement.dataset.theme=t==="light"||t==="dark"?t:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch{document.documentElement.dataset.theme="light"}})();`
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-accent selection:text-primary">
        <SiteHeader whatsappNumber={businessSettings.whatsapp_number} />
        <main className="flex-1">{children}</main>
        <SiteFooter settings={businessSettings} />
        <AiAssistant />
        <WhatsAppFloat whatsappNumber={businessSettings.whatsapp_number} />
      </body>
    </html>
  );
}
