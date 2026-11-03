// Erzeugt aus den Originalen in assets/originale/ die Web-Varianten in public/bilder/ und schreibt das Bildverzeichnis
// data/bilder.json (Masse, Varianten, Alternativtext, Bildnachweis). Ausserdem das Vorschaubild für geteilte Links und die
// App-Icons. Aufruf: npm run bilder   (idempotent: public/bilder wird neu aufgebaut)
//
// Zuordnung id → Originaldatei samt Nachweis: scripts/bilder-liste.json. Herkunft jeder Datei: assets/originale/HERKUNFT.md
// Es wird nie hochskaliert: Breiten über der Originalbreite werden auf die Originalbreite gekappt. Portraits gibt es zweimal:
// im Original-Seitenverhältnis (Profilseite) und als quadratischer Ausschnitt aus der Bildmitte über die volle Höhe (Teamübersicht);
// beides ohne Retusche. Dateinamen tragen einen Inhalts-Hash, damit Browser nach Bildwechseln nichts Altes zeigen.
import sharp from "sharp";
import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const WURZEL = path.resolve(import.meta.dirname, "..");
const QUELLE = path.join(WURZEL, "assets/originale");
const ZIEL = path.join(WURZEL, "public/bilder");
const BILDER = JSON.parse(await readFile(path.join(WURZEL, "scripts/bilder-liste.json"), "utf8"));
const PUTZ = "#e9e9e7";
const PLATTE = "#000000";

for (const [id, cfg] of Object.entries(BILDER)) {
  const meta = await sharp(path.join(QUELLE, cfg.datei)).metadata().catch(() => null);
  if (!meta?.width || !meta?.height) throw new Error(`Bild «${id}»: ${cfg.datei} fehlt oder ist nicht lesbar.`);
  if (typeof cfg.alt !== "string") throw new Error(`Bild «${id}»: Alternativtext fehlt (leer "" nur für rein dekorative Bilder).`);
  if (!cfg.nachweis?.urheber || !cfg.nachweis?.quelle || !cfg.nachweis?.lizenz) throw new Error(`Bild «${id}»: Bildnachweis (urheber, quelle, lizenz) ist unvollständig.`);
}
const TEMP = `${ZIEL}.neu`;
await rm(TEMP, { recursive: true, force: true });
await mkdir(TEMP, { recursive: true });

async function schreiben(id, pipe, format) {
  const fertig = format === "avif" ? pipe.avif({ quality: 50, effort: 6 }) : format === "jpg" ? pipe.jpeg({ quality: 84, mozjpeg: true }) : pipe.webp({ quality: 74 });
  const { data, info } = await fertig.toBuffer({ resolveWithObject: true });
  const endung = format === "avif" ? "avif" : format === "jpg" ? "jpg" : "webp";
  const hash = createHash("sha1").update(data).digest("hex").slice(0, 8);
  const dateiname = `${id}-${info.width}-${hash}.${endung}`;
  await writeFile(path.join(TEMP, dateiname), data);
  return { breite: info.width, hoehe: info.height, url: `/bilder/${dateiname}`, bytes: data.length };
}

const verzeichnis = {};
for (const [id, cfg] of Object.entries(BILDER)) {
  const pfad = path.join(QUELLE, cfg.datei);
  const meta = await sharp(pfad).metadata();
  const basis = sharp(pfad).rotate();
  const quadrat = cfg.quadrat === true;
  const maxBreite = quadrat ? Math.min(meta.width, meta.height) : meta.width;
  const ratio = quadrat ? 1 : meta.width / meta.height;
  const breiten = [...new Set(cfg.breiten.map((b) => Math.min(b, maxBreite)))].sort((a, b) => a - b);
  const avif = [];
  const webp = [];
  for (const b of breiten) {
    const h = Math.round(b / ratio);
    // Quadrat: volle Höhe, mittlerer Ausschnitt (alle Portraits sind mittig aufgenommen); sonst nur verkleinern.
    const puffer = await basis.clone().resize({ width: b, height: h, fit: "cover", position: "centre", withoutEnlargement: true }).png().toBuffer();
    avif.push(await schreiben(id, sharp(puffer), "avif"));
    webp.push(await schreiben(id, sharp(puffer), "webp"));
  }
  const groesste = webp[webp.length - 1];
  verzeichnis[id] = {
    id, art: cfg.art, original: `assets/originale/${cfg.datei}`, breite: groesste.breite, hoehe: groesste.hoehe, alt: cfg.alt, legende: cfg.legende ?? null,
    nachweis: { ...cfg.nachweis, bearbeitung: cfg.bearbeitung ?? undefined }, abgerufen: cfg.abgerufen,
    quellen: { avif: avif.map(({ breite, url }) => ({ breite, url })), webp: webp.map(({ breite, url }) => ({ breite, url })) },
    bytes: { avif: avif.map((v) => v.bytes), webp: webp.map((v) => v.bytes) },
  };
}

// Vorschaubild für geteilte Links (Open Graph, 1200 × 630): das Strassenfoto, mittig auf 1200 × 630 beschnitten, darauf unten links die
// Wortmarke (unveränderte Logo-Platte, 420 px breit). Montage aus den zwei Originalen, kein zusätzlicher Text.
{
  const foto = await sharp(path.join(QUELLE, BILDER.strassenfoto.datei)).rotate().resize({ width: 1200, height: 630, fit: "cover", position: "centre" }).toBuffer();
  const logo = await sharp(path.join(QUELLE, BILDER.logo.datei)).resize({ width: 420 }).toBuffer();
  const lm = await sharp(logo).metadata();
  const og = sharp(foto).composite([{ input: logo, left: 40, top: 630 - lm.height - 40 }]);
  const { breite, hoehe, url, bytes } = await schreiben("og", og, "jpg");
  verzeichnis.og = {
    id: "og", art: "vorschau", original: "Montage aus assets/originale/strassenfoto_DSC0109.jpg und kanone-logo.jpg", breite, hoehe,
    alt: "Wortmarke advokatur kanonengasse über dem Strassenfoto im Zürcher Kreis 4", legende: null,
    nachweis: { urheber: "Fotografin oder Fotograf auf der bisherigen Website nicht genannt; Wortmarke der Kanzlei", titel: "Vorschaubild für geteilte Links", quelle: "Montage von scripts/bilder-optimieren.mjs aus zwei Bildern der bisherigen Website", lizenz: "Nutzung in der Demo vorbehaltlich Freigabe durch die Kanzlei", bearbeitung: "Ausschnitt 1200 × 630 aus der Bildmitte, Wortmarke unverändert eingesetzt" },
    abgerufen: BILDER.strassenfoto.abgerufen,
    quellen: { avif: [], webp: [{ breite, url }] }, bytes: { avif: [], webp: [bytes] },
  };
}

// App-Icons: schwarze Platte wie die Wortmarke mit einem weissen «a» (die Kanzlei hat kein eigenes Icon; Platzhalter der Demo).
{
  const svg = (groesse) => `<svg xmlns="http://www.w3.org/2000/svg" width="${groesse}" height="${groesse}" viewBox="0 0 64 64"><rect width="64" height="64" fill="${PLATTE}"/><text x="32" y="47" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="44" fill="${PUTZ}">a</text></svg>`;
  await writeFile(path.join(WURZEL, "app/apple-icon.png"), await sharp(Buffer.from(svg(180))).png().toBuffer());
  await writeFile(path.join(WURZEL, "app/icon.png"), await sharp(Buffer.from(svg(64))).png().toBuffer());
  await writeFile(path.join(WURZEL, "app/icon.svg"), svg(64));
}

const ALT = `${ZIEL}.alt`;
await rm(ALT, { recursive: true, force: true });
let hatteAlt = false;
try { await rename(ZIEL, ALT); hatteAlt = true; } catch { /* noch kein Bestand */ }
try {
  await rename(TEMP, ZIEL);
} catch (err) {
  if (hatteAlt) await rename(ALT, ZIEL);
  throw err;
}
await rm(ALT, { recursive: true, force: true });
await mkdir(path.join(WURZEL, "data"), { recursive: true });
await writeFile(path.join(WURZEL, "data/bilder.json"), JSON.stringify(verzeichnis, null, 2) + "\n");
const summe = Object.values(verzeichnis).reduce((s, b) => s + [...b.bytes.avif, ...b.bytes.webp].reduce((a, c) => a + c, 0), 0);
console.log(`${Object.keys(verzeichnis).length} Bilder → data/bilder.json, ${(await readdir(ZIEL)).length} Dateien in public/bilder (${Math.round(summe / 1024)} KB)`);
for (const b of Object.values(verzeichnis)) console.log(`  ${b.id.padEnd(30)} ${b.breite}×${b.hoehe}  avif ${b.bytes.avif.map((x) => Math.round(x / 1024) + "KB").join("/") || "-"}  webp ${b.bytes.webp.map((x) => Math.round(x / 1024) + "KB").join("/")}`);
