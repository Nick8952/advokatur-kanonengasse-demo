import "server-only";
import type { Inhaltsquelle } from "./modell";
import { indexierungErlaubt, indexierungProbe } from "../deploy-ziel";
import { offeneFreigaben } from "./freigabe";
import { pfade, SPRACHCODES } from "./pfade";

export * from "./modell";
export { pfade };

/**
 * Auswahl der Inhaltsquelle.
 * - Standard (keine Env-Variablen): lokale JSON-Dateien → GitHub-Pages-Demo.
 * - CONTENT_SOURCE=sanity: Sanity. Fehlen Projekt-ID oder Dataset, bricht der Build mit einer klaren Meldung ab; bewusst kein stiller Rückfall.
 * Die Sanity-Quelle wird erst im gewählten Zweig geladen, damit die Demo ohne Sanity-Konfiguration baut.
 */
const quelleRoh = (process.env.CONTENT_SOURCE ?? "").trim();
if (quelleRoh && quelleRoh !== "sanity" && quelleRoh !== "lokal") {
  throw new Error(`CONTENT_SOURCE=«${quelleRoh}» ist unbekannt. Erlaubt: leer/«lokal» (data/*.json) oder «sanity».`);
}

async function laden(): Promise<Inhaltsquelle> {
  if (quelleRoh === "sanity") {
    const { sanityQuelle } = await import("./sanity");
    return sanityQuelle;
  }
  const { lokaleQuelle } = await import("./local");
  return lokaleQuelle;
}

/**
 * Invarianten, die für beide Inhaltsquellen gelten und mehrere Dokumente betreffen: Navigation und Links zeigen nur auf Seiten, die es
 * gibt; jede Person hat genau eine Gruppe und jedes zugeordnete Rechtsgebiet existiert; alle sechs Sprachen sind vorhanden und die
 * Sprachseiten passen zur Sprachliste; Kontakte der Mitarbeitseite sind bekannte Personen. Bricht den Build mit klarer Meldung ab.
 */
export async function invariantenPruefen(q: Inhaltsquelle): Promise<void> {
  const [t, start, personen, rechtsgebiete, team, mitarbeit, sprachseiten] = await Promise.all([q.getTexte(), q.getStartseite(), q.getPersonen(), q.getRechtsgebiete(), q.getTeamSeite(), q.getMitarbeitSeite(), q.getSprachseiten()]);
  const fehler: string[] = [];
  const seiten = new Set<string>([pfade.start, pfade.rechtsgebiete, pfade.team, pfade.mitarbeit, pfade.kontakt, pfade.impressum, pfade.datenschutz, ...personen.map((p) => pfade.person(p.slug)), ...SPRACHCODES.map((c) => pfade.sprache(c))]);
  const anker = new Map<string, Set<string>>([
    [pfade.rechtsgebiete, new Set(rechtsgebiete.map((r) => r.slug))],
    [pfade.mitarbeit, new Set(["offene-stellen", "partnerschaft", ...mitarbeit.stellen.map((s) => s.slug)])],
    [pfade.impressum, new Set(["bildnachweis"])],
  ]);
  const links = [...t.navigation, ...t.footer.rechtliches, t.footer.bildnachweis, t.ui.nichtGefundenLink, t.formular.datenschutzLink, start.rechtsgebiete.link, start.team.link, start.mitarbeit.partnerschaft.link, start.mitarbeit.stellen.link];
  for (const l of links) {
    if (!l.ziel.startsWith("/")) continue;
    const [seite, marke] = l.ziel.split("#");
    if (!seiten.has(seite)) fehler.push(`Link «${l.text}» zeigt auf eine Seite, die es nicht gibt: ${l.ziel}`);
    else if (marke && !anker.get(seite)?.has(marke)) fehler.push(`Link «${l.text}» zeigt auf eine Sprungmarke, die es nicht gibt: ${l.ziel}`);
  }
  if (t.navigation[0]?.ziel !== "/") fehler.push("Die Navigation muss mit der Startseite «/» beginnen.");
  if (new Set(t.navigation.map((n) => n.ziel)).size !== t.navigation.length) fehler.push("Die Navigation enthält ein Ziel doppelt.");
  const gebiete = new Set(rechtsgebiete.map((r) => r.slug));
  for (const p of personen) {
    for (const r of p.rechtsgebiete) if (r.slug && !gebiete.has(r.slug)) fehler.push(`Profil ${p.slug}: Rechtsgebiet «${r.slug}» gibt es nicht in der Liste der Rechtsgebiete`);
    for (const r of p.rechtsgebiete) if (r.fussnote && !p.fussnoten[r.fussnote - 1]) fehler.push(`Profil ${p.slug}: Fussnote ${r.fussnote} fehlt`);
    if (p.gruppe === "anwaeltinnen-und-anwaelte" && p.rechtsgebiete.length === 0) fehler.push(`Profil ${p.slug}: Anwältinnen und Anwälte brauchen mindestens ein Rechtsgebiet aus der Quelle`);
    // Die erste Gruppe heisst «Partnerinnen und Partner, Rechtsanwältinnen und Rechtsanwälte»: Wer keine Schweizer Anwaltsbezeichnung trägt,
    // darf dort nur als Partnerin oder Partner stehen (Tarig Hassan: lic. iur., LL. M., Partner).
    if (p.gruppe === "anwaeltinnen-und-anwaelte" && !p.berufsbezeichnung && !/^partner/.test(p.funktion)) fehler.push(`Profil ${p.slug}: ohne Anwaltsbezeichnung nur als Partnerin oder Partner in der ersten Gruppe zulässig`);
    if (p.gruppe !== "anwaeltinnen-und-anwaelte" && p.berufsbezeichnung) fehler.push(`Profil ${p.slug}: Rechtsanwältin oder Rechtsanwalt gehört in die erste Gruppe`);
    if (p.berufsbezeichnung && !p.rolle.startsWith(p.berufsbezeichnung)) fehler.push(`Profil ${p.slug}: Berufsbezeichnung «${p.berufsbezeichnung}» steht nicht am Anfang der Rolle «${p.rolle}»`);
    if (!p.berufsbezeichnung && /Rechtsanw/.test(p.rolle)) fehler.push(`Profil ${p.slug}: Rolle nennt eine Rechtsanwältin oder einen Rechtsanwalt, berufsbezeichnung ist aber leer`);
  }
  const personenSlugs = new Set(personen.map((p) => p.slug));
  for (const s of mitarbeit.stellen) if (!personenSlugs.has(s.bewerbung.person)) fehler.push(`Stelle «${s.slug}»: Kontaktperson ${s.bewerbung.person} unbekannt`);
  for (const k of mitarbeit.partnerschaft.kontakte) {
    const p = personen.find((x) => x.slug === k.person);
    if (!p) fehler.push(`Partnerschaft: Kontaktperson ${k.person} unbekannt`);
    else if (p.email !== k.email || p.telefon !== k.telefon) fehler.push(`Partnerschaft: Kontaktangaben von ${k.person} weichen vom Profil ab`);
  }
  for (const g of Object.keys(team.gruppen)) if (!personen.some((p) => p.gruppe === g)) fehler.push(`Teamgruppe «${g}» ist leer`);
  const codes = t.sprachen.map((s) => s.code);
  if (codes.join(",") !== "de,en,fr,ar,it,es") fehler.push(`Sprachliste muss de, en, fr, ar, it, es in dieser Reihenfolge enthalten (ist: ${codes.join(",")})`);
  if (sprachseiten.length !== 5) fehler.push(`Es müssen genau fünf Sprachseiten geben (en, fr, it, es, ar), gefunden: ${sprachseiten.length}`);
  if (new Set(sprachseiten.map((x) => x.sprache)).size !== sprachseiten.length) fehler.push("Sprachseiten: ein Sprachcode kommt doppelt vor (zwei veröffentlichte Dokumente)");
  for (const s of t.sprachen) {
    if (s.code === "de") continue;
    const seite = sprachseiten.find((x) => x.sprache === s.code);
    if (!seite) { fehler.push(`Sprachseite für «${s.code}» fehlt`); continue; }
    if (seite.name !== s.name || seite.gruss !== s.gruss || seite.richtung !== s.richtung || seite.lang !== s.lang) fehler.push(`Sprachseite «${s.code}»: Name, Gruss, Richtung oder lang weichen von texte.sprachen ab`);
  }
  if (fehler.length) throw new Error(`Inhalte verletzen Invarianten:\n${fehler.map((f) => `  - ${f}`).join("\n")}`);
}

let invariantenGeprueft: Promise<void> | null = null;
let freigabeGeprueft: Promise<void> | null = null;
/**
 * Die Inhaltsquelle des Builds. Ist die Indexierung für eine echte Domain eingeschaltet (INDEXIERUNG=1), bricht der erste Zugriff ab,
 * solange Angaben nicht freigegeben sind oder die Rechtstexte noch die Demo beschreiben. Ausgenommen ist nur der Probe-Build für eine
 * reservierte Testdomain (siehe lib/deploy-ziel.ts).
 */
export async function inhaltsquelle(): Promise<Inhaltsquelle> {
  const q = await laden();
  invariantenGeprueft ??= invariantenPruefen(q);
  await invariantenGeprueft;
  if (indexierungErlaubt && !indexierungProbe) {
    freigabeGeprueft ??= offeneFreigaben(q).then((offen) => {
      if (offen.length) throw new Error(`INDEXIERUNG=1 ist gesetzt, aber ${offen.length} Punkt(e) sind nicht freigegeben:\n${offen.map((o) => `  - ${o}`).join("\n")}\nErst klären (docs/UEBERGABE.md), dann indexieren.`);
    });
    await freigabeGeprueft;
  }
  return q;
}

export const inhaltsquelleName = quelleRoh === "sanity" ? "sanity" : "lokal";
