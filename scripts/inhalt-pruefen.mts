// Prüft die Inhalte über das Schema hinaus (das Schema selbst prüft lib/content/local.ts beim Laden):
//  - Schweizer Schreibweise (kein «ß»), keine Gedankenstriche, keine geraden Anführungszeichen in deutschen Texten
//  - keine unbelegten Behauptungen (kostenlose Beratung, Erfolgsquoten, Garantien, Fachanwaltstitel, Honorare, Bewertungen,
//    Erreichbarkeits- oder Antwortversprechen, Barrierefreiheit/Lift/Parkplätze, Superlative) in frei formulierten Texten
//  - Kontaktangaben in freien Texten stimmen mit data/kanzlei.json bzw. den Profilen überein (eine Wahrheit)
//  - Personen: Rolle, Gruppe und Berufsbezeichnung passen zusammen; Rechtsgebiete nur aus der Quelle; Sprachen bestätigt
//  - Rechtsgebiete: jedes hat Personen oder einen Grund; Übersetzungen vollständig
//  - Links: Ziele erlaubt, interne Seiten und Sprungmarken vorhanden
//  - Bilder: Alternativtext, Nachweis, Datei vorhanden, jedes Bild verwendet
//  - Weiterleitungen: jede alte Adresse zeigt auf eine bestehende Seite
//  - Quellen: jede Seite mit Belegen; mit --live zusätzlich: alles von der Kanzlei freigegeben?
// Aufruf: npm run inhalt:pruefen   ·   vor dem Go-Live: npm run inhalt:pruefen -- --live
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { inhaltsquelle, inhaltsquelleName, pfade } from "../lib/content";
import { istErlaubtesLinkziel } from "../lib/assets";
import { offeneFreigaben } from "../lib/content/freigabe";
import { SPRACHCODES } from "../lib/content/pfade";

const live = process.argv.includes("--live");
const fehler: string[] = [];
const hinweise: string[] = [];
const q = await inhaltsquelle();
const lokal = inhaltsquelleName === "lokal";
const [k, t, start, personen, rechtsgebiete, rgSeite, team, mitarbeit, kontakt, impressum, datenschutz, sprachseiten] = await Promise.all([
  q.getKanzlei(), q.getTexte(), q.getStartseite(), q.getPersonen(), q.getRechtsgebiete(), q.getRechtsgebieteSeite(), q.getTeamSeite(), q.getMitarbeitSeite(), q.getKontaktSeite(),
  q.getRechtSeite("impressum"), q.getRechtSeite("datenschutz"), q.getSprachseiten(),
]);
const deutsch = { k, t, start, personen, rechtsgebiete, rgSeite, team, mitarbeit, kontakt, impressum, datenschutz };

// ── alle Zeichenketten und Links einsammeln ────────────────────────────────
type Fund = { pfad: string; text: string };
const texte: Fund[] = [];
const fremdsprachig: Fund[] = [];
const linksListe: { pfad: string; ziel: string; text?: string }[] = [];
const UEBERSPRINGEN = new Set(["quellen", "nachweis", "url", "herkunft", "karten", "ziel", "lang", "code", "slug", "person", "portrait", "portraitQuadrat", "logo", "foto", "seoBild", "original", "id"]);
function gehen(wert: unknown, pfad: string, ziel: Fund[]) {
  if (typeof wert === "string") { ziel.push({ pfad, text: wert }); return; }
  if (Array.isArray(wert)) { wert.forEach((v, i) => gehen(v, `${pfad}[${i}]`, ziel)); return; }
  if (wert && typeof wert === "object") {
    const o = wert as Record<string, unknown>;
    if (typeof o.ziel === "string") linksListe.push({ pfad, ziel: o.ziel, text: typeof o.text === "string" ? o.text : undefined });
    if (typeof o.link === "string") linksListe.push({ pfad, ziel: o.link, text: typeof o.text === "string" ? o.text : undefined });
    for (const [kk, v] of Object.entries(o)) {
      if (UEBERSPRINGEN.has(kk)) continue;
      gehen(v, `${pfad}.${kk}`, ziel);
    }
  }
}
for (const [name, wert] of Object.entries(deutsch)) gehen(wert, name, texte);
for (const s of sprachseiten) gehen(s, `sprache.${s.sprache}`, fremdsprachig);
// Arabische Grüsse und Sprachnamen in der deutschen Sprachliste sind keine deutschen Texte
const deutscheTexte = texte.filter((f) => !/^t\.sprachen\[\d+\]\.(name|gruss)$/.test(f.pfad));

// ── Schreibweise (deutsche Texte) ──────────────────────────────────────────
for (const { pfad, text } of deutscheTexte) {
  if (text.includes("ß")) fehler.push(`${pfad}: «ß» gefunden (Schweizer Schreibweise verlangt «ss»): ${text.slice(0, 60)}`);
  if (/[—–]/.test(text)) fehler.push(`${pfad}: Gedankenstrich gefunden (Satz umstellen oder Bindestrich verwenden): ${text.slice(0, 60)}`);
  if (/(^|\s)"[^"]+"/.test(text)) fehler.push(`${pfad}: gerade Anführungszeichen (stattdessen «…»): ${text.slice(0, 60)}`);
  if (/\s{2,}/.test(text.trim())) fehler.push(`${pfad}: doppelte Leerzeichen: ${text.slice(0, 60)}`);
}
for (const { pfad, text } of fremdsprachig) {
  if (/[—–]/.test(text)) fehler.push(`${pfad}: Gedankenstrich gefunden: ${text.slice(0, 60)}`);
  if (/\s{2,}/.test(text.trim())) fehler.push(`${pfad}: doppelte Leerzeichen: ${text.slice(0, 60)}`);
}

// ── Unbelegte Behauptungen ─────────────────────────────────────────────────
// Geprüft werden frei formulierte deutsche Texte. Ausgenommen: Rechtsseiten, Formular- und Einwilligungstexte, der wörtlich übernommene
// Hinweis zu Anfragen (24 Stunden), Lebensläufe und Quellentexte der Mitarbeitseite (Wortlaut der bisherigen Website).
const VERBOTEN: [RegExp, string][] = [
  [/kostenlos|kostenfrei|\bgratis\b|unentgeltlich(?!e Rechtspflege)|unverbindliche[sn]? Erstgespräch|kostenlose[sn]? Erstberatung/i, "kostenlose Erstberatung oder Gratisangebot"],
  [/\bgarantie|garantiert|Erfolg(s)?quote|Erfolgsaussicht|gewinnen wir|\bgewonnen\b/i, "Garantie oder Erfolgsquote"],
  [/Fachanwalt|Fachanwältin|zertifizierte[rn]? Anwalt|Fachanwaltstitel/i, "Fachanwaltstitel ohne Quelle"],
  [/Notfall|rund um die Uhr|immer erreichbar|(7|sieben) Tage|365 Tage|am Wochenende|Pikettnummer|Notrufnummer/i, "Erreichbarkeitsgarantie oder Notfallnummer"],
  [/Antwort(zeit)? (innert|innerhalb)|melden uns (innert|innerhalb)|antworten (innert|innerhalb)|Rückruf (innert|innerhalb)/i, "feste Antwortzeit"],
  [/Honorar|Stundenansatz|\bCHF\b|Franken|\bEuro\b|\bEUR\b|Pauschale|Gebühr(en)?\b|\bTarif|Preis(e|liste|n)?\b|Rechnung\b/i, "Honorar- oder Kostenangabe"],
  [/Bewertung|Sterne\b|\b[1-5][.,]\d Sterne|Mandanten sagen|Referenzen|Rezensionen|Erfahrungsberichte|Kundenstimmen/i, "Bewertungen oder Mandantenstimmen"],
  [/\bführende[rn]?\b|beste[rn]? (Anwalt|Kanzlei)|Nr\. ?1|renommiert|erfahrenste|erstklassig|exzellent|hervorragend|einzigartig|unschlagbar|\btop\b/i, "Superlativ"],
  [/barrierefrei|rollstuhlgängig|\bLift\b|Aufzug|Parkplatz|Parkplätze|Parkhaus|Parkmöglichkeit/i, "Barrierefreiheit, Lift oder Parkplätze (nicht belegt)"],
  [/\bAG\b|\bGmbH\b|Aktiengesellschaft|Kollektivgesellschaft|\bUID\b|CHE-\d/i, "Rechtsform oder UID (für die Bürogemeinschaft nicht belegt)"],
  [/Öffnungszeiten|Bürozeiten|Sprechstunde|\bFreitag|freitags/i, "Öffnungszeiten oder Freitagszeiten (nur Telefonzeiten Montag bis Donnerstag sind belegt)"],
];
{
  const mussTreffen = ["Erstberatung kostenfrei", "Gebühren nach Aufwand", "Tarif auf Anfrage", "immer erreichbar", "7 Tage die Woche", "erstklassige Vertretung", "Wir melden uns innert 24 Stunden", "4.9 Sterne", "ab 250 Euro", "rollstuhlgängiger Zugang", "Parkplätze vor dem Haus", "advokatur kanonengasse AG", "Öffnungszeiten Freitag"];
  const darfNicht = ["unentgeltliche Rechtspflege", "Partnerschaft ab Januar 2026", "Telefonzeiten Montag bis Donnerstag", "Rechtsberatung und Vertretung", "Verein Pikett Strafverteidigung", "Mietgericht", "Spezialisierung im Migrationsrecht", "keiner unserer Anwältinnen und Anwälte Kapazitäten hat", "Unkostenbeitrag", "Asylgesetz"];
  for (const x of mussTreffen) if (!VERBOTEN.some(([m]) => m.test(x))) fehler.push(`Sperrliste-Selbsttest: «${x}» müsste als unbelegte Behauptung erkannt werden`);
  for (const x of darfNicht) if (VERBOTEN.some(([m]) => m.test(x))) fehler.push(`Sperrliste-Selbsttest: «${x}» darf nicht anschlagen (Muster zu breit)`);
}
const AUSGENOMMEN = /^(impressum|datenschutz|t\.einwilligung|t\.formular|kontakt\.hinweis|personen\[\d+\]\.(werdegang|mitgliedschaften|rechtsgebiete|fussnoten|sprachenOriginal)|mitarbeit\.(stellen|partnerschaft)|rechtsgebiete\[\d+\]\.(hintergrund|begriffe))/;
for (const { pfad, text } of deutscheTexte) {
  if (AUSGENOMMEN.test(pfad)) continue;
  for (const [muster, was] of VERBOTEN) if (muster.test(text)) fehler.push(`${pfad}: unbelegte Behauptung (${was}): «${text.slice(0, 80)}»`);
}
// Impressum: keine Rechtsform oder UID für die Bürogemeinschaft (die Rechtsseiten sind sonst von der Sperrliste ausgenommen)
for (const { pfad, text } of deutscheTexte) {
  if (!/^impressum/.test(pfad)) continue;
  if (/\bAG\b|\bGmbH\b|Aktiengesellschaft|Kollektivgesellschaft|\bUID\b|CHE-\d/.test(text)) fehler.push(`${pfad}: Rechtsform oder UID im Impressum (für die Bürogemeinschaft nicht belegt): «${text.slice(0, 80)}»`);
}

// ── Kontaktangaben: eine Wahrheit ──────────────────────────────────────────
{
  const bekannteNummern = new Set([k.telefon, ...personen.map((p) => p.telefon), ...mitarbeit.partnerschaft.kontakte.map((x) => x.telefon)]);
  const bekannteMails = new Set([k.email, ...personen.flatMap((p) => (p.email ? [p.email] : [])), ...mitarbeit.stellen.map((s) => s.bewerbung.email), ...mitarbeit.partnerschaft.kontakte.map((x) => x.email)]);
  for (const { pfad, text } of [...deutscheTexte, ...fremdsprachig]) {
    for (const m of text.matchAll(/\+41 \d{2} \d{3} \d{2} \d{2}|\b0\d{2} \d{3} \d{2} \d{2}\b/g)) {
      const norm = m[0].startsWith("0") ? `+41 ${m[0].slice(1)}` : m[0];
      if (!bekannteNummern.has(norm)) fehler.push(`${pfad}: Telefonnummer «${m[0]}» ist nirgends als Kanzlei- oder Profilnummer hinterlegt`);
    }
    for (const m of text.matchAll(/[\w.+-]+@kanonengasse\.ch/g)) if (!bekannteMails.has(m[0])) fehler.push(`${pfad}: E-Mail «${m[0]}» ist nirgends hinterlegt`);
    for (const m of text.matchAll(/Militärstrasse\s*\d+[a-z]?/g)) if (m[0] !== k.besuchsadresse.strasse) fehler.push(`${pfad}: Adresse «${m[0]}» weicht von kanzlei.besuchsadresse ab`);
    for (const m of text.matchAll(/\b(8004|8021)\s+Z[uü]rich/g)) {
      if (m[1] === "8021" && !/Postfach|postale|postal|البريدي|Postadresse/i.test(text) && !/^(impressum|datenschutz)/.test(pfad)) hinweise.push(`${pfad}: 8021 Zürich ohne Postfach-Kontext: «${text.slice(0, 70)}»`);
    }
  }
  if (k.besuchsadresse.plz === k.postadresse.plz) fehler.push("Besuchs- und Postadresse tragen dieselbe PLZ: Postfach 1012 liegt in 8021, die Militärstrasse 76 in 8004 (geo.admin.ch).");
}

// ── Personen ───────────────────────────────────────────────────────────────
const PARTNER = /Partner(in)?$/;
for (const p of personen) {
  if (/partner/.test(p.funktion) !== PARTNER.test(p.rolle)) fehler.push(`Profil ${p.slug}: Funktion «${p.funktion}» passt nicht zur Rolle «${p.rolle}»`);
  if (p.funktion === "associate" && !/Associate/.test(p.rolle)) fehler.push(`Profil ${p.slug}: Associate ohne «Associate» in der Rolle`);
  if (p.gruppe === "substitutinnen-und-substituten" && !/Substitut/.test(p.rolle)) fehler.push(`Profil ${p.slug}: Gruppe Substitut, Rolle sagt etwas anderes`);
  if (p.gruppe === "sekretariat" && !/Sekretariat/.test(p.rolle)) fehler.push(`Profil ${p.slug}: Gruppe Sekretariat, Rolle sagt etwas anderes`);
  if (p.gruppe !== "anwaeltinnen-und-anwaelte" && p.rechtsgebiete.length) fehler.push(`Profil ${p.slug}: nur Anwältinnen und Anwälte nennen auf der bisherigen Website Rechtsgebiete`);
  const namen = p.sprachen.map((s) => s.name);
  for (const n of namen) if (!p.sprachenOriginal.includes(n)) fehler.push(`Profil ${p.slug}: Sprache «${n}» steht nicht in der Originalzeile «${p.sprachenOriginal}»`);
  if (!/^Deutsch|, Deutsch/.test(p.sprachenOriginal)) fehler.push(`Profil ${p.slug}: Deutsch fehlt in den Sprachen (prüfen)`);
  if (p.werdegang.join(" ").length < 80) fehler.push(`Profil ${p.slug}: Werdegang wirkt unvollständig`);
  if (!p.herkunft.some((h) => h.url?.includes(`kanonengasse.ch/${p.slug}`))) fehler.push(`Profil ${p.slug}: Quelle nennt nicht die Profilseite der bisherigen Website`);
}
{
  const reihen = personen.map((p) => p.reihenfolge);
  if (new Set(reihen).size !== reihen.length) fehler.push("Personen: Reihenfolge doppelt vergeben");
  // Die Einleitung der Teamseite zählt nur, wer eine Schweizer Anwaltsbezeichnung trägt; Partner ohne Zulassung werden getrennt genannt.
  const ZAHLWORT = ["null", "Eine", "Zwei", "Drei", "Vier", "Fünf", "Sechs", "Sieben", "Acht", "Neun", "Zehn"];
  const anwaelte = personen.filter((p) => p.berufsbezeichnung).length;
  const ohneZulassung = personen.filter((p) => p.gruppe === "anwaeltinnen-und-anwaelte" && !p.berufsbezeichnung);
  if (!team.einleitung.startsWith(`${ZAHLWORT[anwaelte]} Rechtsanwältinnen und Rechtsanwälte`)) fehler.push(`Team-Einleitung muss mit «${ZAHLWORT[anwaelte]} Rechtsanwältinnen und Rechtsanwälte» beginnen (${anwaelte} Personen tragen eine Anwaltsbezeichnung)`);
  if (ohneZulassung.length && !/Partner/.test(team.einleitung)) fehler.push("Team-Einleitung nennt die Partner ohne Schweizer Anwaltsbezeichnung nicht gesondert");
  for (const p of ohneZulassung) if (!/^partner/.test(p.funktion)) fehler.push(`Profil ${p.slug}: in der ersten Gruppe ohne Anwaltsbezeichnung und ohne Partnerfunktion`);
}

// ── Rechtsgebiete ──────────────────────────────────────────────────────────
for (const r of rechtsgebiete) {
  const traeger = personen.filter((p) => p.rechtsgebiete.some((x) => x.slug === r.slug));
  if (!traeger.length) fehler.push(`Rechtsgebiet «${r.slug}»: keine Person der bisherigen Website nennt es`);
  for (const [code, u] of Object.entries(r.uebersetzungen)) if (!u.titel.trim()) fehler.push(`Rechtsgebiet «${r.slug}»: Übersetzung ${code} leer`);
  if (!r.herkunft.length) fehler.push(`Rechtsgebiet «${r.slug}»: keine Quelle`);
}
const SCHWERPUNKTE_QUELLE = new Set(["migrationsrecht", "strafrecht", "familienrecht", "mietrecht"]);
for (const r of rechtsgebiete) if (r.schwerpunkt !== SCHWERPUNKTE_QUELLE.has(r.slug)) fehler.push(`Rechtsgebiet «${r.slug}»: Schwerpunkt-Markierung weicht von der Partnerschaftsseite ab (Migrationsrecht, Straf-, Familien-, Mietrecht)`);

// ── Links ──────────────────────────────────────────────────────────────────
const seiten = new Set<string>([pfade.start, pfade.rechtsgebiete, pfade.team, pfade.mitarbeit, pfade.kontakt, pfade.impressum, pfade.datenschutz, pfade.fehler, ...personen.map((p) => pfade.person(p.slug)), ...SPRACHCODES.map((c) => pfade.sprache(c))]);
const anker: Record<string, Set<string>> = {
  [pfade.rechtsgebiete]: new Set(rechtsgebiete.map((r) => r.slug)),
  [pfade.mitarbeit]: new Set(["offene-stellen", "partnerschaft", ...mitarbeit.stellen.map((s) => s.slug)]),
  [pfade.impressum]: new Set([...impressum.bloecke.flatMap((b) => (b.art === "titel" ? [b.anker] : [])), "bildnachweis"]),
  [pfade.datenschutz]: new Set(datenschutz.bloecke.flatMap((b) => (b.art === "titel" ? [b.anker] : []))),
};
for (const l of linksListe) {
  if (!istErlaubtesLinkziel(l.ziel)) { fehler.push(`${l.pfad}: Linkziel nicht erlaubt: ${l.ziel}`); continue; }
  if (!l.ziel.startsWith("/")) continue;
  const [seite, marke] = l.ziel.split("#");
  if (!seiten.has(seite)) fehler.push(`${l.pfad}: interne Seite gibt es nicht: ${l.ziel}`);
  else if (marke && !anker[seite]?.has(marke)) fehler.push(`${l.pfad}: Sprungmarke gibt es nicht: ${l.ziel}`);
}
// Markdown-Links in Fliesstexten
for (const { pfad, text } of [...deutscheTexte, ...fremdsprachig]) {
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) if (!istErlaubtesLinkziel(m[1])) fehler.push(`${pfad}: Linkziel im Text nicht erlaubt: ${m[1]}`);
}

// ── Einstieg ───────────────────────────────────────────────────────────────
if (start.hero.text.trim().split(/\s+/).length > 24) fehler.push(`start.hero.text: mehr als 24 Wörter; der Einstieg soll auf einen Blick lesbar bleiben`);
if (start.hero.titel.length > 60) fehler.push(`start.hero.titel: ${start.hero.titel.length} Zeichen (höchstens 60, sonst bricht der Titel auf mehr als zwei Zeilen)`);

// ── Sprachseiten ───────────────────────────────────────────────────────────
for (const s of sprachseiten) {
  if (s.ui.zeiten.length !== k.telefonzeiten.zeiten.length) fehler.push(`Sprachseite ${s.sprache}: Anzahl Telefonzeiten weicht von kanzlei.json ab`);
  for (const z of s.ui.zeiten) if (!/9|12|14|16/.test(z)) fehler.push(`Sprachseite ${s.sprache}: Telefonzeit «${z}» passt nicht zu 9 bis 12 und 14 bis 16 Uhr`);
  if (!/24/.test(s.kapazitaetshinweis.text)) fehler.push(`Sprachseite ${s.sprache}: Hinweis zu Anfragen nennt die 24 Stunden nicht`);
  // Der Hinweis beschreibt ausbleibende Rückmeldung; er darf in keiner Sprache eine Antwort zusagen.
  const ZUSAGE = /we will (reply|respond|answer|get back)|you will (hear|receive)|guarantee|nous (vous )?(répondrons|reviendrons)|garantissons|risponderemo|garantiamo|responderemos|garantizamos|سنرد|سنجيب|نضمن/i;
  if (ZUSAGE.test(s.kapazitaetshinweis.text) || ZUSAGE.test(s.formular.hinweisNachher)) fehler.push(`Sprachseite ${s.sprache}: Text sagt eine Antwort zu (nicht belegt)`);
  if (s.sprache === "ar" && s.richtung !== "rtl") fehler.push("Arabisch muss rtl sein");
  if (s.sprache !== "ar" && s.richtung !== "ltr") fehler.push(`Sprachseite ${s.sprache}: Richtung muss ltr sein`);
  for (const [code, name] of [["en", "English"], ["fr", "Français"], ["it", "Italiano"], ["es", "Español"], ["ar", "العربية"]] as const) if (s.sprache === code && s.name !== name) fehler.push(`Sprachseite ${code}: Name «${s.name}» erwartet «${name}»`);
  const nav = s.ui.navigation.map((n) => n.anker).join(",");
  if (nav !== "kanzlei,rechtsgebiete,team,kontakt") fehler.push(`Sprachseite ${s.sprache}: Abschnittsnavigation muss kanzlei, rechtsgebiete, team, kontakt sein`);
  if (s.formular.betreffOptionen.length < 2) fehler.push(`Sprachseite ${s.sprache}: zu wenige Betreff-Optionen`);
  if (/gesendet|sent\b|envoyé|inviato|enviado|أُرسلت/i.test(s.formular.hinweisNachher) && !/not|pas|non|no |لم/.test(s.formular.hinweisNachher)) fehler.push(`Sprachseite ${s.sprache}: Hinweis nach dem Klick darf keinen Versand behaupten`);
}

// ── Weiterleitungen ────────────────────────────────────────────────────────
if (lokal) {
  const weiterleitungen = JSON.parse(readFileSync("data/weiterleitungen.json", "utf8")) as { alt: string; neu: string }[];
  for (const w of weiterleitungen) {
    const [seite, marke] = w.neu.split("#");
    if (!seiten.has(seite)) fehler.push(`Weiterleitung ${w.alt} → ${w.neu}: Zielseite gibt es nicht`);
    else if (marke && !anker[seite]?.has(marke)) fehler.push(`Weiterleitung ${w.alt} → ${w.neu}: Sprungmarke gibt es nicht`);
  }
  for (const p of personen) if (!weiterleitungen.some((w) => w.alt === `/${p.slug}`)) fehler.push(`Weiterleitung für die alte Profiladresse /${p.slug} fehlt`);
}

// ── Bilder (nur lokale Quelle) ─────────────────────────────────────────────
const verzeichnis = lokal ? (JSON.parse(readFileSync("data/bilder.json", "utf8")) as Record<string, { alt: string; nachweis?: { urheber?: string; quelle?: string; lizenz?: string }; quellen: { avif: { url: string }[]; webp: { url: string }[] } }>) : {};
const vorhanden = new Set(lokal ? readdirSync("public/bilder") : []);
for (const [id, b] of Object.entries(verzeichnis)) {
  if (!b.alt.trim()) fehler.push(`Bild «${id}»: Alternativtext fehlt`);
  if (!b.nachweis?.urheber || !b.nachweis.quelle || !b.nachweis.lizenz) fehler.push(`Bild «${id}»: Bildnachweis unvollständig`);
  for (const v of [...b.quellen.avif, ...b.quellen.webp]) if (!vorhanden.has(path.basename(v.url))) fehler.push(`Bild «${id}»: Datei fehlt in public/bilder: ${v.url} (npm run bilder)`);
}
if (lokal) {
  const rohInhalte = ["kanzlei", "personen"].map((d) => readFileSync(`data/${d}.json`, "utf8")).join("\n");
  for (const id of Object.keys(verzeichnis)) if (!rohInhalte.includes(`"${id}"`)) fehler.push(`Bild «${id}» wird nirgends verwendet: aus scripts/bilder-liste.json entfernen oder einsetzen`);
}

// ── Quellen und Freigaben ──────────────────────────────────────────────────
type Beleg = { wo: string; titel: string; herkunft: { url?: string; art: string; quelle: string }[] };
const belege: Beleg[] = [
  { wo: "Kanzleiangaben", titel: "Kanzlei", herkunft: k.herkunft },
  { wo: "Startseite", titel: "Belege der Seite", herkunft: start.belege.herkunft },
  ...personen.map((p) => ({ wo: "Profil", titel: `${p.vorname} ${p.nachname}`, herkunft: p.herkunft })),
  ...rechtsgebiete.map((r) => ({ wo: "Rechtsgebiete", titel: r.titel, herkunft: r.herkunft })),
  { wo: "Rechtsgebiete", titel: "Übersichtsseite", herkunft: rgSeite.belege.herkunft },
  { wo: "Team", titel: "Übersichtsseite", herkunft: team.belege.herkunft },
  { wo: "Mitarbeit", titel: "Seite", herkunft: mitarbeit.belege.herkunft },
  { wo: "Kontakt und Anfahrt", titel: "Seite", herkunft: kontakt.belege.herkunft },
  { wo: "Impressum", titel: "Seite", herkunft: impressum.belege.herkunft },
  { wo: "Datenschutzerklärung", titel: "Seite", herkunft: datenschutz.belege.herkunft },
  ...sprachseiten.map((s) => ({ wo: "Sprachfassung", titel: s.nameDeutsch, herkunft: s.belege.herkunft })),
];
for (const b of belege) for (const h of b.herkunft) if (!h.url && h.art !== "eigene-quelle" && h.art !== "redaktion") fehler.push(`${b.wo}, «${b.titel}»: Quelle «${h.quelle}» ohne Adresse`);
const offen = await offeneFreigaben(q);
if (live) fehler.push(...offen);
else if (offen.length) hinweise.push(`${offen.length} Punkte sind für die Demo belegt, aber noch nicht für den Produktivbetrieb freigegeben (Liste: npm run inhalt:pruefen -- --live).`);

for (const h of [...new Set(hinweise)]) console.log(`· ${h}`);
if (fehler.length) {
  console.error(`✗ ${fehler.length} Problem(e) in den Inhalten:\n` + [...new Set(fehler)].map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log(`✓ Inhalte (${inhaltsquelleName}) in Ordnung: ${deutscheTexte.length} deutsche und ${fremdsprachig.length} fremdsprachige Texte, ${linksListe.length} Links, ${personen.length} Personen, ${rechtsgebiete.length} Rechtsgebiete, ${sprachseiten.length} Sprachfassungen, ${Object.keys(verzeichnis).length} Bilder, ${belege.length} Belege${live ? ", alles freigegeben" : ""}.`);
