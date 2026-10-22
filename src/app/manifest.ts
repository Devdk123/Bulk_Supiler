import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gayatri Store",
    short_name: "Gayatri Store",
    description:
      "Direct godown wholesale supplier for spices, edible oils, agarbatti, dhoop, matchsticks, and FMCG essentials for Maya Bazar and surrounding regional markets.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFF9F0",
    theme_color: "#174735",
    icons: [
      {
        src: "/icons/gayatri-store-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/gayatri-store-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/gayatri-store-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}

