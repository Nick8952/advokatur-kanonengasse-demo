import type { MetadataRoute } from "next";
import { indexierungErlaubt, siteUrl } from "@/lib/deploy-ziel";

export const dynamic = "force-static";

/**
 * Demo: robots.txt sperrt bewusst nichts (sonst könnten Suchmaschinen das noindex der Seiten nicht lesen) und nennt keine Sitemap.
 * Mit INDEXIERUNG=1 (Kanzleidomain): Sitemap angeben; die Datei schreibt scripts/sitemap-schreiben.mts vor dem Build nach public/.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    ...(indexierungErlaubt ? { sitemap: `${siteUrl}/sitemap.xml` } : {}),
  };
}
