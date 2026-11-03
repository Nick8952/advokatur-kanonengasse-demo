// Schreibt public/sitemap.xml VOR dem Build, aber nur mit INDEXIERUNG=1 (Produktivbetrieb auf der Kanzleidomain). In der Demo
// (noindex) wird eine vorhandene Datei entfernt. Vor dem Build statt danach, weil Vercel die Build-Ausgabe von Next ausliefert und
// Änderungen an out/ dort nicht ankommen. Die Startseite und die fünf Sprachseiten tragen gegenseitige hreflang-Verweise.
// Aufruf: npm run sitemap   (läuft in npm run build)
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { inhaltsquelle, pfade } from "../lib/content";
import { indexierungErlaubt, siteUrl } from "../lib/deploy-ziel";

const ziel = path.resolve(import.meta.dirname, "..", "public", "sitemap.xml");
if (!indexierungErlaubt) {
  await rm(ziel, { force: true });
  console.log("· Demo (noindex): keine Sitemap.");
  process.exit(0);
}
const q = await inhaltsquelle();
const [personen, texte] = await Promise.all([q.getPersonen(), q.getTexte()]);
const alternates = texte.sprachen.map((s) => `    <xhtml:link rel="alternate" hreflang="${s.lang}" href="${siteUrl}${pfade.sprache(s.code)}"/>`).join("\n") + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/"/>`;
// Ohne lastmod: Das Build-Datum wäre kein Änderungsdatum der Inhalte.
const eintrag = (pfad: string, prio: string, mitAlternates = false) => `  <url>\n    <loc>${siteUrl}${pfad}</loc>\n    <priority>${prio}</priority>\n${mitAlternates ? alternates + "\n" : ""}  </url>`;
const eintraege = [
  eintrag(pfade.start, "1.0", true),
  ...texte.sprachen.filter((s) => s.code !== "de").map((s) => eintrag(pfade.sprache(s.code), "0.8", true)),
  eintrag(pfade.rechtsgebiete, "0.8"), eintrag(pfade.team, "0.8"), eintrag(pfade.kontakt, "0.8"), eintrag(pfade.mitarbeit, "0.6"),
  ...personen.map((p) => eintrag(pfade.person(p.slug), "0.7")),
  eintrag(pfade.impressum, "0.2"), eintrag(pfade.datenschutz, "0.2"),
];
await writeFile(ziel, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${eintraege.join("\n")}\n</urlset>\n`);
console.log(`✓ public/sitemap.xml mit ${eintraege.length} Adressen unter ${siteUrl} geschrieben.`);
