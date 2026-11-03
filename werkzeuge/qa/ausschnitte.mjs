import { BASE, browserStarten, warten } from "/Users/nick/Documents/03_Websiten_hustle/advokatur-kanonengasse-demo/werkzeuge/qa/chrome.mjs";
const browser = await browserStarten();
for (const [b, s, name] of [[360, "/", "start-360-oben"], [360, "/team/", "team-360-oben"], [390, "/ar/", "ar-390-oben"], [768, "/", "start-768-oben"]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: b, height: 800, deviceScaleFactor: 2 });
  await page.goto(BASE + s, { waitUntil: "networkidle0" }); await warten(300);
  await page.screenshot({ path: `pruefung/shots/${name}.png` });
  const reg = await page.evaluate(() => [...document.querySelectorAll(".register-link")].map((a) => { const r = a.getBoundingClientRect(); return `${a.textContent.trim()}:${Math.round(r.width)}x${Math.round(r.height)}`; }).join(" "));
  console.log(name, "Register:", reg, "scrollWidth", await page.evaluate(() => document.documentElement.scrollWidth));
  await page.close();
}
await browser.close();
