// Prüft den fertigen statischen Export (out/) so, wie er auf GitHub Pages liegt:
//  - jede erwartete Seite hat eine index.html (deutsche Seiten, Profile, fünf Sprachseiten), 404.html und .nojekyll sind da, keine leeren Seiten
//  - jede alte Adresse (data/weiterleitungen.json) hat eine Weiterleitungsseite, deren Ziel im Export existiert
//  - alle internen href/src beginnen mit dem Unterpfad und zeigen auf vorhandene Dateien (Gross-/Kleinschreibung wie auf GitHub Pages)
//  - keine Ressourcen von fremden Hosts (Skripte, Stylesheets, Bilder, Schriften, iframes), auch keine preconnects
//  - Demo: jede Seite trägt <meta name="robots" content="noindex…">, es gibt KEINE Sitemap, robots.txt sperrt nicht, kein JSON-LD
//    Mit INDEXIERUNG=1: kein noindex, Sitemap vorhanden und in robots.txt genannt, JSON-LD parsebar
//  - <html lang> und dir je Seite richtig (de-CH / en / fr / it / es / ar mit dir="rtl"), Canonical absolut, genau eine h1, Titel, Beschreibung
//  - hreflang nur auf Startseite und Sprachseiten (sechs Sprachen + x-default), nirgends sonst
//  - Schreibweise im ausgelieferten deutschen Text: kein «ß», keine Gedankenstriche
//  - Budgets: JavaScript je Seite, Bildgewichte
// Aufruf: npm run export:pruefen   (nach npm run build)
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const WURZEL = path.resolve(import.meta.dirname, "..", "out");
const DATA = path.resolve(import.meta.dirname, "..", "data");
const vercel = process.env.DEPLOY_TARGET === "vercel";
const basePath = vercel ? "" : (process.env.BASE_PATH ?? "/advokatur-kanonengasse-demo").replace(/\/$/, "");
const indexierung = process.env.INDEXIERUNG === "1";
const siteUrl = (process.env.SITE_URL || (vercel ? "https://advokatur-kanonengasse-demo.vercel.app" : `https://nick8952.github.io${basePath}`)).replace(/\/$/, "");
// Budgets (unkomprimiert, in Bytes). Bewusst knapp über dem Ist-Stand: Wer sie reisst, soll es merken.
const BUDGET = { jsJeSeite: 700_000, avifMax: 150_000, webpMax: 260_000, jpgMax: 160_000, bilderGesamt: 2_600_000 };
const fehler = [];

async function dateien(ordner, endung) {
  const liste = [];
  for (const e of await readdir(ordner, { withFileTypes: true })) {
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) liste.push(...(await dateien(p, endung)));
    else if (e.name.endsWith(endung)) liste.push(p);
  }
  return liste;
}
async function existiertGenau(p) {
  try {
    await stat(p);
    return (await readdir(path.dirname(p))).includes(path.basename(p));
  } catch {
    return false;
  }
}
const groesse = async (p) => (await stat(p).catch(() => null))?.size ?? 0;

let seiten;
try {
  seiten = await dateien(WURZEL, ".html");
} catch {
  console.error("✗ out/ fehlt: zuerst `npm run build` ausführen.");
  process.exit(1);
}
if (!seiten.length) { console.error("✗ out/ enthält keine HTML-Dateien."); process.exit(1); }

const personen = JSON.parse(await readFile(path.join(DATA, "personen.json"), "utf8")).map((p) => p.slug);
const weiterleitungen = JSON.parse(await readFile(path.join(DATA, "weiterleitungen.json"), "utf8"));
const SPRACHEN = { en: "en", fr: "fr", it: "it", es: "es", ar: "ar" };
const erwartet = ["index.html", "404.html", ".nojekyll", "robots.txt", "rechtsgebiete/index.html", "team/index.html", "mitarbeit/index.html", "kontakt/index.html", "impressum/index.html", "datenschutz/index.html", ...personen.map((s) => `team/${s}/index.html`), ...Object.keys(SPRACHEN).map((c) => `${c}/index.html`)];
for (const s of erwartet) if (!(await existiertGenau(path.join(WURZEL, s)))) fehler.push(`Fehlt im Export: ${s}`);

// Alte Adressen: Weiterleitungsseite vorhanden, Ziel vorhanden, noindex
for (const w of weiterleitungen) {
  const datei = path.join(WURZEL, `${w.alt.slice(1)}.html`);
  const html = await readFile(datei, "utf8").catch(() => "");
  if (!html) { fehler.push(`Weiterleitungsseite fehlt: ${w.alt}`); continue; }
  const ziel = html.match(/http-equiv="refresh" content="0; url=([^"]+)"/)?.[1];
  if (ziel !== `${basePath}${w.neu}`) fehler.push(`${w.alt}: Weiterleitung zeigt auf «${ziel}», erwartet «${basePath}${w.neu}»`);
  if (!/<meta name="robots" content="noindex/.test(html)) fehler.push(`${w.alt}: Weiterleitungsseite ohne noindex`);
  const zielSeite = w.neu.split("#")[0];
  if (!(await existiertGenau(path.join(WURZEL, zielSeite.slice(1), "index.html")))) fehler.push(`${w.alt}: Ziel ${zielSeite} gibt es im Export nicht`);
}
const weiterleitungsDateien = new Set(weiterleitungen.map((w) => `${w.alt.slice(1)}.html`));

{
  const robots = await readFile(path.join(WURZEL, "robots.txt"), "utf8").catch(() => "");
  const hatSitemap = await existiertGenau(path.join(WURZEL, "sitemap.xml"));
  if (/Disallow:\s*\/\s*$/m.test(robots)) fehler.push("robots.txt sperrt alles: Suchmaschinen könnten dann das noindex der Seiten nicht lesen");
  if (!indexierung && (hatSitemap || /Sitemap:/.test(robots))) fehler.push("Demo: es darf keine Sitemap geben (alle Seiten sind noindex)");
  if (indexierung && (!hatSitemap || !/Sitemap:/.test(robots))) fehler.push("INDEXIERUNG=1: Sitemap fehlt oder steht nicht in robots.txt");
  if (indexierung && hatSitemap) {
    const sm = await readFile(path.join(WURZEL, "sitemap.xml"), "utf8");
    for (const m of sm.matchAll(/<loc>([^<]+)<\/loc>/g)) if (!m[1].startsWith(siteUrl + "/")) fehler.push(`Sitemap: Adresse ausserhalb der eigenen Domain: ${m[1]}`);
    for (const m of sm.matchAll(/<loc>([^<]+)<\/loc>/g)) { const rel = m[1].slice(siteUrl.length + 1); if (!(await existiertGenau(path.join(WURZEL, rel, "index.html")))) fehler.push(`Sitemap: Seite fehlt im Export: ${m[1]}`); }
  }
}

// Druckansicht im CSS
{
  const css = await dateien(path.join(WURZEL, "_next", "static"), ".css").catch(() => []);
  let druck = false;
  for (const c of css) if ((await readFile(c, "utf8")).includes("@media print")) druck = true;
  if (!druck) fehler.push("Keine Druckansicht (@media print) im ausgelieferten CSS");
  for (const c of css) {
    const inhalt = await readFile(c, "utf8");
    for (const m of inhalt.matchAll(/url\((?:["'])?((?:https?:)?\/\/[^"')]+)/g)) fehler.push(`CSS: externe Ressource ${m[1]}`);
    // Lokale Dateien im CSS (Schriften) müssen im Export liegen, unter dem Unterpfad
    for (const m of inhalt.matchAll(/url\((?:["'])?(\/[^"')?#]+)/g)) {
      if (basePath && !m[1].startsWith(basePath + "/")) { fehler.push(`CSS: Pfad ohne Unterpfad: ${m[1]}`); continue; }
      if (!(await existiertGenau(path.join(WURZEL, decodeURIComponent(m[1].slice(basePath.length)))))) fehler.push(`CSS: Datei fehlt: ${m[1]}`);
    }
  }
}

// CSP: jede Seite trägt dasselbe Meta-Tag vor allen Ressourcen, vercel.json denselben Wert plus frame-ancestors
const cspHeader = JSON.parse(await readFile(path.resolve(import.meta.dirname, "..", "vercel.json"), "utf8")).headers?.[0]?.headers?.find((h) => h.key === "Content-Security-Policy")?.value ?? "";
const cspErwartet = cspHeader.replace(/; frame-ancestors 'none'$/, "");
if (cspErwartet === cspHeader) fehler.push("vercel.json: CSP-Header ohne frame-ancestors 'none'");
let geprueft = 0;
let maxJs = 0;
for (const datei of seiten) {
  const rel = path.relative(WURZEL, datei);
  if (weiterleitungsDateien.has(rel)) continue;
  let html = await readFile(datei, "utf8");
  const hatNoindex = /<meta name="robots" content="noindex/.test(html);
  const istFehlerseite = /^(404\.html|404\/index\.html|_not-found\/index\.html)$/.test(rel);
  const istNextFehlerseite = rel === "_not-found/index.html";
  const sprache = rel.match(/^(en|fr|it|es|ar)\/index\.html$/)?.[1];
  const istStart = rel === "index.html";
  if (!indexierung && !hatNoindex) fehler.push(`${rel}: kein noindex`);
  if (indexierung && hatNoindex && !istFehlerseite) fehler.push(`${rel}: noindex trotz INDEXIERUNG=1`);
  const lang = html.match(/<html[^>]*\blang="([^"]+)"/)?.[1];
  const dir = html.match(/<html[^>]*\bdir="([^"]+)"/)?.[1];
  const erwarteterLang = sprache ? SPRACHEN[sprache] : "de-CH";
  if (!istNextFehlerseite) {
    if (lang !== erwarteterLang) fehler.push(`${rel}: <html lang> ist «${lang}», erwartet «${erwarteterLang}»`);
    if ((sprache === "ar" ? "rtl" : "ltr") !== dir) fehler.push(`${rel}: <html dir> ist «${dir}», erwartet «${sprache === "ar" ? "rtl" : "ltr"}»`);
  }
  const sichtbar = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  if (!istFehlerseite && sichtbar.length < 600) fehler.push(`${rel}: Seite wirkt leer (${sichtbar.length} Zeichen Text)`);
  if (!sprache && !istNextFehlerseite) {
    if (sichtbar.includes("ß")) fehler.push(`${rel}: «ß» im Text`);
    if (/[—–]/.test(sichtbar)) fehler.push(`${rel}: Gedankenstrich im Text`);
  }
  if (/<form\b[^>]*\saction=/.test(html)) fehler.push(`${rel}: Formular mit action-Attribut (nichts darf an einen Server gesendet werden)`);
  if (/http-equiv="refresh"/.test(html)) fehler.push(`${rel}: Meta-Refresh auf einer regulären Seite`);
  if (!istFehlerseite && !istNextFehlerseite) {
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    const erwartetC = `${siteUrl}/${rel.replace(/index\.html$/, "")}`;
    if (!canonical) fehler.push(`${rel}: kein Canonical`);
    else if (canonical !== erwartetC) fehler.push(`${rel}: Canonical «${canonical}» ≠ erwartet «${erwartetC}»`);
    const og = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
    if (og !== erwartetC) fehler.push(`${rel}: og:url «${og}» ≠ «${erwartetC}»`);
    const ogBild = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    if (!ogBild?.startsWith(siteUrl + "/")) fehler.push(`${rel}: og:image fehlt oder liegt nicht unter ${siteUrl}`);
    else if (!(await existiertGenau(path.join(WURZEL, decodeURIComponent(ogBild.slice(siteUrl.length)))))) fehler.push(`${rel}: og:image zeigt auf eine fehlende Datei`);
    const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
    if (h1 !== 1) fehler.push(`${rel}: ${h1} h1-Elemente`);
    const titel = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    if (!titel.trim() || titel.length > 90) fehler.push(`${rel}: Titel leer oder zu lang (${titel.length} Zeichen: «${titel}»)`);
    const beschreibung = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
    if (beschreibung.length < 50 || beschreibung.length > 170) fehler.push(`${rel}: Beschreibung hat ${beschreibung.length} Zeichen (sinnvoll: 50 bis 170)`);
    const hreflangs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/gi)];
    if (istStart || sprache) {
      const codes = hreflangs.map((m) => m[1]).sort().join(",");
      if (codes !== "ar,de-CH,en,es,fr,it,x-default") fehler.push(`${rel}: hreflang unvollständig (${codes || "keine"})`);
      const ZIEL = { "de-CH": "/", "x-default": "/", en: "/en/", fr: "/fr/", it: "/it/", es: "/es/", ar: "/ar/" };
      for (const m of hreflangs) if (m[2] !== `${siteUrl}${ZIEL[m[1]] ?? "?"}`) fehler.push(`${rel}: hreflang ${m[1]} zeigt auf «${m[2]}», erwartet «${siteUrl}${ZIEL[m[1]]}»`);
    } else if (hreflangs.length) fehler.push(`${rel}: hreflang auf einer Seite ohne Sprachfassung`);
    {
    const cspMeta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
    if (!cspMeta) fehler.push(`${rel}: CSP-Meta fehlt`);
    else {
      if (cspMeta[1].replace(/&#x27;/g, "'") !== cspErwartet) fehler.push(`${rel}: CSP-Meta weicht von vercel.json ab`);
      const ersteRessource = html.search(/<(link|script|style)\b/);
      if (ersteRessource >= 0 && cspMeta.index > ersteRessource) fehler.push(`${rel}: CSP-Meta steht erst nach der ersten Ressource (wirkt dann nicht auf sie)`);
    }
  }
  const robotsTags = (html.match(/<meta name="robots"/g) ?? []).length;
    if (robotsTags > 1) fehler.push(`${rel}: ${robotsTags} robots-Metas (nur eines erlaubt)`);
  }
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!indexierung && jsonLd.length) fehler.push(`${rel}: JSON-LD in der Demo (erst mit INDEXIERUNG=1)`);
  if (indexierung && !istFehlerseite && !sprache && !istNextFehlerseite && !jsonLd.length) fehler.push(`${rel}: JSON-LD fehlt trotz INDEXIERUNG=1`);
  for (const m of jsonLd) { try { JSON.parse(m[1]); } catch { fehler.push(`${rel}: JSON-LD nicht parsebar`); } }
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!ids.has(m[1])) fehler.push(`${rel}: Sprungziel #${m[1]} fehlt`);
  if (/<link rel="preconnect" href="(?!\/)/.test(html) || /<link rel="dns-prefetch"/.test(html)) fehler.push(`${rel}: externer preconnect/dns-prefetch`);
  html = html.replace(/<link rel="preconnect" href="\/"[^>]*>/g, "");
  for (const tag of html.matchAll(/<(script|link|img|source|video|audio|iframe|embed|object)\b[^>]*>/g)) {
    if (tag[1] === "link" && /rel="(canonical|alternate|next|prev)"/.test(tag[0])) continue;
    for (const attr of tag[0].matchAll(/(?:src|href|srcset|srcSet|imagesrcset|data)="([^"]+)"/g)) {
      for (const u of attr[1].split(",").map((s) => s.trim().split(" ")[0])) {
        if (/^(https?:)?\/\//.test(u)) fehler.push(`${rel}: externe Ressource in <${tag[1]}>: ${u}`);
      }
    }
  }
  if (/<iframe/.test(html)) fehler.push(`${rel}: iframe im Export (keine Einbettungen)`);
  let js = 0;
  for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) js += await groesse(path.join(WURZEL, decodeURIComponent(m[1].split("?")[0].slice(basePath.length))));
  maxJs = Math.max(maxJs, js);
  if (js > BUDGET.jsJeSeite) fehler.push(`${rel}: ${Math.round(js / 1024)} KB JavaScript (Budget ${Math.round(BUDGET.jsJeSeite / 1024)} KB)`);
  for (const m of html.matchAll(/(href|src|srcset|srcSet|imagesrcset)="([^"]+)"/g)) {
    const werte = /srcset/i.test(m[1]) ? m[2].split(",").map((s) => s.trim().split(" ")[0]) : [m[2]];
    for (const rohUrl of werte) {
      if (!rohUrl || rohUrl.startsWith("#") || /^(mailto:|tel:|data:)/.test(rohUrl)) continue;
      if (/^(https?:)?\/\//.test(rohUrl)) continue;
      const url = rohUrl.split("?")[0].split("#")[0];
      if (basePath && !url.startsWith(basePath + "/") && url !== basePath) { fehler.push(`${rel}: Pfad ohne Unterpfad: ${rohUrl}`); continue; }
      let ziel = path.join(WURZEL, decodeURIComponent(url.slice(basePath.length)));
      if (url.endsWith("/")) ziel = path.join(ziel, "index.html");
      if (!(await existiertGenau(ziel)) && !(await existiertGenau(ziel + ".html")) && !(await existiertGenau(ziel + ".txt"))) fehler.push(`${rel}: Ziel fehlt: ${rohUrl}`);
      geprueft++;
    }
  }
}
let bildSumme = 0;
for (const b of (await Promise.all([".avif", ".webp", ".jpg", ".jpeg", ".png"].map((e) => dateien(path.join(WURZEL, "bilder"), e)))).flat()) {
  const g = await groesse(b);
  bildSumme += g;
  if (/\.(jpe?g|png)$/.test(b) && g > BUDGET.jpgMax) fehler.push(`Bild über Budget: ${path.basename(b)} ${Math.round(g / 1024)} KB (JPEG/PNG-Budget ${Math.round(BUDGET.jpgMax / 1024)} KB)`);
  if (b.endsWith(".avif") && g > BUDGET.avifMax) fehler.push(`Bild über Budget: ${path.basename(b)} ${Math.round(g / 1024)} KB (AVIF-Budget ${Math.round(BUDGET.avifMax / 1024)} KB)`);
  if (b.endsWith(".webp") && g > BUDGET.webpMax) fehler.push(`Bild über Budget: ${path.basename(b)} ${Math.round(g / 1024)} KB (WebP-Budget ${Math.round(BUDGET.webpMax / 1024)} KB)`);
}
if (bildSumme > BUDGET.bilderGesamt) fehler.push(`Alle Bildvarianten zusammen ${Math.round(bildSumme / 1024)} KB (Budget ${Math.round(BUDGET.bilderGesamt / 1024)} KB)`);
if (fehler.length) {
  console.error(`✗ ${fehler.length} Problem(e) im Export:\n` + [...new Set(fehler)].map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log(`✓ Export in Ordnung: ${seiten.length} HTML-Dateien (davon ${weiterleitungen.length} Weiterleitungen), ${geprueft} interne Verweise${basePath ? ` unter ${basePath}` : ""}, noindex ${indexierung ? "aus (Indexierung erlaubt)" : "auf allen Seiten, keine Sitemap, kein JSON-LD"}.`);
console.log(`  Budgets: JavaScript je Seite höchstens ${Math.round(maxJs / 1024)}/${Math.round(BUDGET.jsJeSeite / 1024)} KB (unkomprimiert) · alle Bildvarianten zusammen ${Math.round(bildSumme / 1024)} KB`);
