import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  PackageCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoreProductBySlug, productImageUrl } from "@/lib/products";
import { getPublicBusinessSettings } from "@/lib/business-settings";
import { buildWhatsAppLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStoreProductBySlug(slug);
  if (!product) return { title: "Product not found | The Bulk Supplier" };

  const title = `${product.name} Wholesale Rates | The Bulk Supplier`;
  const description =
    product.description ||
    `Wholesale pricing, carton packaging and MOQ details for ${product.name}. Request a direct quote.`;
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
  const [product, businessSettings] = await Promise.all([
    getStoreProductBySlug(slug),
    getPublicBusinessSettings()
  ]);

  if (!product) notFound();

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
    `Hello The Bulk Supplier, please share wholesale quotation for *${product.name}* (SKU: ${product.sku || "N/A"}).`,
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
          <ArrowLeft className="h-4 w-4" /> Back to Wholesale Catalogue
        </Link>

        {/* Main Details Grid */}
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          {/* Left: Product Images Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <Image
                src={images[0].image_url || productImageUrl()}
                alt={images[0].alt_text || product.name}
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                unoptimized={images[0].image_url?.startsWith("https://") || false}
                className="object-cover"
              />
              {product.brandName ? (
                <div className="absolute left-4 top-4 rounded-xl bg-card/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary shadow-xs backdrop-blur-xs">
                  {product.brandName}
                </div>
              ) : null}
            </div>

            {images.length > 1 ? (
              <div className="grid grid-cols-4 gap-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-square overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <Image
                      src={image.image_url || productImageUrl()}
                      alt={image.alt_text || product.name}
                      fill
                      sizes="15vw"
                      unoptimized={image.image_url?.startsWith("https://") || false}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Right: Product Specs & Actions */}
          <div className="flex flex-col">
            {product.categoryName ? (
              <span className="text-xs font-extrabold uppercase tracking-widest text-fresh">
                {product.categoryName}
              </span>
            ) : null}

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {product.name}
            </h1>

            {/* Wholesale Pricing State */}
            <div className="mt-4 inline-flex items-center gap-3">
              <span className="text-2xl font-black text-primary dark:text-accent">
                {product.price || "Wholesale Quote on Request"}
              </span>
              <span className="rounded-full bg-fresh/10 px-3 py-0.5 text-xs font-bold text-fresh">
                B2B Godown Rate
              </span>
            </div>

            {product.description ? (
              <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
                {product.description}
              </p>
            ) : null}

            {/* Technical Trade Specs */}
            <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Wholesale Specifications
              </h2>
              <dl className="mt-3 divide-y divide-border text-sm">
                {product.sku ? <SpecRow label="SKU / Batch Code" value={product.sku} /> : null}
                {product.moq ? <SpecRow label="Minimum Order Quantity (MOQ)" value={product.moq} /> : null}
                {product.packSize ? <SpecRow label="Master Pack Size" value={product.packSize} /> : null}
                {product.unit ? <SpecRow label="Unit of Measurement" value={product.unit} /> : null}
                {product.stockStatus !== "unknown" ? (
                  <SpecRow
                    label="Availability"
                    value={product.stockStatus.replaceAll("_", " ")}
                  />
                ) : null}
              </dl>
            </div>

            {/* Product Variants (if configured) */}
            {product.variants.length > 0 ? (
              <div className="mt-6">
                <h2 className="text-sm font-bold text-foreground">Available Pack Variants</h2>
                <div className="mt-3 grid gap-2.5">
                  {product.variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5 text-sm"
                    >
                      <div>
                        <p className="font-bold text-foreground">{v.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[
                            v.pack_size ? `Pack: ${v.pack_size}` : "",
                            v.unit ? `Unit: ${v.unit}` : "",
                            v.moq_quantity ? `MOQ: ${v.moq_quantity}` : ""
                          ]
                            .filter(Boolean)
                            .join(" • ") || "Inquire for details"}
                        </p>
                      </div>
                      <Link
                        href={`/order?product=${encodeURIComponent(product.id)}&variant=${encodeURIComponent(v.id)}`}
                        className="rounded-lg bg-fresh/15 px-3 py-1.5 text-xs font-bold text-fresh hover:bg-fresh hover:text-white transition-colors"
                      >
                        Select
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Price Tiers (if configured) */}
            {product.priceTiers.length > 0 ? (
              <div className="mt-6">
                <h2 className="text-sm font-bold text-foreground">Configured Tier Pricing</h2>
                <div className="mt-2 overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/50 text-muted-foreground">
                      <tr>
                        <th className="p-3 font-semibold">Tier Minimum Quantity</th>
                        <th className="p-3 font-semibold">Wholesale Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {product.priceTiers.map((tier, idx) => (
                        <tr key={idx} className="bg-card">
                          <td className="p-3 font-medium text-foreground">{tier.minimum_quantity} units</td>
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
                  <span>Add to Bulk Order</span>
                </Link>
              </Button>

              {whatsappLink ? (
                <Button asChild variant="outline" size="lg" className="border-fresh/30 text-fresh hover:bg-fresh/10">
                  <a href={whatsappLink} target="_blank" rel="noreferrer" className="gap-2">
                    <MessageCircle className="h-5 w-5 text-fresh" />
                    <span>Inquire on WhatsApp</span>
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

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-foreground capitalize">{value}</dd>
    </div>
  );
}
