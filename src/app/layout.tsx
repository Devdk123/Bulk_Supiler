import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { getPublicBusinessSettings } from "@/lib/business-settings";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bulksupiler.in"),
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

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const businessSettings = await getPublicBusinessSettings();
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const t=localStorage.getItem("bulk-supplier-theme");document.documentElement.dataset.theme=t==="light"||t==="dark"?t:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch{document.documentElement.dataset.theme="light"}})();`
          }}
        />
      </head>
      <body className="antialiased">
        <SiteHeader whatsappNumber={businessSettings.whatsapp_number} />
        <main>{children}</main>
        <SiteFooter settings={businessSettings} />
        <WhatsAppFloat whatsappNumber={businessSettings.whatsapp_number} />
      </body>
    </html>
  );
}
