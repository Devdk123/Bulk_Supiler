import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoreProductBySlug, productImageUrl } from "@/lib/products";
import { getPublicBusinessSettings } from "@/lib/business-settings";
import { buildWhatsAppLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStoreProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: product.description || `${product.name} wholesale product information and quote request.`
  };
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, businessSettings] = await Promise.all([
    getStoreProductBySlug(slug),
    getPublicBusinessSettings()
  ]);
  if (!product) notFound();

  const images = product.images.length
    ? product.images
    : [{ id: "primary", image_url: product.imageUrl || productImageUrl(), alt_text: product.name, sort_order: 0 }];
  const whatsappLink = buildWhatsAppLink(`Hello, please share a wholesale quote for ${product.name}.`, businessSettings.whatsapp_number);

  return (
    <section className="py-12">
      <div className="container-page">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to catalogue
        </Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {images.map((image) => (
              <div key={image.id} className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-secondary">
                <Image
                  src={image.image_url || productImageUrl()}
                  alt={image.alt_text || product.name}
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  unoptimized={image.image_url?.startsWith("https://") || false}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <div>
            {product.brandName ? <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{product.brandName}</p> : null}
            <h1 className="mt-2 text-3xl font-extrabold text-primary md:text-4xl">{product.name}</h1>
            {product.categoryName ? <p className="mt-2 text-sm text-muted-foreground">{product.categoryName}</p> : null}
            <p className="mt-5 text-lg font-bold text-primary">{product.price || "Request wholesale quote"}</p>
            {product.description ? <p className="mt-5 whitespace-pre-line leading-7 text-foreground">{product.description}</p> : null}
            <dl className="mt-6 grid gap-3 rounded-lg border bg-card p-5 text-sm">
              {product.sku ? <Detail label="SKU" value={product.sku} /> : null}
              {product.moq ? <Detail label="Minimum order" value={product.moq} /> : null}
              {product.packSize ? <Detail label="Pack size" value={product.packSize} /> : null}
              {product.unit ? <Detail label="Unit" value={product.unit} /> : null}
              {product.stockStatus !== "unknown" ? <Detail label="Availability" value={product.stockStatus.replaceAll("_", " ")} /> : null}
            </dl>

            {product.variants.length ? (
              <div className="mt-7">
                <h2 className="font-bold text-primary">Available options</h2>
                <ul className="mt-3 grid gap-2">
                  {product.variants.map((variant) => (
                    <li key={variant.id} className="rounded-md border bg-card p-4">
                      <p className="font-semibold">{variant.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[variant.pack_size, variant.unit, variant.moq_quantity ? `MOQ ${variant.moq_quantity}` : ""].filter(Boolean).join(" · ") || "Ask for details"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {product.priceTiers.length ? (
              <div className="mt-7 overflow-x-auto">
                <h2 className="mb-2 font-bold text-primary">Configured quantity price tiers</h2>
                <table className="w-full text-left text-sm">
                  <thead><tr><th className="border-b p-2">From quantity</th><th className="border-b p-2">Price</th></tr></thead>
                  <tbody>
                    {product.priceTiers.map((tier, index) => (
                      <tr key={`${tier.variant_id || "base"}-${tier.minimum_quantity}-${index}`}>
                        <td className="border-b p-2">{tier.minimum_quantity}</td>
                        <td className="border-b p-2">{tier.currency} {tier.unit_price}{tier.price_unit ? ` / ${tier.price_unit}` : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <Link href={`/order?product=${encodeURIComponent(product.id)}`}>Add to quote request</Link>
              </Button>
              {whatsappLink ? (
                <Button asChild variant="outline" size="lg">
                  <a href={whatsappLink} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> Ask on WhatsApp</a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold capitalize">{value}</dd>
    </div>
  );
}
