// Viewport-Screenshots in Scrollschritten (realistisch für Scrollpositionen).
// Aufruf: node werkzeuge/qa/screenshots.mjs  ·  SEITEN=/,/kontakt/  BREITEN=360,768,1440  FRAMES=8  SCHEMA=dunkel
import { mkdirSync } from "node:fs";
import { BASE, alleSeiten, browserStarten, warten } from "./chrome.mjs";
const seiten = process.env.SEITEN ? process.env.SEITEN.split(",") : alleSeiten();
const breiten = (process.env.BREITEN ?? "360,390,768,1440").split(",").map(Number);
const maxFrames = Number(process.env.FRAMES ?? 8);
mkdirSync("pruefung/screenshots", { recursive: true });
const browser = await browserStarten();
const page = await browser.newPage();
const dunkel = process.env.SCHEMA === "dunkel";
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: dunkel ? "dark" : "light" }]);
for (const b of breiten) {
  const h = b < 700 ? 780 : 900;
  await page.setViewport({ width: b, height: h, deviceScaleFactor: 1 });
  for (const s of seiten) {
    await page.goto(BASE + s, { waitUntil: "networkidle0" });
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const frames = Math.min(maxFrames, Math.ceil(total / h));
    for (let i = 0; i < frames; i++) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), i * h);
      await warten(350);
      await page.screenshot({ path: `pruefung/screenshots/${s.replaceAll("/", "_") || "_"}-${b}${dunkel ? "-dunkel" : ""}-${i}.jpg`, type: "jpeg", quality: 78 });
    }
    console.log(`${b} ${s} ${frames} Bilder`);
  }
}
await browser.close();
