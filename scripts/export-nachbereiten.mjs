// Nach dem statischen Export:
//  - GitHub Pages und Vercel liefern bei unbekannten Adressen out/404.html aus; Next schreibt sie aus app/global-not-found.tsx. Hier wird
//    nur geprüft, dass sie da ist und die Gestaltung trägt (lang, Titel der Website).
//  - Die CSP als Meta-Tag an den Anfang von <head> verschieben: Next schreibt eigene <meta>-Tags hinter seine Stylesheet- und Skript-Tags;
//    ein Meta-CSP wirkt aber nur auf Ressourcen, die nach ihm verarbeitet werden. Auf Vercel gilt zusätzlich der Header (vercel.json), der
//    von dieser Reihenfolge unabhängig ist. scripts/export-pruefen.mjs prüft die Position.
//  - .nojekyll setzen (Ordner mit Unterstrich wie _next werden sonst nicht ausgeliefert).
//  - In der Demo (ohne INDEXIERUNG=1) darf keine Sitemap im Export liegen (scripts/sitemap-schreiben.mts entfernt sie schon vor dem Build).
import { access, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
const out = path.resolve(import.meta.dirname, "..", "out");
const fehlerseite = path.join(out, "404.html");
try { await access(fehlerseite); } catch { console.error("✗ out/404.html fehlt: Export unvollständig."); process.exit(1); }
{
  const html = await readFile(fehlerseite, "utf8");
  if (!/<html[^>]*lang="de-CH"/.test(html) || !/Seite nicht gefunden/.test(html)) { console.error("✗ out/404.html ist nicht die gestaltete Fehlerseite (app/global-not-found.tsx)."); process.exit(1); }
}
async function htmlDateien(ordner) {
  const liste = [];
  for (const e of await readdir(ordner, { withFileTypes: true })) {
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) liste.push(...(await htmlDateien(p)));
    else if (e.name.endsWith(".html")) liste.push(p);
  }
  return liste;
}
let verschoben = 0;
for (const datei of await htmlDateien(out)) {
  const html = await readFile(datei, "utf8");
  const m = html.match(/<meta http-equiv="Content-Security-Policy" content="[^"]*"\/?>/);
  if (!m) continue;
  const ohne = html.replace(m[0], "");
  const anker = ohne.match(/<meta charSet="utf-8"\/?>|<meta charset="utf-8"\/?>/i);
  const neu = anker ? ohne.replace(anker[0], anker[0] + m[0]) : ohne.replace(/<head>/, "<head>" + m[0]);
  if (neu !== html) { await writeFile(datei, neu); verschoben++; }
}
await writeFile(path.join(out, ".nojekyll"), "");
const indexierung = process.env.INDEXIERUNG === "1";
if (!indexierung) await rm(path.join(out, "sitemap.xml"), { force: true });
console.log(`✓ CSP-Meta in ${verschoben} Seiten an den Anfang von <head> verschoben, out/404.html geprüft und out/.nojekyll geschrieben${indexierung ? ", Sitemap bleibt (INDEXIERUNG=1)" : ", keine Sitemap (Demo ist noindex)"}.`);
