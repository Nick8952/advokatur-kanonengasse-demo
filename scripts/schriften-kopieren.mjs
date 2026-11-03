// Kopiert die benötigten Schriftdateien (SIL Open Font License) aus den fontsource-Paketen nach assets/schriften/.
// Die @font-face-Regeln stehen in app/globals.css mit unicode-range je Teilmenge (next/font kann keine unicode-range je Datei setzen); Next kopiert die Dateien beim Build nach _next/static/media und setzt den Unterpfad selbst.
// Aufruf: node scripts/schriften-kopieren.mjs   (die Dateien sind versioniert; nach einem Paket-Update erneut ausführen)
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
const WURZEL = path.resolve(import.meta.dirname, "..");
const ZIEL = path.join(WURZEL, "assets/schriften");
await mkdir(ZIEL, { recursive: true });
const dateien = [
  ["@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2", "plex-sans-latin-wght-normal.woff2"],
  ["@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-ext-wght-normal.woff2", "plex-sans-latin-ext-wght-normal.woff2"],
  ["@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-italic.woff2", "plex-sans-latin-wght-italic.woff2"],
  ["@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-400-normal.woff2", "plex-sans-arabic-400.woff2"],
  ["@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-500-normal.woff2", "plex-sans-arabic-500.woff2"],
  ["@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-600-normal.woff2", "plex-sans-arabic-600.woff2"],
];
for (const [von, nach] of dateien) await copyFile(path.join(WURZEL, "node_modules", von), path.join(ZIEL, nach));
console.log(`✓ ${dateien.length} Schriftdateien nach assets/schriften kopiert`);
