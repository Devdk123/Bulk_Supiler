import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { MobileWholesaleDock } from "@/components/mobile-wholesale-dock";
import { AiAssistant } from "@/components/ai-assistant";
import { getPublicBusinessSettings } from "@/lib/business-settings";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bulksupiler.in"),
  title: {
    default: "Gayatri Store | B2B Wholesale & FMCG Distribution",
    template: "%s | Gayatri Store"
  },
  description:
    "Direct godown wholesale supplier for spices, edible oils, agarbatti, dhoop, matchsticks and daily goods for retail shops across Maya Bazar and nearby regional markets.",
  keywords: [
    "Gayatri Store",
    "wholesale supplier Maya Bazar",
    "FMCG distributor",
    "bulk spices wholesale",
    "edible oil wholesale",
    "agarbatti bulk rate",
    "dhoop wholesale market",
    "kirana store B2B supply"
  ],
  authors: [{ name: "Gayatri Store" }],
  openGraph: {
    title: "Gayatri Store — Your Local Wholesale Partner",
    description: "Big variety. Better supply. Built for your business. Serving Maya Bazar and nearby markets.",
    type: "website",
    locale: "en_IN",
    siteName: "Gayatri Store"
  },
  twitter: {
    card: "summary_large_image",
    title: "Gayatri Store | B2B Wholesale & FMCG Distribution",
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
    name: "Gayatri Store",
    description:
      "Direct godown wholesale supplier for spices, edible oils, agarbatti, dhoop, matchsticks and FMCG daily goods across Maya Bazar and nearby markets.",
    url: siteUrl,
    telephone: businessSettings.contact_phone || businessSettings.whatsapp_number || "+918849263377",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Maya Bazar",
      addressCountry: "IN"
    },
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    areaServed: "Maya Bazar and surrounding 50+ km trade zone"
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
            __html: `(()=>{try{const t=localStorage.getItem("gayatristore-theme")||localStorage.getItem("bulk-supplier-theme");document.documentElement.dataset.theme=t==="light"||t==="dark"?t:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch{document.documentElement.dataset.theme="light"}})();`
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-accent selection:text-primary">
        <SiteHeader whatsappNumber={businessSettings.whatsapp_number} />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <SiteFooter settings={businessSettings} />
        <AiAssistant />
        <WhatsAppFloat whatsappNumber={businessSettings.whatsapp_number} />
        <MobileWholesaleDock whatsappNumber={businessSettings.whatsapp_number} />
      </body>
    </html>
  );
}
