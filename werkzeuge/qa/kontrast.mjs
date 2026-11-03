// Kontraste der Farbtoken (WCAG 2.1, relative Leuchtdichte). Liest den @theme-Block aus app/globals.css.
// Aufruf: node werkzeuge/qa/kontrast.mjs    → Tabelle; Exit 1, wenn ein Textpaar unter 4.5:1 oder ein Flächenpaar unter 3:1 liegt.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
process.chdir(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".."));
const css = readFileSync("app/globals.css", "utf8");
const t = Object.fromEntries([...css.match(/@theme\s*{([\s\S]*?)\n}/)[1].matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]));
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const kontrast = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); };
// [Vordergrund, Hintergrund, Verwendung, Mindestwert]
const paare = [
  ["rahmen", "putz", "Lauftext auf Putz (Seitengrund)", 4.5], ["rahmen", "fenster", "Text in Fenstern und Feldern", 4.5], ["rahmen", "fenster-2", "Text auf ruhiger Fläche (Hinweise, Hover)", 4.5],
  ["rahmen-2", "putz", "Zweittext auf Putz", 4.5], ["rahmen-2", "fenster", "Zweittext in Fenstern", 4.5], ["grau", "putz", "Meta-Angaben, Hilfetexte", 4.5], ["grau", "fenster", "Hilfetexte in Feldern", 4.5],
  ["akzent-text", "akzent", "Text auf Orange (Knöpfe, Akzentfenster)", 4.5], ["akzent-text", "akzent-tief", "Text auf Orange im Hover", 4.5],
  ["putz", "rahmen", "Text auf Marineblau (gedrückter Filter, Sekundärknopf im Hover)", 4.5],
  ["fehler", "putz", "Fehlermeldungen", 4.5], ["fehler", "fenster", "Fehlermeldung in Feldern", 4.5],
  ["fuge-stark", "fenster", "Rahmen von Feldern (nicht Text)", 3], ["rahmen", "putz", "Fokusring (nicht Text)", 3], ["akzent", "putz", "Akzentfläche gegen Putz (nicht Text)", 1.5],
];
let fehler = 0;
for (const [vg, hg, zweck, min] of paare) {
  const k = kontrast(t[vg], t[hg]); const ok = k >= min; if (!ok) fehler++;
  console.log(`${ok ? "✓" : "✗"} ${k.toFixed(2).padStart(5)}:1  ${vg} (${t[vg]}) auf ${hg} (${t[hg]})  ${zweck} (min ${min}:1)`);
}
console.log(fehler ? `\n${fehler} Paare unter dem Mindestwert` : "\nAlle Paare erfüllen die Mindestwerte.");
process.exit(fehler ? 1 : 0);
