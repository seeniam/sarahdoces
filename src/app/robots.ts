import type { MetadataRoute } from "next";

/**
 * Demonstração privada para a cliente — não deve ser indexada por buscadores.
 * Vale junto com `metadata.robots` (noindex/nofollow) no layout raiz.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
