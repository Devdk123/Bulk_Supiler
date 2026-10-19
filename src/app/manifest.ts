import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Bulk Supplier — B2B Wholesale & FMCG Distribution",
    short_name: "Bulk Supplier",
    description:
      "Direct godown wholesale supplier for spices, edible oils, agarbatti, dhoop, matchsticks, and FMCG essentials across India.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFF9F0",
    theme_color: "#174735",
    icons: [
      {
        src: "/images/hero-wholesale-products.jpg",
        sizes: "192x192",
        type: "image/jpeg"
      },
      {
        src: "/images/hero-wholesale-products.jpg",
        sizes: "512x512",
        type: "image/jpeg"
      }
    ]
  };
}
