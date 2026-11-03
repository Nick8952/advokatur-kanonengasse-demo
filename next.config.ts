import type { NextConfig } from "next";
import { basePath, deployZiel, siteUrl } from "./lib/deploy-ziel";

// Immer statischer Export (siehe CLAUDE.md, «Architektur»). GitHub Pages braucht den Repository-Unterpfad, Vercel oder die
// Kanzleidomain nicht: das regelt allein lib/deploy-ziel.ts über DEPLOY_TARGET.
const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_DEPLOY_TARGET: deployZiel,
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
  // Kein Bild-Optimierer im Export: die Varianten liegen fertig in public/bilder (scripts/bilder-optimieren.mjs).
  images: { unoptimized: true },
  // Eine Fehlerseite für beide Wurzel-Layouts (Deutsch und Sprachseiten): app/global-not-found.tsx rendert <html> selbst.
  experimental: { globalNotFound: true },
};

export default nextConfig;
