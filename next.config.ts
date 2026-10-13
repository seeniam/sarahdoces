import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Typed <Link href> and router.push/replace. Top-level key in Next 16.
  typedRoutes: true,
  // cacheComponents / partialPrefetching intentionally OFF: this is a 100%
  // client-mocked app (Zustand + localStorage + BroadcastChannel), so PPR /
  // `use cache` cache nothing and only add build-failure risk.
  // See docs/NEXT16-NOTES.md and docs/DECISOES.md.
  images: {
    // AVIF first, WebP fallback (direção de arte §5).
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
