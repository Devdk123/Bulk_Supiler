"use client";

import Image from "next/image";
import { useState } from "react";
import { useLanguage } from "@/context/language-context";
import type { ProductImage } from "@/lib/products";

export function ProductImageGallery({
  images,
  fallbackUrl,
  productName,
  brandName
}: {
  images: ProductImage[];
  fallbackUrl: string;
  productName: string;
  brandName: string | null;
}) {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex] || images[0];

  if (!selectedImage) return null;

  const imageUrl = (url: string | null | undefined) => url || fallbackUrl;

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <Image
          src={imageUrl(selectedImage.image_url)}
          alt={selectedImage.alt_text || productName}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          unoptimized={selectedImage.image_url?.startsWith("https://") || false}
          className="object-contain p-4"
        />
        {brandName ? (
          <div className="absolute left-4 top-4 rounded-xl bg-card/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary shadow-xs backdrop-blur-xs">
            {brandName}
          </div>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div role="group" aria-label={t("product.imageGallery")} className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, index) => {
            const selected = index === selectedIndex;
            return (
              <button
                key={image.id}
                type="button"
                aria-label={`${t("product.viewImage")} ${index + 1}: ${image.alt_text || productName}`}
                aria-pressed={selected}
                onClick={() => setSelectedIndex(index)}
                className={`relative aspect-square min-w-0 overflow-hidden rounded-xl border bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fresh focus-visible:ring-offset-2 ${selected ? "border-fresh ring-2 ring-fresh/30" : "border-border hover:border-fresh/60"}`}
              >
                <Image
                  src={imageUrl(image.image_url)}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 15vw, 22vw"
                  unoptimized={image.image_url?.startsWith("https://") || false}
                  className="object-contain p-1"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
