// Szenen-Screenshots MIT Bewegung (prefers-reduced-motion: no-preference): Kopf über der Bühne, gepinnte Schiene in drei Stellungen,
// offenes Menü, Index-Chips, arabische Seite. Aufruf: node werkzeuge/qa/szenen.mjs  → pruefung/shots/szene-*.png
import { mkdirSync } from "node:fs";
import { BASE, browserStarten, warten } from "./chrome.mjs";
mkdirSync("pruefung/shots", { recursive: true });
const browser = await browserStarten();
const szenen = [
  { name: "start-1440-oben", seite: "/", b: 1440 },
  { name: "start-1440-kanzlei", seite: "/", b: 1440, zu: "#kanzlei-titel", versatz: -120 },
  { name: "start-1440-schiene-anfang", seite: "/", b: 1440, zu: ".schiene", anteil: 0 },
  { name: "start-1440-schiene-mitte", seite: "/", b: 1440, zu: ".schiene", anteil: 0.5 },
  { name: "start-1440-schiene-ende", seite: "/", b: 1440, zu: ".schiene", anteil: 1 },
  { name: "start-1440-team", seite: "/", b: 1440, zu: "#team-titel", versatz: -120 },
  { name: "start-390-oben", seite: "/", b: 390 },
  { name: "start-390-menue", seite: "/", b: 390, klick: ".menue-knopf" },
  { name: "start-390-schiene", seite: "/", b: 390, zu: ".schiene", versatz: 700 },
  { name: "rechtsgebiete-390-index", seite: "/rechtsgebiete/", b: 390, zu: "#strafrecht", versatz: -140 },
  { name: "rechtsgebiete-1440-mitte", seite: "/rechtsgebiete/", b: 1440, zu: "#familienrecht", versatz: -140 },
  { name: "ar-1440-oben", seite: "/ar/", b: 1440 },
  { name: "ar-1440-schiene", seite: "/ar/", b: 1440, zu: ".schiene", versatz: 300 },
  { name: "ar-390-menue", seite: "/ar/", b: 390, klick: ".menue-knopf" },
  { name: "en-1440-schiene-mitte", seite: "/en/", b: 1440, zu: ".schiene", anteil: 0.5 },
  { name: "profil-1440-mitte", seite: "/team/urs-ebnoether/", b: 1440, zu: "#werdegang", versatz: -200 },
  { name: "kontakt-1440-formular", seite: "/kontakt/", b: 1440, zu: "#formular-titel", versatz: -120 },
];
for (const sz of szenen) {
  const page = await browser.newPage();
  await page.setViewport({ width: sz.b, height: 900, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await page.goto(BASE + sz.seite, { waitUntil: "networkidle0" });
  await warten(600);
  if (sz.zu) {
    await page.evaluate(({ zu, anteil, versatz }) => {
      const el = document.querySelector(zu); if (!el) return;
      const oben = el.getBoundingClientRect().top + scrollY;
      let y = oben + (versatz ?? 0);
      if (typeof anteil === "number") { const ueber = parseFloat(getComputedStyle(el).getPropertyValue("--ueberhang")) || 0; y = oben + anteil * ueber; }
      scrollTo({ top: y, behavior: "instant" });
    }, sz);
    await warten(1200);
  }
  if (sz.klick) { await page.click(sz.klick); await warten(500); }
  const info = await page.evaluate(() => ({ scrollY: Math.round(scrollY), gepinnt: !!document.querySelector(".schiene.gepinnt"), ueberhang: document.querySelector(".schiene")?.style.getPropertyValue("--ueberhang"), p: document.querySelector(".schiene-kleber") ? getComputedStyle(document.querySelector(".schiene-kleber")).getPropertyValue("--p") : null, karte1: Math.round(document.querySelector(".karte-gebiet")?.getBoundingClientRect().left ?? -1), breit: document.documentElement.scrollWidth > document.documentElement.clientWidth, bereit: document.documentElement.classList.contains("bewegung-bereit"), sichtbar: document.querySelectorAll("[data-reveal].sichtbar").length, alle: document.querySelectorAll("[data-reveal]").length }));
  await page.screenshot({ path: `pruefung/shots/szene-${sz.name}.png` });
  console.log(sz.name, JSON.stringify(info));
  await page.close();
}
await browser.close();
