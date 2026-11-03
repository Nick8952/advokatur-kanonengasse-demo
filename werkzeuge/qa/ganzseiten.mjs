// Ganzseiten-Screenshots zur Sichtprüfung. Aufruf: node werkzeuge/qa/ganzseiten.mjs  ·  SEITEN=/,/team/  BREITEN=390,1440
import { mkdirSync } from "node:fs";
import { BASE, alleSeiten, browserStarten, warten } from "./chrome.mjs";
const seiten = process.env.SEITEN ? process.env.SEITEN.split(",") : alleSeiten();
const breiten = (process.env.BREITEN ?? "390,1440").split(",").map(Number);
mkdirSync("pruefung/shots", { recursive: true });
const browser = await browserStarten();
for (const b of breiten) {
  for (const s of seiten) {
    const page = await browser.newPage();
    await page.setViewport({ width: b, height: 900, deviceScaleFactor: 1 });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.goto(BASE + s, { waitUntil: "networkidle0" });
    // Lazy geladene Bilder: einmal durch die Seite scrollen, sonst bleiben sie im Ganzseitenbild leer
    const hoehe = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < hoehe; y += 700) { await page.evaluate((v) => window.scrollTo(0, v), y); await warten(120); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await warten(400);
    const datei = `pruefung/shots/${(s.replaceAll("/", "_") || "_").replace(/^_|_$/g, "") || "start"}-${b}.jpg`;
    await page.screenshot({ path: datei, type: "jpeg", quality: 80, fullPage: true });
    console.log(datei);
    await page.close();
  }
}
await browser.close();
