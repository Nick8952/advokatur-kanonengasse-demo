// Alte Adressen der bisherigen Website (data/weiterleitungen.json) → neue Seiten.
//  - Die alte Website (Wix) hatte Adressen ohne Endung («/urs-ebnoether», «/advokatur-en»). GitHub Pages kennt keine serverseitigen
//    Weiterleitungen, liefert aber für «/name» die Datei «name.html» aus. Deshalb schreibt dieses Skript vor jedem Build für jede alte
//    Adresse eine kleine statische Seite nach public/ (zum Beispiel public/urs-ebnoether.html), die per <meta http-equiv="refresh">
//    sofort auf die neue Adresse führt und für Suchmaschinen noindex ist. Diese Dateien sind erzeugt und nicht versioniert.
//  - Für den Produktivbetrieb (Vercel oder Kanzleidomain) stehen dieselben Zuordnungen als echte 308-Weiterleitungen in vercel.json,
//    je alte Adresse ohne und mit Schluss-Schrägstrich. Dieses Skript prüft, dass beide Listen übereinstimmen, und bricht sonst ab.
//  - Adressen, die gleich bleiben («/team», «/kontakt», «/impressum», «/datenschutz»), brauchen keinen Eintrag: Der Schluss-Schrägstrich
//    wird von GitHub Pages (301) und Vercel (308) selbst ergänzt.
// Aufruf: npm run weiterleitungen   (läuft automatisch in npm run build)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const WURZEL = path.resolve(import.meta.dirname, "..");
const liste = JSON.parse(await readFile(path.join(WURZEL, "data/weiterleitungen.json"), "utf8"));
const vercel = process.env.DEPLOY_TARGET === "vercel";
const basePath = vercel ? "" : (process.env.BASE_PATH ?? "/advokatur-kanonengasse-demo").replace(/\/$/, "");
// Absolute Adresse für den Canonical der Weiterleitungsseiten, gleiche Regel wie lib/deploy-ziel.ts
const siteUrl = (process.env.SITE_URL?.trim().replace(/\/$/, "") || (vercel ? "https://advokatur-kanonengasse-demo.vercel.app" : `https://nick8952.github.io${basePath}`));
const fehler = [];

for (const w of liste) {
  if (!/^\/[a-z0-9-]+$/.test(w.alt)) fehler.push(`Alte Adresse ungültig (erwartet «/name» ohne Endung): ${w.alt}`);
  if (!/^\/([a-z0-9-]+\/)*(#[a-z0-9-]+)?$/.test(w.neu)) fehler.push(`Neue Adresse ungültig (erwartet «/seite/» oder «/seite/#marke»): ${w.neu}`);
}
const vj = JSON.parse(await readFile(path.join(WURZEL, "vercel.json"), "utf8"));
const redirects = Array.isArray(vj.redirects) ? vj.redirects : [];
// Vercel ergänzt den Schluss-Schrägstrich (trailingSlash aus next.config.ts) VOR den Weiterleitungen aus vercel.json: «/urs-ebnoether» wird
// erst zu «/urs-ebnoether/» und trifft dann die Regel. Deshalb braucht jede alte Adresse beide Quellen (ohne und mit Schrägstrich).
for (const w of liste) {
  for (const quelle of [w.alt, `${w.alt}/`]) {
    const r = redirects.find((x) => x.source === quelle);
    if (!r) fehler.push(`vercel.json: Weiterleitung für ${quelle} fehlt (erwartet: {"source": "${quelle}", "destination": "${w.neu}", "permanent": true})`);
    else if (r.destination !== w.neu || r.permanent !== true) fehler.push(`vercel.json: Weiterleitung für ${quelle} zeigt auf «${r.destination}» (permanent=${r.permanent}), erwartet «${w.neu}» (permanent=true)`);
  }
}
for (const r of redirects) if (!liste.some((w) => w.alt === r.source || `${w.alt}/` === r.source)) fehler.push(`vercel.json: Weiterleitung ${r.source} steht nicht in data/weiterleitungen.json`);
if (fehler.length) {
  console.error(`✗ Weiterleitungen:\n${fehler.map((f) => `  - ${f}`).join("\n")}`);
  process.exit(1);
}

await mkdir(path.join(WURZEL, "public"), { recursive: true });
for (const w of liste) {
  const ziel = `${basePath}${w.neu}`;
  const html = `<!doctype html>
<html lang="de-CH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta http-equiv="refresh" content="0; url=${ziel}">
<link rel="canonical" href="${siteUrl}${w.neu.split("#")[0]}">
<title>Seite umgezogen</title>
<style>body{font-family:system-ui,sans-serif;margin:3rem auto;max-width:40rem;padding:0 1rem;line-height:1.5}</style>
</head>
<body>
<p>Diese Seite hat eine neue Adresse: <a href="${ziel}">${ziel}</a></p>
</body>
</html>
`;
  await writeFile(path.join(WURZEL, "public", `${w.alt.slice(1)}.html`), html);
}
console.log(`✓ ${liste.length} Weiterleitungsseiten nach public/ geschrieben (Ziel unter «${basePath || "/"}»), vercel.json stimmt überein.`);
