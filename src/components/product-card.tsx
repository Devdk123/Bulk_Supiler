import Image from "next/image";
import Link from "next/link";
import { PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.imageUrl || "/images/product-placeholder.svg";

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-[#ded6c2] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[5/3] overflow-hidden bg-secondary">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          unoptimized={imageUrl.startsWith("https://")}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            {product.brandName ? <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{product.brandName}</p> : null}
            <h3 className="text-lg font-bold leading-snug text-primary">
              <Link href={`/products/${encodeURIComponent(product.slug)}`} className="hover:underline">{product.name}</Link>
            </h3>
            <p className="mt-1 text-sm font-semibold text-primary">
              {product.price || "Request wholesale quote"}
            </p>
          </div>
          <PackageCheck aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-accent" />
        </div>
        <dl className="mt-4 grid gap-2 text-sm">
          {product.moq ? (
            <div className="flex items-center justify-between gap-3 border-t pt-2.5">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Truck className="h-4 w-4" /> MOQ
              </dt>
              <dd className="font-semibold">{product.moq}</dd>
            </div>
          ) : null}
          {product.categoryName ? (
            <div className="flex items-center justify-between gap-3 border-t pt-2.5">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4" /> Category
              </dt>
              <dd className="text-right font-semibold">{product.categoryName}</dd>
            </div>
          ) : null}
          {product.packing ? (
            <div className="flex items-center justify-between gap-3 border-t pt-2.5">
              <dt className="text-muted-foreground">Pack size</dt>
              <dd className="text-right font-semibold">{product.packing}</dd>
            </div>
          ) : null}
        </dl>
        <Button asChild variant="gold" className="mt-auto w-full">
          <Link href={`/order?product=${encodeURIComponent(product.id)}`}>Get Bulk Quote</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
