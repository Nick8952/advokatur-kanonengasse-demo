// Funktionsprüfungen im echten Browser (puppeteer-core). Vorschau-Server nötig: npm run vorschau:pages
// Geprüft wird, was ein Mensch bedienen würde: Erstbesuch ohne Dienste Dritter, Kontaktwege (tel:, mailto:, Karte extern), Tastatur,
// Hauptnavigation, Menü-Dialog und Sprachwahl, Sprachseiten mit RTL, Teamfilter, mailto-Formular in Deutsch und Arabisch (ohne je etwas
// zu versenden), Weiterleitungen alter Adressen, Fehlerseite, Direktaufrufe, Bewegung (Kopf, Schiene mit Tastatur, Enthüllung, Scrollspy,
// Lesebalken) und reduzierte Bewegung.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { BASE, SPRACHEN, alleSeiten, browserStarten, externeAnfragen, personen, warten } from "./chrome.mjs";
const ergebnisse = [];
const ok = (name, bedingung, detail = "") => { ergebnisse.push({ name, ok: !!bedingung, detail }); console.log(`${bedingung ? "✓" : "✗"} ${name}${detail ? " · " + detail : ""}`); };
let browser = await browserStarten();
const kanzlei = JSON.parse(readFileSync("data/kanzlei.json", "utf8"));
const weiterleitungen = JSON.parse(readFileSync("data/weiterleitungen.json", "utf8"));
const TEL = "tel:" + kanzlei.telefon.replace(/\s/g, "");
const EMAIL = kanzlei.email;
const offeneKontexte = [];
async function gruppe(fn) {
  for (let versuch = 1; ; versuch++) {
    const stand = ergebnisse.length;
    try { return await fn(); }
    catch (e) {
      ergebnisse.length = stand;
      for (const c of offeneKontexte.splice(0)) await c.close().catch(() => {});
      if (versuch >= 3 || !/detached|LifecycleWatcher|Target closed|Session closed|Connection closed/i.test(String(e))) throw e;
      console.log(`   (Navigation abgebrochen: ${String(e).split("\n")[0].slice(0, 70)}; Gruppe wird wiederholt, Versuch ${versuch + 1})`);
      if (!browser.connected) { await browser.close().catch(() => {}); browser = await browserStarten(); console.log("   (Browser neu gestartet)"); }
    }
  }
}
async function frisch({ breite = 1440, hoehe = 900, reduziert = false } = {}) {
  const ctx = await browser.createBrowserContext();
  offeneKontexte.push(ctx);
  const page = await ctx.newPage();
  await page.setViewport({ width: breite, height: hoehe });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: reduziert ? "reduce" : "no-preference" }]);
  return { ctx, page, extern: externeAnfragen(page) };
}

// 1) Erstbesuch: nichts von Dritten, kein Banner, kein Speicher, Demo-Kennzeichnung
await gruppe(async () => {
  const { ctx, page, extern } = await frisch();
  await page.goto(BASE + "/", { waitUntil: "networkidle0" }); await warten(400);
  ok("Erstbesuch: keine Anfragen an fremde Hosts", extern.length === 0, extern.join(","));
  ok("Erstbesuch: kein Einwilligungsbanner (keine einwilligungspflichtigen Dienste)", (await page.$('[role="region"][aria-label="Datenschutz-Einstellungen"]')) === null);
  ok("Erstbesuch: kein Speicher, keine Cookies", (await page.evaluate(() => Object.keys(localStorage).length + Object.keys(sessionStorage).length)) === 0 && (await page.evaluate(() => document.cookie)) === "");
  ok("Demo: Entwurfshinweis sichtbar", await page.evaluate(() => document.body.textContent.includes("nicht die offizielle Website")));
  ok("Demo: noindex auf der Startseite", await page.evaluate(() => document.querySelector("meta[name=robots]")?.content.includes("noindex")));
  ok("Demo: kein JSON-LD (erst mit INDEXIERUNG=1)", (await page.$('script[type="application/ld+json"]')) === null);
  ok("Keine Iframes, keine eingebetteten Karten oder Widgets", (await page.$$("iframe")).length === 0);
  ok("Schriften lokal: keine Google-Fonts-Links", (await page.$$('link[href*="fonts.g"]')).length === 0);
  const robots = await (await page.goto(BASE + "/robots.txt")).text();
  ok("Demo: robots.txt sperrt nicht, nennt keine Sitemap", !/Disallow:\s*\/\s*$/m.test(robots) && !/Sitemap:/.test(robots), robots.replaceAll("\n", " "));
  ok("Demo: keine sitemap.xml", (await page.goto(BASE + "/sitemap.xml")).status() === 404);
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  await page.evaluate(() => [...document.querySelectorAll("footer button")].find((b) => b.textContent.includes("Datenschutz-Einstellungen")).click()); await warten(250);
  ok("Footer: «Datenschutz-Einstellungen» öffnet einen Hinweis ohne Schalter", await page.evaluate(() => { const d = document.querySelector("dialog[open]"); return !!d && d.querySelectorAll('input[type="checkbox"]').length === 0 && d.textContent.includes("keine Cookies"); }));
  await page.keyboard.press("Escape"); await warten(200);
  ok("Footer: Escape schliesst den Hinweis", !(await page.$("dialog[open]")));
  await ctx.close();
});

// 2) Kontaktwege und Adressen
await gruppe(async () => {
  const { ctx, page } = await frisch();
  for (const seite of ["/", "/kontakt/"]) {
    await page.goto(BASE + seite, { waitUntil: "networkidle0" });
    const tel = await page.$$eval(`a[href="${TEL}"]`, (as) => as.length);
    const mail = await page.$$eval(`a[href="mailto:${EMAIL}"]`, (as) => as.length);
    ok(`Kontakt ${seite}: Telefon-Link (${tel}) und E-Mail-Link (${mail}) vorhanden`, tel >= 2 && mail >= 1);
    const text = await page.evaluate(() => document.body.innerText);
    ok(`Kontakt ${seite}: Besuchsadresse 8004 und Postfach 8021 getrennt sichtbar`, /Militärstrasse 76[\s\S]{0,40}8004 Zürich/.test(text) && /Postfach 1012[\s\S]{0,40}8021 Zürich/.test(text));
    ok(`Kontakt ${seite}: Telefonzeiten Montag bis Donnerstag, keine Freitagszeiten`, /Montag bis Donnerstag/.test(text) && !/Freitag/.test(text));
  }
  const karte = await page.$$eval('a[href^="https://www.openstreetmap.org"], a[href^="https://www.google.com/maps"]', (as) => as.map((a) => ({ t: a.target, r: a.rel })));
  ok("Kontakt: Karten nur als externe Links (neues Fenster, noopener), keine Einbettung", karte.length === 2 && karte.every((k) => k.t === "_blank" && /noopener/.test(k.r)) && (await page.$$("iframe")).length === 0);
  ok("Formular: kein Formular sendet an einen Server (keine action-Attribute)", await page.evaluate(() => [...document.querySelectorAll("form")].every((f) => !f.getAttribute("action") && (f.method === "dialog" || f.method === "get"))));
  ok("Kontakt: Hinweis zu Anfragen (24 Stunden) sichtbar, nicht als Antwortzusage formuliert", await page.evaluate(() => { const t = document.body.innerText; return /innerhalb von 24 Stunden keine Rückmeldung/.test(t) && !/antworten innerhalb/.test(t); }));
  await ctx.close();
});

// 3) Tastatur, Register, Sprachwahl
await gruppe(async () => {
  const { ctx, page } = await frisch();
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  await page.keyboard.press("Tab");
  ok("Tastatur: erster Tab = «Zum Inhalt springen»", await page.evaluate(() => document.activeElement?.textContent?.trim() === "Zum Inhalt springen"));
  ok("Tastatur: Sprunglink wird beim Fokus sichtbar", await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return r.width > 40 && r.height > 20 && r.top >= 0; }));
  await page.keyboard.press("Enter"); await warten(150);
  ok("Tastatur: Sprunglink setzt den Fokus auf <main>", await page.evaluate(() => location.hash === "#inhalt" && document.activeElement?.id === "inhalt"));
  const reihenfolge = [];
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  for (let i = 0; i < 8; i++) { await page.keyboard.press("Tab"); reihenfolge.push(await page.evaluate(() => (document.activeElement.getAttribute("aria-label") || document.activeElement.textContent || "").trim().replace(/\s+/g, " ").slice(0, 50))); }
  ok("Tastatur: Fokusreihenfolge Sprunglink, Wortmarke, Hauptnavigation (Kanzlei, Rechtsgebiete, Team, Mitarbeit, Kontakt), Sprachwahl", /^Zum Inhalt/.test(reihenfolge[0]) && /Startseite/.test(reihenfolge[1]) && reihenfolge.slice(2, 7).join(",") === "Kanzlei,Rechtsgebiete,Team,Mitarbeit,Kontakt" && /Sprache/.test(reihenfolge[7]), reihenfolge.join(" → "));
  const fokus = await page.evaluate(() => { const st = getComputedStyle(document.activeElement); return { stil: st.outlineStyle, breite: parseFloat(st.outlineWidth) }; });
  ok("Tastatur: Fokusring sichtbar (Outline ≥ 2px)", fokus.stil !== "none" && fokus.breite >= 2, JSON.stringify(fokus));
  await page.goto(BASE + "/team/urs-ebnoether/", { waitUntil: "networkidle0" });
  ok("Hauptnavigation: Profilseite markiert «Team» als aktuell (aria-current)", await page.evaluate(() => document.querySelector('nav.hauptnav a[aria-current="page"]')?.textContent?.trim() === "Team"));
  ok("Hauptnavigation: eine Zeile im Kopf, alle fünf Einträge sichtbar, Menü-Knopf verborgen", await page.evaluate(() => { const a = [...document.querySelectorAll("nav.hauptnav a")]; const top = a[0].getBoundingClientRect().top; return a.length === 5 && a.every((x) => x.getBoundingClientRect().height >= 44 && Math.abs(x.getBoundingClientRect().top - top) < 2) && getComputedStyle(document.querySelector(".menue-knopf")).display === "none"; }));
  ok("Kopf: klebt oben (position sticky) und bleibt beim Scrollen sichtbar", await page.evaluate(async () => { scrollTo({ top: 1200, behavior: "instant" }); await new Promise((r) => setTimeout(r, 300)); const r = document.querySelector("header.kopf").getBoundingClientRect(); const st = getComputedStyle(document.querySelector("header.kopf")); scrollTo({ top: 0, behavior: "instant" }); return st.position === "sticky" && r.top === 0 && r.height >= 60; }));
  // Sprachwahl: öffnen, Einträge, Escape, Klick ausserhalb
  await page.goto(BASE + "/kontakt/", { waitUntil: "networkidle0" });
  await page.click("details.sprachwahl summary"); await warten(150);
  const sprachen = await page.$$eval("details.sprachwahl[open] ul a", (as) => as.map((a) => `${a.getAttribute("hreflang")}:${a.textContent.trim().replace(/\s+/g, " ")}|${a.getAttribute("href")}|${a.getAttribute("aria-current")}`));
  ok("Sprachwahl: sechs Sprachen ausgeschrieben mit hreflang, Deutsch als aktuell, keine Flaggen", sprachen.length === 6 && sprachen[0].startsWith("de-CH:Deutsch") && sprachen[0].endsWith("|true") && sprachen.some((s) => s.startsWith("ar:العربية")), sprachen.join(" ; "));
  await page.keyboard.press("Escape"); await warten(150);
  ok("Sprachwahl: Escape schliesst und setzt den Fokus auf den Knopf", await page.evaluate(() => !document.querySelector("details.sprachwahl").open && document.activeElement?.tagName === "SUMMARY"));
  await page.click("details.sprachwahl summary"); await warten(100);
  await page.mouse.click(10, 700); await warten(150);
  ok("Sprachwahl: Klick ausserhalb schliesst", await page.evaluate(() => !document.querySelector("details.sprachwahl").open));
  await ctx.close();
});

// 4) Sprachseiten: lang, dir, Inhalte, RTL-Zahlen, Rückweg
await gruppe(async () => {
  const { ctx, page } = await frisch();
  for (const s of SPRACHEN) {
    await page.goto(BASE + `/${s}/`, { waitUntil: "networkidle0" });
    const z = await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, h1: document.querySelectorAll("main h1").length, anker: ["kanzlei", "rechtsgebiete", "team", "kontakt"].every((a) => !!document.getElementById(a)), nurDeutsch: document.body.innerText.length > 2000, formular: !!document.querySelector("form button[type=submit]"), impressum: !!document.querySelector('footer a[hreflang="de"]') }));
    ok(`Sprachseite /${s}/: lang=${z.lang}, dir=${z.dir}, vier Abschnitte, Formular, Links zu den deutschen Rechtsseiten`, z.lang === s && z.dir === (s === "ar" ? "rtl" : "ltr") && z.h1 === 1 && z.anker && z.formular && z.impressum);
    ok(`Sprachseite /${s}/: Abschnittsnavigation mit eigenem Namen (nicht «Sprache wählen»), Laufband mit Pausenknopf in der Sprache`, await page.evaluate(() => { const nav = document.querySelector("nav.hauptnav"); const sw = document.querySelector("details.sprachwahl summary")?.getAttribute("aria-label") ?? ""; const k = document.querySelector(".laufband-knopf"); return !!nav?.getAttribute("aria-label") && !sw.endsWith(nav.getAttribute("aria-label")) && !!k && k.textContent.trim().length > 3 && k.getBoundingClientRect().height >= 44; }));
  }
  await page.goto(BASE + "/ar/", { waitUntil: "networkidle0" });
  const rtl = await page.evaluate(() => {
    const tel = document.querySelector(`main a[href^="tel:"] bdi`);
    const mail = document.querySelector(`main a[href^="mailto:"] bdi`);
    const schrift = getComputedStyle(document.body).fontFamily;
    const h1 = document.querySelector("h1").getBoundingClientRect();
    return { telDir: tel?.getAttribute("dir"), mailDir: mail?.getAttribute("dir"), schrift, h1Rechts: h1.right > innerWidth / 2, ueberlauf: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1 };
  });
  ok("Arabisch: Telefon und E-Mail als LTR-Läufe, arabische Schrift, Titel rechtsbündig, kein Überlauf", rtl.telDir === "ltr" && rtl.mailDir === "ltr" && /Plex Sans Arabic/.test(rtl.schrift) && rtl.h1Rechts && rtl.ueberlauf, JSON.stringify(rtl));
  const sprachwahl = await page.$$eval("details.sprachwahl ul a", (as) => as.map((a) => a.getAttribute("aria-current")));
  ok("Arabisch: Sprachwahl markiert Arabisch als aktuell", sprachwahl.filter((x) => x === "true").length === 1 && sprachwahl[3] === "true");
  await page.goto(BASE + "/en/", { waitUntil: "networkidle0" });
  ok("Englisch: Einführung im Wortlaut der bisherigen Website und Hinweis auf deutsche Profile", await page.evaluate(() => /small law firm in the 4th district of Zurich/.test(document.body.innerText) && /available in German/.test(document.body.innerText)));
  ok("Englisch: Rechtsgebiete verlinken auf die deutsche Seite mit hreflang=de", (await page.$$('#rechtsgebiete a[hreflang="de"][href*="/rechtsgebiete/#"]')).length >= 9);
  await ctx.close();
});

// 5) Teamfilter
await gruppe(async () => {
  const { ctx, page } = await frisch();
  await page.goto(BASE + "/team/", { waitUntil: "networkidle0" });
  const alle = await page.$$eval("ul.portraits li", (l) => l.length);
  ok(`Team: ${alle} Personen in drei Gruppen, alle mit Bild, Name und Rolle`, alle === 11 && (await page.evaluate(() => [...document.querySelectorAll("ul.portraits li")].every((li) => li.querySelector("img") && li.querySelector("a").textContent.trim() && li.querySelector(".kachel-rolle").textContent.trim()))) && (await page.$$eval("h2", (h) => h.length)) >= 3);
  ok("Team: Tarig Hassan ohne «Rechtsanwalt», Christian Müller als Associate (Rollen der Quelle)", await page.evaluate(() => { const t = (n) => [...document.querySelectorAll("ul.portraits li")].find((li) => li.textContent.includes(n))?.querySelector(".kachel-rolle").textContent; return t("Tarig Hassan") === "lic. iur., LL. M., Partner" && /Associate/.test(t("Christian Müller")); }));
  const klick = async (txt) => page.evaluate((t) => [...document.querySelectorAll("button.filter-option")].find((b) => b.textContent.trim() === t).click(), txt);
  await klick("Mietrecht"); await warten(150);
  const miet = await page.$$eval("ul.portraits li a.kachel-link", (as) => as.map((a) => a.textContent.trim()));
  ok("Filter Mietrecht → Urs Ebnöther, Christian Müller, Manuela Schiller", miet.join(",") === "Urs Ebnöther,Christian Müller,Manuela Schiller", miet.join(","));
  ok("Filter: gedrückter Zustand per aria-pressed, Trefferzahl in Live-Region", await page.evaluate(() => document.querySelector('button.filter-option[aria-pressed="true"]')?.textContent.trim() === "Mietrecht" && /3 Personen/.test(document.querySelector('[role="status"]').textContent)));
  await klick("Italienisch"); await warten(150);
  const kombi = await page.$$eval("ul.portraits li a.kachel-link", (as) => as.map((a) => a.textContent.trim()));
  ok("Filter Mietrecht + Italienisch → Manuela Schiller", kombi.join(",") === "Manuela Schiller", kombi.join(","));
  await klick("Kroatisch"); await warten(150);
  ok("Filter ohne Treffer zeigt einen Hinweis statt leerer Fläche", await page.evaluate(() => /niemand eingetragen/.test(document.body.innerText)));
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Filter zurücksetzen").click()); await warten(150);
  ok("Filter zurücksetzen zeigt wieder alle 11", (await page.$$eval("ul.portraits li", (l) => l.length)) === 11);
  ok("Filter: Eingaben landen nicht in der Adresse oder im Speicher", !page.url().includes("?") && (await page.evaluate(() => Object.keys(localStorage).length === 0)));
  await ctx.close();
});

// 6) Handy (360 px): Register, Touch-Ziele, kein horizontales Scrollen, Einstieg im ersten Bildschirm
await gruppe(async () => {
  const { ctx, page } = await frisch({ breite: 360, hoehe: 740 });
  await page.goto(BASE + "/rechtsgebiete/", { waitUntil: "networkidle0" });
  ok("Mobil: Hauptnavigation im Kopf verborgen, Menü-Knopf sichtbar und ≥ 44 px hoch", await page.evaluate(() => { const k = document.querySelector(".menue-knopf").getBoundingClientRect(); return getComputedStyle(document.querySelector("nav.hauptnav")).display === "none" && k.height >= 44 && k.width >= 44 && getComputedStyle(document.querySelector(".kopf .sprachwahl")).display === "none"; }));
  await page.click(".menue-knopf"); await warten(450);
  ok("Mobil: Menü öffnet als modaler Dialog (showModal), Fokus im Dialog, Seite dahinter steht still", await page.evaluate(() => { const d = document.querySelector("dialog.menue"); return !!d && d.open && d.matches(":modal") && d.contains(document.activeElement) && getComputedStyle(document.documentElement).overflow === "hidden" && document.querySelector(".menue-knopf").getAttribute("aria-expanded") === "true"; }));
  ok("Mobil: Menü mit fünf Hauptseiten (≥ 44 px), aktueller Eintrag «Rechtsgebiete», sechs Sprachen, Telefon und E-Mail", await page.evaluate(() => { const a = [...document.querySelectorAll("dialog.menue nav.menue-liste a")]; const sp = document.querySelectorAll("dialog.menue .menue-sprachen a"); return a.length === 5 && a.every((x) => x.getBoundingClientRect().height >= 44) && a.find((x) => x.getAttribute("aria-current") === "page")?.textContent.trim() === "Rechtsgebiete" && sp.length === 6 && !!document.querySelector('dialog.menue a[href^="tel:"]') && !!document.querySelector('dialog.menue a[href^="mailto:"]'); }));
  await page.keyboard.press("Escape"); await warten(300);
  ok("Mobil: Escape schliesst das Menü, Fokus zurück auf dem Menü-Knopf, Seite scrollt wieder", await page.evaluate(() => !document.querySelector("dialog.menue").open && document.activeElement?.classList.contains("menue-knopf") && getComputedStyle(document.documentElement).overflow !== "hidden" && document.querySelector(".menue-knopf").getAttribute("aria-expanded") === "false"));
  await page.click(".menue-knopf"); await warten(300);
  await page.evaluate(() => [...document.querySelectorAll("dialog.menue nav.menue-liste a")].find((a) => a.textContent.includes("Team")).click()); await warten(900);
  ok("Mobil: Linkklick im Menü wechselt die Seite und schliesst das Menü", page.url().endsWith("/team/") && (await page.evaluate(() => !document.querySelector("dialog.menue").open)));
  for (const s of alleSeiten()) {
    await page.goto(BASE + s, { waitUntil: "networkidle0" });
    ok(`Mobil ${s}: kein horizontales Scrollen`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
  }
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  ok("Mobil: Titel und Telefonknopf im ersten Bildschirm (360 × 740)", await page.evaluate(() => { const h = document.querySelector("h1").getBoundingClientRect(); const k = document.querySelector('main a[href^="tel:"]').getBoundingClientRect(); return h.top >= 0 && k.bottom <= innerHeight; }));
  await ctx.close();
});

// 7) mailto-Formular (Deutsch und Arabisch): Prüfung, kodierter Link, kein Versand
for (const [seite, name, mail, nachricht] of [["/kontakt/", "name", "email", "nachricht"], ["/ar/", "name", "email", "nachricht"]]) {
  await gruppe(async () => {
    const { ctx, page, extern } = await frisch();
    const cdp = await page.createCDPSession();
    await cdp.send("Page.enable");
    const navigationen = [];
    cdp.on("Page.frameRequestedNavigation", (e) => navigationen.push(e.url));
    cdp.on("Page.frameScheduledNavigation", (e) => navigationen.push(e.url));
    const gesendet = [];
    page.on("request", (r) => { if (!["GET", "HEAD", "OPTIONS"].includes(r.method())) gesendet.push(`${r.method()} ${r.url()}`); });
    await page.goto(BASE + seite, { waitUntil: "networkidle0" });
    ok(`Formular ${seite}: Felder Name, E-Mail, Telefon, Betreff, Nachricht mit Beschriftungen, kein Datei-Upload`, await page.evaluate(() => { const f = document.querySelector("form"); const namen = [...f.querySelectorAll("input,select,textarea")].map((i) => i.name); return namen.join(",") === "name,email,telefon,betreff,nachricht" && !f.querySelector('input[type="file"]') && [...f.querySelectorAll("input,select,textarea")].every((i) => !!f.querySelector(`label[for="${i.id}"]`)); }));
    await page.evaluate(() => document.querySelector('form button[type="submit"]').click()); await warten(200);
    const fehler = await page.evaluate(() => [...document.querySelectorAll('form [role="alert"]')].map((e) => e.textContent));
    ok(`Formular ${seite}: leeres Absenden zeigt drei Fehlermeldungen, Fokus im Namensfeld, kein mailto`, fehler.length === 3 && (await page.evaluate(() => document.activeElement?.name === "name" && document.activeElement.getAttribute("aria-invalid") === "true")) && !navigationen.some((u) => u.startsWith("mailto:")), fehler.join(" | "));
    await page.type(`form input[name="${name}"]`, "Testperson Fiktiv & Co");
    await page.type(`form input[name="${mail}"]`, "test@example.com");
    await page.type('form input[name="telefon"]', "079 000 00 00");
    await page.type(`form textarea[name="${nachricht}"]`, "Prüfung & Test, Zeile 1\nZeile 2 mit #Raute?");
    await page.evaluate(() => document.querySelector('form button[type="submit"]').click()); await warten(700);
    const mailto = navigationen.find((u) => u.startsWith("mailto:")) ?? "";
    const dekodiert = (() => { try { return decodeURIComponent(mailto); } catch { return ""; } })();
    ok(`Formular ${seite}: gültig absenden erzeugt mailto an ${EMAIL} mit Name, Telefon und Nachricht`, mailto.startsWith(`mailto:${EMAIL}?subject=`) && dekodiert.includes("Testperson Fiktiv & Co") && dekodiert.includes("079 000 00 00") && dekodiert.includes("Zeile 2 mit #Raute?"), dekodiert.slice(0, 110).replaceAll("\n", " ⏎ "));
    ok(`Formular ${seite}: Sonderzeichen kodiert`, !/[\s#]/.test(mailto) && (mailto.match(/&/g) ?? []).length === 1 && mailto.includes("%0A") && mailto.includes("%26") && mailto.includes("%23"));
    const status = await page.evaluate(() => document.querySelector('form [role="status"]').textContent);
    ok(`Formular ${seite}: Hinweis nach dem Klick nennt die Adresse, keine Versandbestätigung`, status.includes(EMAIL) && !/gesendet|wurde versandt|has been sent/i.test(status), status.slice(0, 80));
    ok(`Formular ${seite}: nichts an einen Server gesendet, keine Anfragen an fremde Hosts`, gesendet.length === 0 && extern.length === 0, [...gesendet, ...extern].join(","));
    await ctx.close();
  });
}

// 8) Alte Adressen
await gruppe(async () => {
  const { ctx, page } = await frisch();
  for (const w of weiterleitungen) {
    await page.goto(BASE + w.alt, { waitUntil: "networkidle0" }); await warten(300);
    const ziel = BASE + w.neu;
    ok(`Weiterleitung ${w.alt} → ${w.neu}`, page.url() === ziel || page.url() === ziel.split("#")[0], page.url().replace(BASE, ""));
  }
  await ctx.close();
});

// 9) Fehlerseite, Direktaufrufe, Neuladen
await gruppe(async () => {
  const { ctx, page } = await frisch();
  const r = await page.goto(BASE + "/diese-seite-gibt-es-nicht/", { waitUntil: "networkidle0" });
  ok("Fehlerseite: 404 mit gestalteter Seite (lang de-CH), Link zur Startseite und Telefon", r.status() === 404 && (await page.evaluate(() => document.documentElement.lang === "de-CH" && /gibt es nicht/.test(document.querySelector("h1")?.textContent ?? "") && !!document.querySelector('main a[href$="/advokatur-kanonengasse-demo/"], main a[href="/"]') && !!document.querySelector('main a[href^="tel:"]'))));
  for (const s of alleSeiten()) {
    const r2 = await page.goto(BASE + s, { waitUntil: "networkidle0" });
    await page.reload({ waitUntil: "networkidle0" });
    ok(`Direktaufruf + Neuladen ${s}: 200, genau eine h1`, r2.status() === 200 && (await page.evaluate(() => document.querySelectorAll("main h1").length === 1)));
  }
  ok(`Profile: ${personen().length} Personen, jede Profilseite erreichbar`, personen().length === 11);
  await ctx.close();
});

// 10) Reduzierte Bewegung
await gruppe(async () => {
  const { ctx, page } = await frisch({ reduziert: true });
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  ok("Reduzierte Bewegung: kein scroll-behavior smooth", (await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)) === "auto");
  ok("Reduzierte Bewegung: keine Übergänge auf Knöpfen, Links, Karten, Kacheln", await page.evaluate(() => { const els = [...document.querySelectorAll(".knopf, .textlink, .hauptnav-link, .karte-gebiet, .kachel-bild img, summary")]; return els.length > 0 && els.every((el) => parseFloat(getComputedStyle(el).transitionDuration) <= 0.011); }));
  await page.hover(".knopf-sekundaer"); await warten(100);
  ok("Reduzierte Bewegung: Pfeil im Knopf bewegt sich im Hover nicht, Laufband-Knopf verborgen", await page.evaluate(() => getComputedStyle(document.querySelector(".knopf-sekundaer svg")).transform === "none" && getComputedStyle(document.querySelector(".laufband-knopf")).display === "none"));
  ok("Reduzierte Bewegung: keine Parallaxe, kein Laufband, keine Enthüllung, Schiene nicht gepinnt, alles sichtbar", await page.evaluate(() => { const kein = (sel) => getComputedStyle(document.querySelector(sel)).animationName === "none"; return kein(".buehne-bild img") && kein(".laufband-spur") && kein(".kopf-innen") && !document.documentElement.classList.contains("bewegung-bereit") && !document.querySelector(".schiene.gepinnt") && [...document.querySelectorAll("[data-reveal]")].every((el) => getComputedStyle(el).opacity === "1"); }));
  await ctx.close();
});

// 11) Bewegung erlaubt (Desktop 1440): Kopf über der Bühne, Enthüllung, gepinnte Schiene mit Tastatur, Lesebalken, Scrollspy
await gruppe(async () => {
  const { ctx, page } = await frisch();
  await page.goto(BASE + "/", { waitUntil: "networkidle0" }); await warten(700);
  ok("Bewegung: Enthüllung aktiv (html.bewegung-bereit), Elemente unterhalb des Fensters zurückgenommen, oberhalb sichtbar", await page.evaluate(() => { const alle = [...document.querySelectorAll("[data-reveal]")]; const unten = alle.filter((el) => el.getBoundingClientRect().top > innerHeight); const zurueck = unten.filter((el) => !el.classList.contains("sichtbar")); return document.documentElement.classList.contains("bewegung-bereit") && zurueck.length > 5 && zurueck.every((el) => getComputedStyle(el).opacity === "0") && alle.filter((el) => el.classList.contains("sichtbar")).every((el) => parseFloat(getComputedStyle(el).opacity) > 0.9); }));
  ok("Bewegung: Kopf über der Bühne durchsichtig mit heller Schrift, nach dem Scrollen deckend mit dunkler Schrift", await page.evaluate(async () => { const k = document.querySelector(".kopf-innen"); const oben = { bg: getComputedStyle(k).backgroundColor, farbe: getComputedStyle(k).color }; scrollTo({ top: 600, behavior: "instant" }); await new Promise((r) => setTimeout(r, 400)); const unten = { bg: getComputedStyle(k).backgroundColor, farbe: getComputedStyle(k).color }; scrollTo({ top: 0, behavior: "instant" }); await new Promise((r) => setTimeout(r, 200)); return /rgba\((251, 251, 250|0, 0, 0), 0\)/.test(oben.bg) && /233, 233, 231/.test(oben.farbe) && /251, 251, 250, 0\.9/.test(unten.bg) && /24, 33, 83/.test(unten.farbe); }));
  ok("Bewegung: Bühne füllt den ersten Bildschirm, Bild mit Parallaxe-Animation, Laufband läuft, Kopf-Weichzeichner gestuft statt interpoliert", await page.evaluate(() => { const b = document.querySelector(".buehne").getBoundingClientRect(); const kopf = getComputedStyle(document.querySelector(".kopf-innen")); return b.height >= innerHeight - 1 && getComputedStyle(document.querySelector(".buehne-bild img")).animationName === "parallaxe" && getComputedStyle(document.querySelector(".laufband-spur")).animationName === "laufen" && /kopf-weich/.test(kopf.animationName) && /steps\(1(, end)?\)/.test(kopf.animationTimingFunction); }));
  ok("Bewegung: Laufband läuft im Fenster, hält auf Knopfdruck an (Beschriftung wechselt) und läuft nach erneutem Klick weiter", await page.evaluate(async () => { const lb = document.querySelector(".laufband"); lb.scrollIntoView({ block: "center", behavior: "instant" }); await new Promise((r) => setTimeout(r, 400)); const spur = document.querySelector(".laufband-spur"); const k = document.querySelector(".laufband-knopf"); const a = getComputedStyle(spur).animationPlayState; const t1 = k.textContent.trim(); k.click(); await new Promise((r) => setTimeout(r, 150)); const b = getComputedStyle(spur).animationPlayState; const t2 = k.textContent.trim(); k.click(); await new Promise((r) => setTimeout(r, 150)); const c = getComputedStyle(spur).animationPlayState; scrollTo({ top: 0, behavior: "instant" }); return a === "running" && b === "paused" && c === "running" && t1.includes("Laufband anhalten") && t2.includes("Laufband fortsetzen"); }));
  ok("Bewegung: Laufband hält ausserhalb des Fensters an", await page.evaluate(async () => { scrollTo({ top: 0, behavior: "instant" }); await new Promise((r) => setTimeout(r, 400)); const spur = document.querySelector(".laufband-spur"); const r = document.querySelector(".laufband").getBoundingClientRect(); const draussen = r.top > innerHeight; return draussen && getComputedStyle(spur).animationPlayState === "paused"; }));
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 40)); } }); await warten(1200);
  ok("Bewegung: nach dem Durchscrollen sind alle Elemente enthüllt (opacity 1)", await page.evaluate(() => [...document.querySelectorAll("[data-reveal]")].every((el) => el.classList.contains("sichtbar") && getComputedStyle(el).opacity === "1")));
  const schiene = await page.evaluate(async () => {
    const s = document.querySelector(".schiene"); const k = document.querySelector(".schiene-kleber"); const oben = s.getBoundingClientRect().top + scrollY; const ueber = parseFloat(s.style.getPropertyValue("--ueberhang"));
    const mess = async (y) => { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 350)); return { p: parseFloat(getComputedStyle(k).getPropertyValue("--p")), kleberTop: Math.round(k.getBoundingClientRect().top), karte1: Math.round(document.querySelector(".karte-gebiet").getBoundingClientRect().left), karte9: Math.round(document.querySelectorAll(".karte-gebiet")[8].getBoundingClientRect().right), breit: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }; };
    return { gepinnt: s.classList.contains("gepinnt"), ueber, hoehe: Math.round(s.getBoundingClientRect().height), anfang: await mess(oben), mitte: await mess(oben + ueber / 2), ende: await mess(oben + ueber) };
  });
  ok("Bewegung: Schiene gepinnt, Höhe = Fenster + Überhang, Fortschritt 0 → 0.5 → 1, erste Karte am Anfang und letzte am Ende im Bild, kein Überlauf", schiene.gepinnt && schiene.ueber > 1000 && Math.abs(schiene.hoehe - (900 + schiene.ueber)) < 3 && schiene.anfang.p < 0.01 && Math.abs(schiene.mitte.p - 0.5) < 0.02 && schiene.ende.p > 0.99 && schiene.anfang.kleberTop === 0 && schiene.ende.kleberTop === 0 && schiene.anfang.karte1 >= 100 && schiene.anfang.karte1 <= 140 && schiene.ende.karte9 <= 1440 && schiene.ende.karte9 >= 1200 && !schiene.anfang.breit && !schiene.mitte.breit && !schiene.ende.breit, JSON.stringify(schiene));
  // Tastatur in der gepinnten Schiene: Fokus auf einer Karte ausserhalb des Bildes scrollt das Fenster, bis sie sichtbar ist
  const tastatur = await page.evaluate(async () => {
    const s = document.querySelector(".schiene"); const oben = s.getBoundingClientRect().top + scrollY; scrollTo({ top: oben, behavior: "instant" }); await new Promise((r) => setTimeout(r, 300));
    const links = [...document.querySelectorAll(".karte-gebiet .karte-link")]; const ergebnis = [];
    for (const i of [0, 4, 8, 2]) { links[i].focus(); await new Promise((r) => setTimeout(r, 350)); const r = links[i].closest(".karte-gebiet").getBoundingClientRect(); ergebnis.push({ i, sichtbar: r.left >= -1 && r.right <= innerWidth + 1, aktiv: document.activeElement === links[i] }); }
    return ergebnis;
  });
  ok("Bewegung: Tab/Fokus auf Karten 1, 5, 9, 3 macht jede Karte vollständig sichtbar", tastatur.every((t) => t.sichtbar && t.aktiv), JSON.stringify(tastatur));
  ok("Fokus: Schwerpunktkarte zeigt den Ring in Marineblau mit Abstand (nicht Orange auf Hell)", await page.evaluate(() => { const l = document.querySelector(".karte-gebiet.schwerpunkt .karte-link"); l.focus(); const st = getComputedStyle(l.closest(".karte-gebiet")); return st.outlineStyle !== "none" && st.outlineColor === "rgb(24, 33, 83)" && parseFloat(st.outlineWidth) >= 3; }));
  await page.goto(BASE + "/team/urs-ebnoether/", { waitUntil: "networkidle0" }); await warten(400);
  ok("Bewegung: Lesebalken auf dem Profil wächst mit dem Scrollen", await page.evaluate(async () => { const b = document.querySelector(".lesebalken"); const w0 = b.getBoundingClientRect().width; scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }); await new Promise((r) => setTimeout(r, 400)); const w1 = b.getBoundingClientRect().width; return getComputedStyle(b).display === "block" && w0 < 50 && w1 > innerWidth - 5; }));
  await page.goto(BASE + "/rechtsgebiete/", { waitUntil: "networkidle0" }); await warten(400);
  const spy = await page.evaluate(async () => { const z = (id) => { document.getElementById(id).scrollIntoView({ behavior: "instant", block: "start" }); scrollBy({ top: -80, behavior: "instant" }); }; const aktuell = () => [...document.querySelectorAll(".index-link[aria-current]")].map((a) => a.getAttribute("href")); z("familienrecht"); await new Promise((r) => setTimeout(r, 500)); const a = aktuell(); z("sportrecht"); await new Promise((r) => setTimeout(r, 500)); const b = aktuell(); return { a, b, sticky: getComputedStyle(document.querySelector(".index-nav")).position }; });
  ok("Bewegung: Scrollspy markiert genau den sichtbaren Abschnitt (Familienrecht, dann Sportrecht), Index klebt", spy.a.join() === "#familienrecht" && spy.b.join() === "#sportrecht" && spy.sticky === "sticky", JSON.stringify(spy));
  await ctx.close();
});

// 12) Bewegung erlaubt, Handy (390 px) und Arabisch: gestapelte Karten statt Fahrt, kein Überlauf, Menü in RTL
await gruppe(async () => {
  const { ctx, page } = await frisch({ breite: 390, hoehe: 800 });
  await page.goto(BASE + "/", { waitUntil: "networkidle0" }); await warten(500);
  ok("Mobil mit Bewegung: Schiene nicht gepinnt, Karten kleben gestapelt (position sticky), kein Überlauf", await page.evaluate(async () => { const s = document.querySelector(".schiene"); const k = document.querySelectorAll(".karte-gebiet"); scrollTo({ top: s.getBoundingClientRect().top + scrollY + 900, behavior: "instant" }); await new Promise((r) => setTimeout(r, 300)); return !s.classList.contains("gepinnt") && getComputedStyle(k[0]).position === "sticky" && k[0].getBoundingClientRect().top >= 60 && document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1; }));
  await page.goto(BASE + "/ar/", { waitUntil: "networkidle0" }); await warten(500);
  ok("Arabisch mit Bewegung: Laufband läuft nach rechts (laufen-rtl), Schiene nie gepinnt, kein Überlauf", await page.evaluate(() => getComputedStyle(document.querySelector(".laufband-spur")).animationName === "laufen-rtl" && !document.querySelector(".schiene.gepinnt") && document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
  await page.click(".menue-knopf"); await warten(400);
  ok("Arabisch: Menü öffnet modal mit vier Abschnittslinks, Schliessen-Knopf ≥ 44 px", await page.evaluate(() => { const d = document.querySelector("dialog.menue"); const b = d.querySelector(".menue-schliessen").getBoundingClientRect(); return d.open && d.matches(":modal") && d.querySelectorAll("nav.menue-liste a").length === 4 && b.height >= 44; }));
  await page.evaluate(() => [...document.querySelectorAll("dialog.menue nav.menue-liste a")].find((a) => a.getAttribute("href") === "#kontakt").click()); await warten(2600);
  ok("Arabisch: Sprungmarke im Menü schliesst das Menü und scrollt zum Abschnitt Kontakt", await page.evaluate(() => !document.querySelector("dialog.menue").open && Math.abs(document.getElementById("kontakt").getBoundingClientRect().top) < 120));
  await ctx.close();
});

await gruppe(async () => {
  // Desktop 1440 in Arabisch: Schiene als drei Spalten (kein Stapel, keine Fahrt)
  const { ctx, page } = await frisch();
  await page.goto(BASE + "/ar/", { waitUntil: "networkidle0" }); await warten(500);
  ok("Arabisch 1440: Rechtsgebiete als drei Spalten, erste Karte rechts, kein Überlauf", await page.evaluate(() => { const k = [...document.querySelectorAll(".karte-gebiet")]; const tops = k.slice(0, 3).map((x) => Math.round(x.getBoundingClientRect().top)); return !document.querySelector(".schiene.gepinnt") && tops.every((t) => t === tops[0]) && k[0].getBoundingClientRect().left > k[1].getBoundingClientRect().left && getComputedStyle(k[0]).position === "static" && document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1; }));
  await ctx.close();
});

await browser.close();
mkdirSync("pruefung", { recursive: true });
writeFileSync("pruefung/funktionen.json", JSON.stringify(ergebnisse, null, 1));
const fehler = ergebnisse.filter((e) => !e.ok);
console.log(`\n${ergebnisse.length} Prüfungen, ${fehler.length} fehlgeschlagen → pruefung/funktionen.json`);
process.exitCode = fehler.length ? 1 : 0;
