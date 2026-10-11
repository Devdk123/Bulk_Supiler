import Image from "next/image";
import Link from "next/link";
import { PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden border-[#ded6c2] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[5/3] overflow-hidden bg-secondary">
        <Image
          src={product.imageUrl || "/images/default-product.jpg"}
          alt={`${product.name} wholesale product`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          unoptimized={product.imageUrl.startsWith("https://")}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        {product.badge ? (
          <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
            {product.badge}
          </span>
        ) : null}
      </div>
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold leading-snug text-primary">{product.name}</h3>
            <p className="mt-1 text-sm font-semibold text-[#8a651e]">
              {product.price === "Contact for rate" ? "Contact us for today's rate" : product.price}
            </p>
          </div>
          <PackageCheck className="mt-1 h-5 w-5 shrink-0 text-accent" />
        </div>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex items-center justify-between gap-3 border-t pt-2.5">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4" /> MOQ
            </dt>
            <dd className="font-semibold">{product.moq}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t pt-2.5">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Quality
            </dt>
            <dd className="text-right font-semibold">{product.quality}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t pt-2.5">
            <dt className="text-muted-foreground">Packing</dt>
            <dd className="text-right font-semibold">{product.packing}</dd>
          </div>
        </dl>
        <Button asChild variant="gold" className="mt-auto w-full">
          <Link href={`/order?product=${encodeURIComponent(product.name)}`}>Get a bulk quote</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
