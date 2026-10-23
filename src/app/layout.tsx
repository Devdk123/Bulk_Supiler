import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { MobileWholesaleDock } from "@/components/mobile-wholesale-dock";
import { AiAssistantLoader } from "@/components/ai-assistant-loader";
import { AuthProvider } from "@/context/auth-context";
import { LanguageProvider } from "@/context/language-context";
import { QuoteCartProvider } from "@/context/quote-cart-context";
import { ServiceWorkerManager } from "@/components/service-worker-manager";
import { OfflineBanner } from "@/components/offline-banner";
import { getDefaultBusinessSettings } from "@/lib/business-settings";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bulksupiler.in"),
  icons: {
    icon: [
      { url: "/icons/gayatri-store-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/gayatri-store-512.png", type: "image/png", sizes: "512x512" }
    ],
    apple: [{ url: "/icons/gayatri-store-192.png", type: "image/png", sizes: "192x192" }]
  },
  title: {
    default: "Gayatri Store | B2B Wholesale & FMCG Distribution",
    template: "%s | Gayatri Store"
  },
  description:
    "Browse Gayatri Store's published wholesale product listings and ask the team for current prices and availability.",
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
    title: "Gayatri Store | Wholesale Product Catalogue",
    description: "Browse published product listings and request current wholesale prices from Gayatri Store.",
    type: "website",
    locale: "en_IN",
    siteName: "Gayatri Store"
  },
  twitter: {
    card: "summary_large_image",
    title: "Gayatri Store | B2B Wholesale & FMCG Distribution",
    description: "Browse published wholesale products and request current prices from Gayatri Store."
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#174735"
};

export const revalidate = 300;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const businessSettings = getDefaultBusinessSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bulksupiler.in";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WholesaleStore",
    name: "Gayatri Store",
    description:
      "Gayatri Store publishes wholesale product listings and accepts enquiries for current prices and availability.",
    url: siteUrl,
    telephone: businessSettings.contact_phone || businessSettings.whatsapp_number || "+918849263377",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Maya Bazar",
      addressCountry: "IN"
    },
    currenciesAccepted: "INR",
    areaServed: "Maya Bazar and nearby markets"
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const t=localStorage.getItem("gayatristore-theme")||localStorage.getItem("bulk-supplier-theme");document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch{document.documentElement.dataset.theme="light"}})();`
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-accent selection:text-primary">
        <LanguageProvider>
          <AuthProvider>
            <QuoteCartProvider>
            <ServiceWorkerManager />
            <OfflineBanner />
            <SiteHeader whatsappNumber={businessSettings.whatsapp_number} />
            <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
            <SiteFooter settings={businessSettings} />
            <AiAssistantLoader />
            <WhatsAppFloat whatsappNumber={businessSettings.whatsapp_number} />
            <MobileWholesaleDock whatsappNumber={businessSettings.whatsapp_number} />
            <SpeedInsights />
            </QuoteCartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
