// Lighthouse für die wichtigsten Seiten, Desktop und Mobil. Gibt je Lauf eine Zeile aus und legt die Berichte in pruefung/lighthouse/.
// Aufruf: node werkzeuge/qa/lighthouse.mjs                                   (lokaler Vorschau-Server, npm run vorschau:pages)
//         BASE=https://nick8952.github.io/advokatur-kanonengasse-demo node werkzeuge/qa/lighthouse.mjs
// Hinweis: Der lokale Vorschau-Server komprimiert nicht. SEO ist in der Demo absichtlich niedrig: Lighthouse wertet «noindex» als nicht auffindbar.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
process.chdir(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".."));
const BASE = process.env.BASE ?? "http://localhost:4321/advokatur-kanonengasse-demo";
const seiten = (process.env.SEITEN ?? "/,/rechtsgebiete/,/team/urs-ebnoether/,/kontakt/,/ar/").split(",");
const chrome = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome"].filter(Boolean).find((p) => existsSync(p));
const ziel = path.join("pruefung", "lighthouse");
mkdirSync(ziel, { recursive: true });
const kennung = new URL(BASE).hostname.replace(/\W/g, "-");
for (const seite of seiten) {
  for (const modus of ["desktop", "mobil"]) {
    const datei = path.join(ziel, `${kennung}${seite.replaceAll("/", "_")}-${modus}.json`);
    const argumente = ["--yes", "lighthouse@latest", BASE + seite, "--quiet", "--chrome-flags=--headless=new", "--output=json", `--output-path=${datei}`, "--only-categories=performance,accessibility,best-practices,seo", ...(modus === "desktop" ? ["--preset=desktop"] : [])];
    const lauf = spawnSync("npx", argumente, { encoding: "utf8", env: { ...process.env, ...(chrome ? { CHROME_PATH: chrome } : {}) } });
    if (lauf.status !== 0 || !existsSync(datei)) { console.log(`${modus.padEnd(8)} ${seite.padEnd(44)} FEHLGESCHLAGEN ${(lauf.stderr ?? "").trim().split("\n").pop() ?? ""}`); continue; }
    const r = JSON.parse(readFileSync(datei, "utf8"));
    const p = (k) => Math.round(r.categories[k].score * 100);
    const a = r.audits;
    const fehl = Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode === "binary").map((x) => x.id).slice(0, 6).join(",");
    console.log(`${modus.padEnd(8)} ${seite.padEnd(44)} Leistung ${p("performance")} · Barrierefreiheit ${p("accessibility")} · Best Practices ${p("best-practices")} · SEO ${p("seo")} · LCP ${a["largest-contentful-paint"].displayValue} · CLS ${a["cumulative-layout-shift"].displayValue} · TBT ${a["total-blocking-time"].displayValue}${fehl ? " · nicht bestanden: " + fehl : ""}`);
  }
}
