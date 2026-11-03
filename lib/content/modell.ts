import { z } from "zod";
import { istErlaubtesLinkziel, istHttpsAdresse } from "../assets";
import { SPRACHCODES } from "./pfade";

/**
 * EIN Domainmodell für beide Inhaltsquellen (data/*.json heute, Sanity später). Alle Schemas sind strikt: ein unbekanntes
 * oder falsch geschriebenes Feld bricht den Build ab. Feldnamen hier = Feldnamen in Sanity (studio/schemas) = Felder im Import (scripts/seed.mts).
 *
 * Grundsatz der Inhalte: Nur, was auf der bisherigen Website der Kanzlei steht oder amtlich belegt ist. Jedes Dokument trägt deshalb
 * `herkunft` (Quelle, Adresse, Abrufdatum, Art) und `freigabe` («demo» = für die Verkaufs-Demo belegt, «live» = von der Kanzlei freigegeben).
 */
export { SPRACHCODES };
export const sprachcodeSchema = z.enum(SPRACHCODES);
export type Sprachcode = z.infer<typeof sprachcodeSchema>;

const kurz = z.string().trim().min(1).max(240);
const text = z.string().trim().min(1);
const datum = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum als JJJJ-MM-TT");
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: Kleinbuchstaben, Ziffern, Bindestriche");
const https = z.string().refine(istHttpsAdresse, "muss eine https-Adresse ohne Benutzerangaben sein");
const linkziel = z.string().refine(istErlaubtesLinkziel, "Linkziel nicht erlaubt (nur interne Pfade, Sprungmarken, https, mailto, tel)");
const telefon = z.string().regex(/^\+41 \d{2} \d{3} \d{2} \d{2}$/, "Telefon im Format +41 43 322 12 12");
const email = z.string().regex(/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i, "E-Mail-Adresse");

export const herkunftSchema = z.strictObject({
  quelle: kurz,
  url: https.optional(),
  abgerufen: datum,
  /** bisherige-website: kanonengasse.ch · amtlich: Behörde (geo.admin.ch, Zefix) · eigene-quelle: Bestätigung der Kanzlei · redaktion: Formulierung der Demo ohne neuen Sachverhalt */
  art: z.enum(["bisherige-website", "amtlich", "eigene-quelle", "redaktion"]),
});
export type Herkunft = z.infer<typeof herkunftSchema>;
export const freigabeSchema = z.enum(["demo", "live"]);
export const belegeSchema = z.strictObject({ herkunft: z.array(herkunftSchema).min(1), freigabe: freigabeSchema });
export type Belege = z.infer<typeof belegeSchema>;

const variante = z.strictObject({ breite: z.number().int().positive(), url: z.string().regex(/^(\/bilder\/[\w./-]+|https:\/\/cdn\.sanity\.io\/[\w./%?=&-]+)$/) });
export const bildSchema = z.strictObject({
  id: slug,
  /** leer "" nur für rein dekorative Wiederholungen; sonst beschreibt der Text, was zu sehen ist */
  alt: z.string(),
  breite: z.number().int().positive(),
  hoehe: z.number().int().positive(),
  legende: kurz.optional(),
  quellen: z.strictObject({ avif: z.array(variante), webp: z.array(variante).min(1) }),
  nachweis: z.strictObject({ urheber: kurz, quelle: kurz, lizenz: kurz, titel: kurz.optional(), bearbeitung: kurz.optional() }),
});
export type Bild = z.infer<typeof bildSchema>;

export const linkSchema = z.strictObject({ text: kurz, ziel: linkziel });
export type Link = z.infer<typeof linkSchema>;

// ── Fliesstext ──────────────────────────────────────────────────────────────
export const inlineSchema = z.union([
  z.string(),
  z.strictObject({ text: z.string(), fett: z.boolean().optional(), kursiv: z.boolean().optional(), link: linkziel.optional() }),
]);
export type Inline = z.infer<typeof inlineSchema>;
export const blockSchema = z.discriminatedUnion("art", [
  z.strictObject({ art: z.literal("titel"), stufe: z.union([z.literal(2), z.literal(3), z.literal(4)]), text: kurz, anker: slug }),
  z.strictObject({ art: z.literal("absatz"), inhalt: z.array(inlineSchema).min(1) }),
  z.strictObject({ art: z.literal("liste"), punkte: z.array(z.array(inlineSchema).min(1)).min(1) }),
  z.strictObject({ art: z.literal("hinweis"), inhalt: z.array(inlineSchema).min(1) }),
]);
export type Block = z.infer<typeof blockSchema>;

// ── Kanzlei ─────────────────────────────────────────────────────────────────
export const kanzleiSchema = z.strictObject({
  name: kurz,
  kurzbeschreibung: kurz,
  besuchsadresse: z.strictObject({ strasse: kurz, plz: z.string().regex(/^\d{4}$/), ort: kurz, zusatz: kurz }),
  postadresse: z.strictObject({ postfach: kurz, plz: z.string().regex(/^\d{4}$/), ort: kurz }),
  telefon,
  email,
  telefonzeiten: z.strictObject({ tage: kurz, zeiten: z.array(kurz).min(1).max(3), terminhinweis: kurz }),
  anfahrt: z.array(kurz).min(1),
  karten: z.array(z.strictObject({ text: kurz, ziel: https })).min(1),
  organisation: text,
  logo: bildSchema,
  foto: bildSchema,
  seoBild: bildSchema,
  herkunft: z.array(herkunftSchema).min(1),
  freigabe: freigabeSchema,
});
export type Kanzlei = z.infer<typeof kanzleiSchema>;

// ── Personen ────────────────────────────────────────────────────────────────
export const GRUPPEN = ["anwaeltinnen-und-anwaelte", "substitutinnen-und-substituten", "sekretariat"] as const;
export const gruppeSchema = z.enum(GRUPPEN);
export type Gruppe = z.infer<typeof gruppeSchema>;
export const funktionSchema = z.enum(["partnerin", "partner", "associate", "substitutin", "substitut", "leitung-sekretariat"]);

export const personSchema = z.strictObject({
  slug,
  vorname: kurz,
  nachname: kurz,
  /** Berufsbezeichnung, Titel und Funktion im Wortlaut der bisherigen Website, zum Beispiel «Rechtsanwalt, lic. iur., Partner» */
  rolle: kurz,
  /** Nur gesetzt, wenn die Quelle die Person als Rechtsanwältin oder Rechtsanwalt bezeichnet */
  berufsbezeichnung: z.enum(["Rechtsanwältin", "Rechtsanwalt"]).nullable(),
  gruppe: gruppeSchema,
  funktion: funktionSchema,
  reihenfolge: z.number().int().positive(),
  sprachenOriginal: kurz,
  sprachen: z.array(z.strictObject({ name: kurz, zusatz: kurz.optional() })).min(1),
  /** Zwischentitel der Quelle («Bevorzugte Rechtsgebiete» oder «Rechtsgebiete»); null, wenn das Profil keine nennt */
  rechtsgebieteTitel: kurz.nullable(),
  rechtsgebiete: z.array(z.strictObject({ text: kurz, slug: slug.nullable(), fussnote: z.number().int().positive().optional() })),
  fussnoten: z.array(kurz),
  telefon,
  telefonBezeichnung: z.enum(["Telefon direkt", "Telefon"]),
  email: email.nullable(),
  werdegang: z.array(text).min(1),
  mitgliedschaftenTitel: kurz.nullable(),
  mitgliedschaften: z.array(kurz),
  portrait: bildSchema,
  portraitQuadrat: bildSchema,
  seoBeschreibung: z.string().min(50).max(170),
  herkunft: z.array(herkunftSchema).min(1),
  freigabe: freigabeSchema,
});
export type Person = z.infer<typeof personSchema>;

// ── Rechtsgebiete ───────────────────────────────────────────────────────────
export const uebersetzungSchema = z.strictObject({ titel: kurz, status: z.enum(["entwurf", "freigegeben"]) });
export const rechtsgebietSchema = z.strictObject({
  slug,
  titel: kurz,
  zusatz: kurz.nullable(),
  /** Auf der Partnerschaftsseite als Spezialisierung genannt (Migrationsrecht, Straf-, Familien-, Mietrecht) */
  schwerpunkt: z.boolean(),
  reihenfolge: z.number().int().positive(),
  /** Begriffe aus den Profilen im Wortlaut */
  begriffe: z.array(kurz),
  /** Belegte Hintergründe aus den Lebensläufen (keine Leistungsversprechen) */
  hintergrund: z.array(text),
  uebersetzungen: z.strictObject({ en: uebersetzungSchema, fr: uebersetzungSchema, it: uebersetzungSchema, es: uebersetzungSchema, ar: uebersetzungSchema }),
  herkunft: z.array(herkunftSchema).min(1),
  freigabe: freigabeSchema,
});
export type Rechtsgebiet = z.infer<typeof rechtsgebietSchema>;

// ── Startseite ──────────────────────────────────────────────────────────────
export const startseiteSchema = z.strictObject({
  hero: z.strictObject({ titel: kurz, text: text, sprachwahlTitel: kurz }),
  kanzlei: z.strictObject({ titel: kurz, absaetze: z.array(text).min(1) }),
  foto: z.strictObject({ legende: kurz }),
  erreichbarkeit: z.strictObject({ titel: kurz }),
  rechtsgebiete: z.strictObject({ titel: kurz, text: text, link: linkSchema }),
  team: z.strictObject({ titel: kurz, text: text, link: linkSchema }),
  mitarbeit: z.strictObject({ titel: kurz, partnerschaft: z.strictObject({ titel: kurz, text: text, link: linkSchema }), stellen: z.strictObject({ titel: kurz, text: text, link: linkSchema }) }),
  seoTitel: kurz,
  seoBeschreibung: z.string().min(50).max(170),
  belege: belegeSchema,
});
export type Startseite = z.infer<typeof startseiteSchema>;

// ── Seiten ──────────────────────────────────────────────────────────────────
export const rechtsgebieteSeiteSchema = z.strictObject({
  titel: kurz,
  einleitung: z.array(text).min(1),
  weitereTitel: kurz,
  personenTitel: kurz,
  begriffeTitel: kurz,
  hintergrundTitel: kurz,
  hinweis: text,
  seoTitel: kurz,
  seoBeschreibung: z.string().min(50).max(170),
  belege: belegeSchema,
});
export type RechtsgebieteSeite = z.infer<typeof rechtsgebieteSeiteSchema>;

export const teamSeiteSchema = z.strictObject({
  titel: kurz,
  einleitung: text,
  gruppen: z.strictObject({ "anwaeltinnen-und-anwaelte": kurz, "substitutinnen-und-substituten": kurz, sekretariat: kurz }),
  filter: z.strictObject({ titel: kurz, rechtsgebiet: kurz, sprache: kurz, alle: kurz, zuruecksetzen: kurz, treffer: kurz, keineTreffer: kurz, hinweis: text }),
  verlinkt: z.strictObject({ titel: kurz, text: text, links: z.array(z.strictObject({ name: kurz, beschreibung: kurz, ziel: https })).min(1) }),
  profil: z.strictObject({ zurueck: kurz, funktion: kurz, sprachen: kurz, telefon: kurz, email: kurz, werdegang: kurz, fussnotenTitel: kurz, keineRechtsgebiete: kurz }),
  seoTitel: kurz,
  seoBeschreibung: z.string().min(50).max(170),
  belege: belegeSchema,
});
export type TeamSeite = z.infer<typeof teamSeiteSchema>;

export const stelleSchema = z.strictObject({
  slug,
  titel: kurz,
  /** Redaktioneller Ablauf: entwurf (unsichtbar) → veroeffentlicht → archiviert (unsichtbar, bleibt im CMS) */
  status: z.enum(["entwurf", "veroeffentlicht", "archiviert"]),
  veroeffentlichtAb: datum.nullable(),
  archiviertAb: datum.nullable(),
  /** Stand der Angaben laut Quelle, als lesbarer Text; wird sichtbar angezeigt */
  stand: kurz.nullable(),
  bloecke: z.array(blockSchema).min(1),
  bewerbung: z.strictObject({ text: text, email, person: slug }),
});
export type Stelle = z.infer<typeof stelleSchema>;

export const mitarbeitSeiteSchema = z.strictObject({
  titel: kurz,
  einleitung: text,
  stellenTitel: kurz,
  keineStellen: text,
  bewerbungTitel: kurz,
  standLabel: kurz,
  stellen: z.array(stelleSchema),
  partnerschaft: z.strictObject({
    slug,
    titel: kurz,
    status: z.enum(["entwurf", "veroeffentlicht", "archiviert"]),
    stand: kurz.nullable(),
    bloecke: z.array(blockSchema).min(1),
    kontakteTitel: kurz,
    kontakte: z.array(z.strictObject({ person: slug, email, telefon })).min(1),
  }),
  seoTitel: kurz,
  seoBeschreibung: z.string().min(50).max(170),
  belege: belegeSchema,
});
export type MitarbeitSeite = z.infer<typeof mitarbeitSeiteSchema>;

export const kontaktSeiteSchema = z.strictObject({
  titel: kurz,
  einleitung: text,
  erreichbarkeitTitel: kurz,
  adresseTitel: kurz,
  anfahrtTitel: kurz,
  kartenHinweis: kurz,
  hinweis: z.strictObject({ titel: kurz, text: text, zusatz: text }),
  formularTitel: kurz,
  seoTitel: kurz,
  seoBeschreibung: z.string().min(50).max(170),
  belege: belegeSchema,
});
export type KontaktSeite = z.infer<typeof kontaktSeiteSchema>;

export const rechtSeiteSchema = z.strictObject({
  slug: z.enum(["impressum", "datenschutz"]),
  titel: kurz,
  einleitung: text.optional(),
  stand: kurz,
  bloecke: z.array(blockSchema).min(1),
  seoTitel: kurz,
  seoBeschreibung: z.string().min(50).max(170),
  belege: belegeSchema,
});
export type RechtSeite = z.infer<typeof rechtSeiteSchema>;

// ── Sprachfassungen (en, fr, it, es, ar) ────────────────────────────────────
export const sprachseiteSchema = z.strictObject({
  sprache: z.enum(["en", "fr", "it", "es", "ar"]),
  lang: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/),
  richtung: z.enum(["ltr", "rtl"]),
  name: kurz,
  nameDeutsch: kurz,
  gruss: kurz,
  titel: kurz,
  intro: z.array(text).min(1),
  seoTitel: kurz,
  seoBeschreibung: z.string().min(50).max(170),
  ui: z.strictObject({
    navigation: z.array(z.strictObject({ text: kurz, anker: z.enum(["kanzlei", "rechtsgebiete", "team", "kontakt"]) })).length(4),
    sprache: kurz, spracheWaehlen: kurz, zumInhalt: kurz, zurStartseite: kurz,
    telefonzeiten: kurz, tage: kurz, zeiten: z.array(kurz).min(1).max(3), terminhinweis: kurz,
    besuchsadresse: kurz, postadresse: kurz, stockwerk: kurz, telefon: kurz, email: kurz, anrufen: kurz,
    anfahrt: kurz, anfahrtPunkte: z.array(kurz).min(1), karte: kurz, karten: z.array(z.strictObject({ text: kurz, ziel: https })).min(1),
    rechtsgebieteTitel: kurz, rechtsgebieteText: text, teamTitel: kurz, teamText: text, nurDeutsch: kurz, zurDeutschenWebsite: kurz,
    kontaktTitel: kurz, hinweisTitel: kurz, impressum: kurz, datenschutz: kurz, demoHinweis: text, oeffnetNeuesFenster: kurz, gesprocheneSprachen: kurz,
    uebersetzungshinweis: text,
  }),
  formular: z.strictObject({
    titel: kurz, einleitung: text, keineVertraulich: text, name: kurz, email: kurz, telefon: kurz, telefonHilfe: kurz, betreff: kurz,
    betreffOptionen: z.array(z.strictObject({ wert: slug, titel: kurz })).min(2), betreffPraefix: kurz, nachricht: kurz, nachrichtHilfe: kurz, pflicht: kurz,
    absenden: kurz, hinweisNachher: text, fehlerName: kurz, fehlerEmail: kurz, fehlerNachricht: kurz, kopieren: kurz, kopiert: kurz, kopierenFehler: kurz,
    zuLangFehler: text, volltextLabel: kurz, ohneJavascript: kurz, datenschutzHinweis: kurz, datenschutzLink: kurz,
  }),
  kapazitaetshinweis: z.strictObject({ text: text, status: z.enum(["quelle", "entwurf"]) }),
  belege: belegeSchema,
});
export type Sprachseite = z.infer<typeof sprachseiteSchema>;

// ── Texte (deutsche Oberfläche) ─────────────────────────────────────────────
export const texteSchema = z.strictObject({
  navigation: z.array(linkSchema).min(2).max(6),
  sprachen: z.array(z.strictObject({ code: sprachcodeSchema, name: kurz, nameDeutsch: kurz, gruss: kurz, lang: z.string(), richtung: z.enum(["ltr", "rtl"]) })).length(6),
  kopf: z.strictObject({ logoAlt: kurz, zurStartseite: kurz, sprache: kurz, spracheWaehlen: kurz, aktuelleSprache: kurz, anrufen: kurz, navigationLabel: kurz, sprachenLabel: kurz }),
  ui: z.strictObject({
    zumInhalt: kurz, oeffnetNeuesFenster: kurz, telefonzeiten: kurz, terminhinweis: kurz, besuchsadresse: kurz, postadresse: kurz, telefon: kurz, email: kurz,
    anrufen: kurz, kontaktAufnehmen: kurz, mehr: kurz, nurDeutsch: kurz, personenLabel: kurz, nichtGefundenTitel: kurz, nichtGefundenText: text, nichtGefundenLink: linkSchema,
    schliessen: kurz, stand: kurz, kapazitaetshinweisTitel: kurz, entwurf: kurz,
  }),
  footer: z.strictObject({ kontaktTitel: kurz, sprachenTitel: kurz, seitenTitel: kurz, rechtliches: z.array(linkSchema).min(2), einstellungen: kurz, bildnachweis: linkSchema, demoHinweis: text, copyright: kurz }),
  formular: z.strictObject({
    titel: kurz, einleitung: text, keineVertraulich: text, name: kurz, email: kurz, telefon: kurz, telefonHilfe: kurz, betreff: kurz,
    betreffOptionen: z.array(z.strictObject({ wert: slug, titel: kurz })).min(2), betreffPraefix: kurz, nachricht: kurz, nachrichtHilfe: kurz, pflicht: kurz,
    absenden: kurz, hinweisNachher: text, fehlerName: kurz, fehlerEmail: kurz, fehlerNachricht: kurz, kopieren: kurz, kopiert: kurz, kopierenFehler: kurz,
    zuLangFehler: text, volltextLabel: kurz, ohneJavascript: kurz, datenschutzHinweis: kurz, datenschutzLink: linkSchema,
  }),
  einwilligung: z.strictObject({
    bannerTitel: kurz, bannerText: text, alleAkzeptieren: kurz, nurNotwendige: kurz, einstellungen: kurz, auswahlSpeichern: kurz, widerrufen: kurz,
    notwendigTitel: kurz, notwendigText: text, ruhendTitel: kurz, ruhendText: text, datenschutzerklaerung: kurz,
    kategorien: z.array(z.strictObject({ kennung: slug, titel: kurz, beschreibung: text })),
  }),
  seo: z.strictObject({ titelZusatz: kurz, beschreibung: z.string().min(50).max(170) }),
  demoHinweis: text,
});
export type Texte = z.infer<typeof texteSchema>;

export type Bildnachweis = { titel: string; urheber: string; quelle: string; lizenz: string };

/** Was Seiten und Layout von der Inhaltsquelle brauchen. Lokal (data/*.json) und Sanity liefern dieselbe Schnittstelle. */
export interface Inhaltsquelle {
  getKanzlei(): Promise<Kanzlei>;
  getTexte(): Promise<Texte>;
  getStartseite(): Promise<Startseite>;
  getPersonen(): Promise<Person[]>;
  getPerson(slug: string): Promise<Person | null>;
  getRechtsgebiete(): Promise<Rechtsgebiet[]>;
  getRechtsgebieteSeite(): Promise<RechtsgebieteSeite>;
  getTeamSeite(): Promise<TeamSeite>;
  getMitarbeitSeite(): Promise<MitarbeitSeite>;
  getKontaktSeite(): Promise<KontaktSeite>;
  getRechtSeite(slug: "impressum" | "datenschutz"): Promise<RechtSeite>;
  getSprachseiten(): Promise<Sprachseite[]>;
  getSprachseite(code: Sprachseite["sprache"]): Promise<Sprachseite | null>;
  getBildnachweise(): Promise<Bildnachweis[]>;
}

/** Prüft Rohdaten gegen ein Schema und nennt im Fehlerfall Datei und Feldpfad. */
export function pruefen<T extends z.ZodTypeAny>(schema: T, daten: unknown, wo: string): z.infer<T> {
  const ergebnis = schema.safeParse(daten);
  if (!ergebnis.success) {
    const zeilen = ergebnis.error.issues.map((i) => `  - ${i.path.join(".") || "(Wurzel)"}: ${i.message}`);
    throw new Error(`Inhalt «${wo}» entspricht nicht dem Modell:\n${zeilen.join("\n")}`);
  }
  return ergebnis.data;
}
