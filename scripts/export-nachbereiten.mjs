// Nach dem statischen Export:
//  - GitHub Pages und Vercel liefern bei unbekannten Adressen out/404.html aus; Next schreibt sie aus app/global-not-found.tsx. Hier wird
//    nur geprüft, dass sie da ist und die Gestaltung trägt (lang, Titel der Website).
//  - .nojekyll setzen (Ordner mit Unterstrich wie _next werden sonst nicht ausgeliefert).
//  - In der Demo (ohne INDEXIERUNG=1) darf keine Sitemap im Export liegen (scripts/sitemap-schreiben.mts entfernt sie schon vor dem Build).
import { access, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
const out = path.resolve(import.meta.dirname, "..", "out");
const fehlerseite = path.join(out, "404.html");
try { await access(fehlerseite); } catch { console.error("✗ out/404.html fehlt: Export unvollständig."); process.exit(1); }
{
  const html = await readFile(fehlerseite, "utf8");
  if (!/<html[^>]*lang="de-CH"/.test(html) || !/Seite nicht gefunden/.test(html)) { console.error("✗ out/404.html ist nicht die gestaltete Fehlerseite (app/global-not-found.tsx)."); process.exit(1); }
}
await writeFile(path.join(out, ".nojekyll"), "");
const indexierung = process.env.INDEXIERUNG === "1";
if (!indexierung) await rm(path.join(out, "sitemap.xml"), { force: true });
console.log(`✓ out/404.html geprüft und out/.nojekyll geschrieben${indexierung ? ", Sitemap bleibt (INDEXIERUNG=1)" : ", keine Sitemap (Demo ist noindex)"}.`);
