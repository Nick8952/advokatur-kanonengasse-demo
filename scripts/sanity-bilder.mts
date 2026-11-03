// Spiegelt Bilder aus Sanity vor dem Build nach public/bilder/cms/ und schreibt data/cms-bilder.json, damit die Website auch mit
// Sanity als Quelle keine Anfragen an das Sanity-CDN auslöst («keine Anfragen an Dritte» gilt auch später).
// Ohne CONTENT_SOURCE=sanity tut das Skript nichts (Demo mit lokalen Inhalten).
// Aufruf: npm run sanity:bilder   (läuft in npm run build)
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const WURZEL = path.resolve(import.meta.dirname, "..");
const ZIEL = path.join(WURZEL, "public/bilder/cms");
const VERZEICHNIS = path.join(WURZEL, "data/cms-bilder.json");

if ((process.env.CONTENT_SOURCE ?? "").trim() !== "sanity") {
  await rm(ZIEL, { recursive: true, force: true });
  await rm(VERZEICHNIS, { force: true });
  console.log("· Lokale Inhalte: keine Sanity-Bilder zu spiegeln.");
  process.exit(0);
}

const { createClient } = await import("@sanity/client");
const projectId = (process.env.SANITY_PROJECT_ID ?? "").trim();
const dataset = (process.env.SANITY_DATASET ?? "production").trim();
if (!projectId) throw new Error("CONTENT_SOURCE=sanity, aber SANITY_PROJECT_ID fehlt.");
const client = createClient({ projectId, dataset, apiVersion: "2025-02-19", useCdn: false, token: process.env.SANITY_API_READ_TOKEN || undefined, perspective: "published" });
type Asset = { _id: string; url: string; extension: string; metadata: { dimensions: { width: number; height: number } } };
const assets = await client.fetch<Asset[]>(`*[_type == "sanity.imageAsset"]{ _id, url, extension, metadata { dimensions { width, height } } }`);
await rm(ZIEL, { recursive: true, force: true });
await mkdir(ZIEL, { recursive: true });
const sharp = (await import("sharp")).default;
const verzeichnis: Record<string, { breite: number; hoehe: number; quellen: { avif: { breite: number; url: string }[]; webp: { breite: number; url: string }[] } }> = {};
const BREITEN = [320, 480, 720, 960, 1280, 1600];
for (const a of assets) {
  const antwort = await fetch(a.url);
  if (!antwort.ok) throw new Error(`Bild ${a._id} nicht ladbar (${antwort.status})`);
  const original = Buffer.from(await antwort.arrayBuffer());
  const kennung = createHash("sha1").update(a._id).digest("hex").slice(0, 10);
  const avif: { breite: number; url: string }[] = [];
  const webp: { breite: number; url: string }[] = [];
  for (const b of [...new Set(BREITEN.map((x) => Math.min(x, a.metadata.dimensions.width)))]) {
    for (const [format, liste] of [["avif", avif], ["webp", webp]] as const) {
      const pipe = sharp(original).rotate().resize({ width: b, withoutEnlargement: true });
      const data = await (format === "avif" ? pipe.avif({ quality: 50 }) : pipe.webp({ quality: 74 })).toBuffer();
      const datei = `${kennung}-${b}.${format}`;
      await writeFile(path.join(ZIEL, datei), data);
      liste.push({ breite: b, url: `/bilder/cms/${datei}` });
    }
  }
  verzeichnis[a._id] = { breite: a.metadata.dimensions.width, hoehe: a.metadata.dimensions.height, quellen: { avif, webp } };
}
await writeFile(VERZEICHNIS, JSON.stringify(verzeichnis, null, 2) + "\n");
console.log(`✓ ${assets.length} Sanity-Bilder nach public/bilder/cms gespiegelt.`);
