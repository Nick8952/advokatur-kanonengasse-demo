import "server-only";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient, type SanityClient } from "@sanity/client";
import { z } from "zod";
import { ankerVergeben } from "./text";
import {
  kanzleiSchema, kontaktSeiteSchema, mitarbeitSeiteSchema, personSchema, pruefen, rechtSeiteSchema, rechtsgebietSchema, rechtsgebieteSeiteSchema,
  sprachseiteSchema, startseiteSchema, teamSeiteSchema, texteSchema,
  type Bild, type Block, type Inhaltsquelle, type Inline,
} from "./modell";

/**
 * Sanity-Inhaltsquelle, VORBEREITET (es existiert noch kein Sanity-Projekt).
 *
 * Wird nur geladen, wenn CONTENT_SOURCE=sanity gesetzt ist. Sie liest beim Build die veröffentlichten Dokumente, überführt sie in das
 * Domainmodell (lib/content/modell.ts) und prüft sie gegen dieselben Schemas wie die lokalen Inhalte. Die Website bleibt ein statischer
 * Export: Änderungen in Sanity werden sichtbar, sobald ein neuer Build gelaufen ist (Webhook → Vercel-Deploy-Hook, docs/SANITY-VERCEL-EINRICHTUNG.md).
 *
 * Bilder kommen nicht vom Sanity-CDN, sondern aus einem lokalen Spiegel (scripts/sanity-bilder.mts), damit die Website weiterhin keine
 * Anfragen an Dritte auslöst. Dokumenttypen und Felder entsprechen studio/schemas/. Import: scripts/seed.mts.
 */
let client: SanityClient | null = null;
function sanity(): SanityClient {
  if (client) return client;
  const projectId = (process.env.SANITY_PROJECT_ID ?? "").trim();
  const dataset = (process.env.SANITY_DATASET ?? "").trim();
  if (!/^[a-z0-9]{8,}$/.test(projectId) || !dataset) {
    throw new Error("CONTENT_SOURCE=sanity verlangt SANITY_PROJECT_ID und SANITY_DATASET (siehe .env.example). Ohne diese Angaben baut die Website mit den lokalen Inhalten: CONTENT_SOURCE weglassen.");
  }
  const token = process.env.SANITY_API_READ_TOKEN?.trim() || undefined;
  client = createClient({ projectId, dataset, apiVersion: "2025-02-19", useCdn: false, perspective: "published", token });
  return client;
}

// ── Abfragen (GROQ) ────────────────────────────────────────────────────────
const BILD = `{ alt, legende, nachweis, "assetId": asset->_id, "url": asset->url, "breite": asset->metadata.dimensions.width, "hoehe": asset->metadata.dimensions.height }`;
const HERKUNFT = `herkunft[]{ quelle, url, abgerufen, art }`;
const BELEGE = `belege{ ${HERKUNFT}, freigabe }`;
const LINK = `{ text, ziel }`;
const UEBERSETZUNGEN = `uebersetzungen{ en{ titel, status }, fr{ titel, status }, it{ titel, status }, es{ titel, status }, ar{ titel, status } }`;
const ABFRAGEN = {
  kanzlei: `*[_type == "kanzlei"][0]{ name, kurzbeschreibung, besuchsadresse{ strasse, plz, ort, zusatz }, postadresse{ postfach, plz, ort }, telefon, email, telefonzeiten{ tage, zeiten, terminhinweis }, anfahrt, karten[]${LINK}, organisation, "logo": logo${BILD}, "foto": foto${BILD}, "seoBild": seoBild${BILD}, ${HERKUNFT}, "freigabe": coalesce(freigabe, "demo") }`,
  texte: `*[_type == "texte"][0]{ navigation[]${LINK}, sprachen[]{ code, name, nameDeutsch, gruss, lang, richtung }, kopf, ui{ ..., nichtGefundenLink${LINK} }, footer{ ..., rechtliches[]${LINK}, bildnachweis${LINK} }, formular{ ..., betreffOptionen[]{ wert, titel }, datenschutzLink${LINK} }, "einwilligung": { ...einwilligung, "kategorien": coalesce(einwilligung.kategorien[]{ kennung, titel, beschreibung }, []) }, seo, demoHinweis }`,
  startseite: `*[_type == "startseite"][0]{ hero, kanzlei, foto, erreichbarkeit, rechtsgebiete{ ..., link${LINK} }, team{ ..., link${LINK} }, mitarbeit{ titel, partnerschaft{ ..., link${LINK} }, stellen{ ..., link${LINK} } }, seoTitel, seoBeschreibung, ${BELEGE} }`,
  personen: `*[_type == "person"] | order(reihenfolge asc){ "slug": slug.current, vorname, nachname, rolle, berufsbezeichnung, gruppe, funktion, reihenfolge, sprachenOriginal, sprachen[]{ "name": sprache->name, zusatz }, rechtsgebieteTitel, rechtsgebiete[]{ text, "slug": gebiet->slug.current, fussnote }, "fussnoten": coalesce(fussnoten, []), telefon, telefonBezeichnung, email, werdegang, mitgliedschaftenTitel, "mitgliedschaften": coalesce(mitgliedschaften, []), "portrait": portrait${BILD}, "portraitQuadrat": portraitQuadrat${BILD}, seoBeschreibung, ${HERKUNFT}, "freigabe": coalesce(freigabe, "demo") }`,
  rechtsgebiete: `*[_type == "rechtsgebiet"] | order(reihenfolge asc){ "slug": slug.current, titel, zusatz, "schwerpunkt": coalesce(schwerpunkt, false), reihenfolge, "begriffe": coalesce(begriffe, []), "hintergrund": coalesce(hintergrund, []), ${UEBERSETZUNGEN}, ${HERKUNFT}, "freigabe": coalesce(freigabe, "demo") }`,
  rechtsgebieteSeite: `*[_type == "rechtsgebieteSeite"][0]{ titel, einleitung, weitereTitel, personenTitel, begriffeTitel, hintergrundTitel, hinweis, seoTitel, seoBeschreibung, ${BELEGE} }`,
  teamSeite: `*[_type == "teamSeite"][0]{ titel, einleitung, "gruppen": { "anwaeltinnen-und-anwaelte": gruppen.anwaeltinnenUndAnwaelte, "substitutinnen-und-substituten": gruppen.substitutinnenUndSubstituten, "sekretariat": gruppen.sekretariat }, filter, verlinkt{ titel, text, links[]{ name, beschreibung, ziel } }, profil, seoTitel, seoBeschreibung, ${BELEGE} }`,
  stellen: `*[_type == "stelle"] | order(titel asc){ "slug": slug.current, titel, status, veroeffentlichtAb, archiviertAb, stand, inhalt, bewerbung{ text, email, "person": person->slug.current } }`,
  mitarbeitSeite: `*[_type == "mitarbeitSeite"][0]{ titel, einleitung, stellenTitel, keineStellen, bewerbungTitel, standLabel, partnerschaft{ "slug": coalesce(slug.current, "partnerschaft"), titel, status, stand, inhalt, kontakteTitel, kontakte[]{ "person": person->slug.current, email, telefon } }, seoTitel, seoBeschreibung, ${BELEGE} }`,
  kontaktSeite: `*[_type == "kontaktSeite"][0]{ titel, einleitung, erreichbarkeitTitel, adresseTitel, anfahrtTitel, kartenHinweis, hinweis{ titel, text, zusatz }, formularTitel, seoTitel, seoBeschreibung, ${BELEGE} }`,
  rechtSeite: `*[_type == "rechtSeite" && slug.current == $slug][0]{ "slug": slug.current, titel, einleitung, stand, inhalt, seoTitel, seoBeschreibung, ${BELEGE} }`,
  sprachseiten: `*[_type == "sprachseite"]{ sprache, lang, richtung, name, nameDeutsch, gruss, titel, intro, seoTitel, seoBeschreibung, ui{ ..., navigation[]{ text, anker }, karten[]${LINK}, "gruppen": { "anwaeltinnen-und-anwaelte": gruppen.anwaeltinnenUndAnwaelte, "substitutinnen-und-substituten": gruppen.substitutinnenUndSubstituten, "sekretariat": gruppen.sekretariat } }, formular{ ..., betreffOptionen[]{ wert, titel } }, kapazitaetshinweis{ text, status }, ${BELEGE} }`,
} as const;

// ── Normalisierung ─────────────────────────────────────────────────────────
type RohBild = { assetId?: string | null; url?: string | null; breite?: number | null; hoehe?: number | null; alt?: string | null; legende?: string | null; nachweis?: Bild["nachweis"] | null };
type Varianten = Pick<Bild, "breite" | "hoehe" | "quellen">;
export type BildAufloeser = (roh: RohBild) => Varianten;
const BREITEN = [480, 960, 1600];

function istRohBild(w: unknown): w is RohBild {
  return typeof w === "object" && w !== null && "url" in w && "breite" in w && "hoehe" in w;
}

/** Varianten direkt vom Sanity-CDN. Nur für den Import-Trockenlauf (scripts/seed.mts), der keine Dateien braucht. */
export const ausCdn: BildAufloeser = (roh) => {
  const breite = roh.breite as number;
  const breiten = [...new Set(BREITEN.map((b) => Math.min(b, breite)))];
  const groesste = breiten[breiten.length - 1];
  return { breite: groesste, hoehe: Math.round((groesste / breite) * (roh.hoehe as number)), quellen: { avif: [], webp: breiten.map((b) => ({ breite: b, url: `${roh.url}?w=${b}&fm=webp&q=75` })) } };
};

/** Varianten aus dem lokalen Spiegel (`npm run sanity:bilder`, läuft vor jedem Build). */
let spiegel: Record<string, Varianten> | null = null;
const ausSpiegel: BildAufloeser = (roh) => {
  if (!spiegel) {
    const datei = path.join(process.cwd(), "data", "cms-bilder.json");
    if (!existsSync(datei)) throw new Error("data/cms-bilder.json fehlt: Die Bilder aus Sanity sind nicht gespiegelt. Vor dem Build «npm run sanity:bilder» ausführen (die Build-Befehle tun das selbst).");
    spiegel = JSON.parse(readFileSync(datei, "utf8")) as Record<string, Varianten>;
  }
  const eintrag = roh.assetId ? spiegel[roh.assetId] : undefined;
  if (!eintrag) throw new Error(`Bild ${roh.assetId ?? "(ohne Kennung)"} fehlt im Spiegel (data/cms-bilder.json): «npm run sanity:bilder» erneut ausführen.`);
  return eintrag;
};

function bild(roh: RohBild, aufloesen: BildAufloeser): Bild | undefined {
  if (!roh.url || !roh.breite || !roh.hoehe) return undefined;
  const id = (roh.assetId ?? "bild").replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-|-$/g, "") || "bild";
  return { id, alt: roh.alt ?? "", ...aufloesen(roh), legende: roh.legende ?? undefined, nachweis: { urheber: roh.nachweis?.urheber ?? "", ...(roh.nachweis?.titel ? { titel: roh.nachweis.titel } : {}), quelle: roh.nachweis?.quelle ?? "", lizenz: roh.nachweis?.lizenz ?? "", ...(roh.nachweis?.bearbeitung ? { bearbeitung: roh.nachweis.bearbeitung } : {}) } };
}

const SYSTEMFELDER = new Set(["_type", "_key", "_id", "_rev", "_createdAt", "_updatedAt", "_system", "_originalId"]);
/** Geht die Antwort rekursiv durch: wandelt Bilder um, entfernt null (GROQ liefert null, das Domainmodell kennt «fehlt» oder ausdrücklich null) und Sanity-Systemfelder. */
export function normalisieren(wert: unknown, aufloesen: BildAufloeser = ausCdn): unknown {
  if (wert === null) return undefined;
  if (Array.isArray(wert)) return wert.map((v) => normalisieren(v, aufloesen)).filter((v) => v !== undefined);
  if (istRohBild(wert)) return bild(wert, aufloesen);
  if (typeof wert === "object") {
    const t = (wert as { _type?: unknown })._type;
    if (t === "block" || t === "span") return wert; // Portable Text bleibt unverändert
    const aus: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(wert as Record<string, unknown>)) {
      if (SYSTEMFELDER.has(k)) continue;
      const n = normalisieren(v, aufloesen);
      if (n !== undefined) aus[k] = n;
    }
    return aus;
  }
  return wert;
}
/** Felder, die im Domainmodell ausdrücklich null sein dürfen: fehlende Werte aus Sanity werden zu null. */
const NULLBAR_PERSON = ["berufsbezeichnung", "rechtsgebieteTitel", "email", "mitgliedschaftenTitel"] as const;
function mitNull<T extends Record<string, unknown>>(o: T, felder: readonly string[]): T {
  const aus: Record<string, unknown> = { ...o };
  for (const f of felder) if (!(f in aus)) aus[f] = null;
  return aus as T;
}

// Portable Text (Sanity) → Fliesstext des Domainmodells
type PtSpan = { _type: "span"; text: string; marks?: string[] };
type PtBlock = { _type: string; style?: string; listItem?: string; children?: PtSpan[]; markDefs?: { _key: string; _type: string; href?: string }[] };

function inlineAusPt(b: PtBlock): Inline[] {
  return (b.children ?? []).filter((c) => c._type === "span" && c.text).map((c) => {
    const marks = c.marks ?? [];
    const link = b.markDefs?.find((d) => d._type === "link" && marks.includes(d._key))?.href;
    const fett = marks.includes("strong");
    const kursiv = marks.includes("em");
    if (!link && !fett && !kursiv) return c.text;
    return { text: c.text, ...(fett ? { fett: true } : {}), ...(kursiv ? { kursiv: true } : {}), ...(link ? { link } : {}) };
  });
}

/** Sanity-Fliesstext (Absätze, Zwischentitel h2 bis h4, Hinweise, Aufzählungen) → Blöcke; Sprungmarken wie lokal. */
export function portableTextZuBloecken(pt: PtBlock[]): Block[] {
  const bloecke: Block[] = [];
  for (const b of pt ?? []) {
    if (b._type !== "block") continue;
    const inhalt = inlineAusPt(b);
    if (!inhalt.length) continue;
    if (b.listItem) {
      const letzter = bloecke[bloecke.length - 1];
      if (letzter?.art === "liste") letzter.punkte.push(inhalt);
      else bloecke.push({ art: "liste", punkte: [inhalt] });
    } else if (b.style === "h2" || b.style === "h3" || b.style === "h4") {
      const text = inhalt.map((t) => (typeof t === "string" ? t : t.text)).join("");
      bloecke.push({ art: "titel", stufe: b.style === "h2" ? 2 : b.style === "h3" ? 3 : 4, text, anker: "x" });
    } else if (b.style === "hinweis") {
      bloecke.push({ art: "hinweis", inhalt });
    } else {
      bloecke.push({ art: "absatz", inhalt });
    }
  }
  return ankerVergeben(bloecke);
}

// ── Quelle ─────────────────────────────────────────────────────────────────
const zwischenspeicher = new Map<string, Promise<unknown>>();
function holen(name: keyof typeof ABFRAGEN, parameter: Record<string, string> = {}, listeErlaubtLeer = false): Promise<unknown> {
  const schluessel = `${name}:${JSON.stringify(parameter)}`;
  let p = zwischenspeicher.get(schluessel);
  if (!p) {
    p = sanity().fetch(ABFRAGEN[name], parameter).then((roh) => {
      if (roh === null && !listeErlaubtLeer) throw new Error(`Sanity: Dokument «${name}» fehlt oder ist nicht veröffentlicht (Import mit npm run seed, dann im Studio veröffentlichen).`);
      return normalisieren(roh ?? [], ausSpiegel);
    });
    zwischenspeicher.set(schluessel, p);
  }
  return p;
}

type Roh = Record<string, unknown>;
type MitInhalt = { inhalt?: PtBlock[] } & Roh;
function eindeutig<T extends { slug: string }>(liste: T[], wo: string): T[] {
  const gesehen = new Set<string>();
  for (const e of liste) {
    if (gesehen.has(e.slug)) throw new Error(`Sanity: ${wo}: Slug «${e.slug}» kommt doppelt vor (zwei veröffentlichte Dokumente). Eines umbenennen oder zurückziehen.`);
    gesehen.add(e.slug);
  }
  return liste;
}
const mitBloecken = (roh: MitInhalt) => {
  const { inhalt, ...rest } = roh;
  return { ...rest, bloecke: portableTextZuBloecken(inhalt ?? []) };
};
/** Stellen und Partnerschaft tragen nullbare Datums- und Standfelder. */
const stelleNormal = (s: Roh) => mitNull(mitBloecken(s as MitInhalt), ["veroeffentlichtAb", "archiviertAb", "stand"]);

export const sanityQuelle: Inhaltsquelle = {
  getKanzlei: async () => pruefen(kanzleiSchema, await holen("kanzlei"), "Sanity: Kanzlei"),
  getTexte: async () => pruefen(texteSchema, await holen("texte"), "Sanity: Texte"),
  getStartseite: async () => pruefen(startseiteSchema, await holen("startseite"), "Sanity: Startseite"),
  getPersonen: async () => eindeutig(pruefen(z.array(personSchema), ((await holen("personen", {}, true)) as Roh[]).map((p) => mitNull({ ...p, rechtsgebiete: ((p.rechtsgebiete as Roh[] | undefined) ?? []).map((r) => mitNull(r, ["slug"])) }, NULLBAR_PERSON)), "Sanity: Personen"), "Personen"),
  getPerson: async (slug) => (await sanityQuelle.getPersonen()).find((p) => p.slug === slug) ?? null,
  getRechtsgebiete: async () => eindeutig(pruefen(z.array(rechtsgebietSchema), ((await holen("rechtsgebiete", {}, true)) as Roh[]).map((r) => mitNull(r, ["zusatz"])), "Sanity: Rechtsgebiete"), "Rechtsgebiete"),
  getRechtsgebieteSeite: async () => pruefen(rechtsgebieteSeiteSchema, await holen("rechtsgebieteSeite"), "Sanity: Seite Rechtsgebiete"),
  getTeamSeite: async () => pruefen(teamSeiteSchema, await holen("teamSeite"), "Sanity: Seite Team"),
  getMitarbeitSeite: async () => {
    const seite = (await holen("mitarbeitSeite")) as Roh;
    const stellen = ((await holen("stellen", {}, true)) as Roh[]).map(stelleNormal);
    const partnerschaft = mitNull(mitBloecken(seite.partnerschaft as MitInhalt), ["stand"]);
    return pruefen(mitarbeitSeiteSchema, { ...seite, stellen, partnerschaft }, "Sanity: Seite Mitarbeit");
  },
  getKontaktSeite: async () => pruefen(kontaktSeiteSchema, await holen("kontaktSeite"), "Sanity: Seite Kontakt"),
  getRechtSeite: async (slug) => pruefen(rechtSeiteSchema, mitBloecken((await holen("rechtSeite", { slug })) as MitInhalt), `Sanity: Rechtsseite «${slug}»`),
  getSprachseiten: async () => {
    const liste = pruefen(z.array(sprachseiteSchema), await holen("sprachseiten", {}, true), "Sanity: Sprachseiten");
    const reihenfolge = ["en", "fr", "ar", "it", "es"];
    return [...liste].sort((a, b) => reihenfolge.indexOf(a.sprache) - reihenfolge.indexOf(b.sprache));
  },
  getSprachseite: async (code) => (await sanityQuelle.getSprachseiten()).find((s) => s.sprache === code) ?? null,
  getBildnachweise: async () => {
    const [k, personen] = await Promise.all([sanityQuelle.getKanzlei(), sanityQuelle.getPersonen()]);
    const bilder: Bild[] = [k.logo, k.foto, k.seoBild, ...personen.flatMap((p) => [p.portrait, p.portraitQuadrat])];
    const gesehen = new Set<string>();
    return bilder.filter((b) => (gesehen.has(b.nachweis.quelle) ? false : (gesehen.add(b.nachweis.quelle), true))).map((b) => ({ titel: b.nachweis.titel ?? b.legende ?? b.alt, urheber: b.nachweis.urheber, quelle: b.nachweis.quelle, lizenz: b.nachweis.lizenz }));
  },
};
