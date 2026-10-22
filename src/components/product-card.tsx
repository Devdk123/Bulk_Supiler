import Image from "next/image";
import Link from "next/link";
import { Boxes, PackageCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.imageUrl || "/images/product-placeholder.svg";

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-fresh/40 hover:shadow-lg">
      {/* Image Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/50">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* Category or Stock Status Badge */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.brandName ? (
            <span className="rounded-lg bg-card/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary shadow-xs backdrop-blur-xs">
              {product.brandName}
            </span>
          ) : null}
          {product.stockStatus === "in_stock" ? (
            <span className="rounded-lg bg-fresh px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
              In Stock
            </span>
          ) : null}
        </div>
      </div>

      {/* Content Area */}
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          {product.categoryName ? (
            <p className="text-xs font-semibold text-fresh">
              {product.categoryName}
            </p>
          ) : null}

          <h3 className="mt-1.5 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            <Link
              href={`/products/${encodeURIComponent(product.slug)}`}
              className="inline-flex items-center gap-1 hover:underline"
            >
              <span>{product.name}</span>
            </Link>
          </h3>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-sm font-extrabold text-primary dark:text-accent">
              {product.price || "Wholesale Quote on Request"}
            </span>
          </div>

          {/* Product Specifications */}
          <dl className="mt-4 grid gap-2 border-t border-border pt-3 text-xs">
            {product.moq ? (
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Truck className="h-3.5 w-3.5 text-fresh" /> MOQ
                </dt>
                <dd className="font-semibold text-foreground">{product.moq}</dd>
              </div>
            ) : null}

            {product.packing ? (
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Boxes className="h-3.5 w-3.5 text-fresh" /> Packing
                </dt>
                <dd className="font-semibold text-foreground text-right">{product.packing}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-2">
          <Button asChild variant="gold" className="w-full justify-center rounded-xl shadow-xs">
            <Link href={`/order?product=${encodeURIComponent(product.id)}`}>
              <PackageCheck className="h-4 w-4" />
              <span>Request Wholesale Price</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
