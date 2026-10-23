import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  PackageCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoreProductBySlug, productImageUrl } from "@/lib/products";
import { getDefaultBusinessSettings } from "@/lib/business-settings";
import { buildWhatsAppLink } from "@/lib/utils";
import { TranslatedText } from "@/components/translated-text";
import type { ReactNode } from "react";
import { LocalizedCatalogueLabel, LocalizedProductDescription } from "@/components/localized-product-description";
import { ProductImageGallery } from "@/components/product-image-gallery";

export const revalidate = 60;

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStoreProductBySlug(slug);
  if (!product) return { title: "Product not found | Gayatri Store" };

  const title = `${product.name} Wholesale Rates | Gayatri Store`;
  const description = product.description || `Request a wholesale quotation for ${product.name} from Gayatri Store.`;
  const image = product.imageUrl || productImageUrl();

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
          alt: product.name
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    }
  };
}

export default async function ProductDetailsPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getStoreProductBySlug(slug);
  const businessSettings = getDefaultBusinessSettings();

  if (!product) notFound();

  const availabilityKey = product.stockStatus === "in_stock"
    ? "product.availabilityStates.in_stock"
    : product.stockStatus === "out_of_stock"
      ? "product.availabilityStates.out_of_stock"
      : product.stockStatus === "limited"
        ? "product.availabilityStates.limited"
        : "product.availabilityUnknown";

  const images =
    product.images.length > 0
      ? product.images
      : [
          {
            id: "primary",
            image_url: product.imageUrl || productImageUrl(),
            alt_text: product.name,
            sort_order: 0
          }
        ];

  const whatsappLink = buildWhatsAppLink(
    `Hello Gayatri Store, please share wholesale quotation for *${product.name}* (SKU: ${product.sku || "N/A"}).`,
    businessSettings.whatsapp_number
  );

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        {/* Back navigation */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-fresh hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> <TranslatedText id="product.backCatalogue" />
        </Link>

        {/* Main Details Grid */}
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          {/* Left: Product Images Gallery */}
          <div>
            <ProductImageGallery images={images} fallbackUrl={productImageUrl()} productName={product.name} brandName={product.brandName} />
          </div>

          {/* Right: Product Specs & Actions */}
          <div className="flex flex-col">
            {product.categoryName ? (
              <span className="text-xs font-extrabold uppercase tracking-widest text-fresh">
                <LocalizedCatalogueLabel english={product.categoryName} hindi={product.categoryNameHi} />
              </span>
            ) : null}

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {product.name}
            </h1>

            {/* Wholesale Pricing State */}
            <div className="mt-4 inline-flex items-center gap-3">
              <span className="text-2xl font-black text-primary dark:text-accent">
                {product.price || <TranslatedText id="product.wholesaleQuote" />}
              </span>
              <span className="rounded-full bg-fresh/10 px-3 py-0.5 text-xs font-bold text-fresh">
                <TranslatedText id="product.b2bRate" />
              </span>
            </div>

            <LocalizedProductDescription english={product.description} hindi={product.descriptionHi} />

            {/* Technical Trade Specs */}
            <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <TranslatedText id="product.specifications" />
              </h2>
              <dl className="mt-3 divide-y divide-border text-sm">
                {product.sku ? <SpecRow label={<TranslatedText id="product.sku" />} value={product.sku} /> : null}
                {product.moq ? <SpecRow label={<TranslatedText id="product.minOrder" />} value={product.moq} /> : null}
                {product.packSize ? <SpecRow label={<TranslatedText id="product.packSize" />} value={product.packSize} /> : null}
                {product.unit ? <SpecRow label={<TranslatedText id="product.unit" />} value={product.unit} /> : null}
                {product.stockStatus !== "unknown" ? (
                  <SpecRow
                    label={<TranslatedText id="product.availability" />}
                    value={<TranslatedText id={availabilityKey} />}
                  />
                ) : null}
              </dl>
            </div>

            {/* Product Variants (if configured) */}
            {product.variants.length > 0 ? (
              <div className="mt-6">
                <h2 className="text-sm font-bold text-foreground"><TranslatedText id="product.variants" /></h2>
                <div className="mt-3 grid gap-2.5">
                  {product.variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5 text-sm"
                    >
                      <div>
                        <p className="font-bold text-foreground">{v.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.pack_size ? <><TranslatedText id="product.packSize" />: {v.pack_size}</> : null}
                          {v.unit ? <> · <TranslatedText id="product.unit" />: {v.unit}</> : null}
                          {v.moq_quantity ? <> · <TranslatedText id="product.minOrder" />: {v.moq_quantity}</> : null}
                          {!v.pack_size && !v.unit && !v.moq_quantity ? <TranslatedText id="product.inquireDetails" /> : null}
                        </p>
                      </div>
                      <Link
                        href={`/order?product=${encodeURIComponent(product.id)}&variant=${encodeURIComponent(v.id)}`}
                        className="inline-flex min-h-11 items-center rounded-lg bg-fresh/15 px-4 py-2 text-xs font-bold text-fresh transition-colors hover:bg-fresh hover:text-white"
                      >
                        <TranslatedText id="product.selectVariant" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Price Tiers (if configured) */}
            {product.priceTiers.length > 0 ? (
              <div className="mt-6">
                <h2 className="text-sm font-bold text-foreground"><TranslatedText id="product.tierPricing" /></h2>
                <div className="mt-2 overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/50 text-muted-foreground">
                      <tr>
                        <th className="p-3 font-semibold"><TranslatedText id="product.tierMinimum" /></th>
                        <th className="p-3 font-semibold"><TranslatedText id="product.unitPrice" /></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {product.priceTiers.map((tier, idx) => (
                        <tr key={idx} className="bg-card">
                          <td className="p-3 font-medium text-foreground">{tier.minimum_quantity} <TranslatedText id="product.units" /></td>
                          <td className="p-3 font-bold text-primary dark:text-accent">
                            {tier.currency} {tier.unit_price}
                            {tier.price_unit ? ` / ${tier.price_unit}` : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg" className="shadow-md">
                <Link href={`/order?product=${encodeURIComponent(product.id)}`} className="gap-2">
                  <PackageCheck className="h-5 w-5" />
                  <TranslatedText id="catalogue.requestPrice" />
                </Link>
              </Button>

              {whatsappLink ? (
                <Button asChild variant="outline" size="lg" className="border-fresh/30 text-fresh hover:bg-fresh/10">
                  <a href={whatsappLink} target="_blank" rel="noreferrer" className="gap-2">
                    <MessageCircle className="h-5 w-5 text-fresh" />
                    <TranslatedText id="product.whatsappInquiry" />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-foreground capitalize">{value}</dd>
    </div>
  );
}
