import { defineArrayMember, defineField, defineType } from "sanity";
import { freigabeFeld, fremdtext, schreibweise, seoFelder, seoGruppe, telefonFormat, text, textOptional, zeilenFeld } from "./objekte";

const reihenfolge = defineField({ name: "reihenfolge", title: "Reihenfolge", type: "number", description: "Kleinere Zahlen stehen weiter vorne.", initialValue: 100, validation: (r) => r.required().integer().positive() });
const slug = (quelle: string) =>
  defineField({ name: "slug", title: "Adresse (letzter Teil)", type: "slug", description: "Wird aus dem Namen erzeugt. Nach der Veröffentlichung nicht mehr ändern, sonst brechen bestehende Links.", options: { source: quelle, maxLength: 80 }, validation: (r) => r.required() });
const herkunftFeld = (titel = "Quellen") => defineField({ name: "herkunft", title: titel, type: "array", of: [defineArrayMember({ type: "herkunft" })], validation: (r) => r.required().min(1).error("Mindestens eine Quelle angeben.") });
const verweisFeld = (name: string, title: string) => defineField({ name, title, type: "verweis", validation: (r) => r.required() });
const belegeFeld = defineField({ name: "belege", title: "Belege für die Texte dieser Seite", type: "belege", group: "inhalt", validation: (r) => r.required() });
const statusFeld = defineField({
  name: "status", title: "Status", type: "string",
  description: "Entwurf: unsichtbar. Veröffentlicht: auf der Website. Archiviert: unsichtbar, bleibt hier dokumentiert. Nach jeder Änderung des Status einen neuen Build auslösen (docs/INHALTE-PFLEGEN.md).",
  options: { list: [{ title: "Entwurf", value: "entwurf" }, { title: "Veröffentlicht", value: "veroeffentlicht" }, { title: "Archiviert", value: "archiviert" }], layout: "radio" }, initialValue: "entwurf", validation: (r) => r.required(),
});

// ── Kanzlei ────────────────────────────────────────────────────────────────
export const kanzlei = defineType({
  name: "kanzlei",
  title: "Kanzlei, Adressen, Telefonzeiten",
  type: "document",
  groups: [{ name: "kanzlei", title: "Kanzlei", default: true }, { name: "kontakt", title: "Adressen und Kontakt" }, { name: "bilder", title: "Wortmarke und Bilder" }, { name: "quellen", title: "Quellen" }],
  fields: [
    { ...text("name", "Name der Kanzlei", "Erscheint im Browser-Tab und in der Fusszeile, zum Beispiel «advokatur kanonengasse»."), group: "kanzlei" },
    { ...text("kurzbeschreibung", "Kurzbeschreibung", "Ein paar Wörter, zum Beispiel «Anwaltskanzlei im Zürcher Kreis 4»."), group: "kanzlei" },
    { ...text("organisation", "Organisationsform", "Satz zur Bürogemeinschaft; nur, was die Kanzlei bestätigt. Keine Rechtsform ohne Beleg.", 2), group: "kanzlei" },
    defineField({
      name: "besuchsadresse", title: "Besuchsadresse (Büro)", type: "object", group: "kontakt", validation: (r) => r.required(),
      fields: [
        defineField({ name: "strasse", title: "Strasse und Nummer", type: "string", validation: (r) => r.required() }),
        defineField({ name: "plz", title: "Postleitzahl des Büros", type: "string", description: "Die Postleitzahl der Strasse, nicht des Postfachs (Militärstrasse 76: 8004).", validation: (r) => r.required().regex(/^\d{4}$/, { name: "vierstellige Postleitzahl" }) }),
        defineField({ name: "ort", title: "Ort", type: "string", validation: (r) => r.required() }),
        defineField({ name: "zusatz", title: "Zusatz (Stockwerk, Eingang)", type: "string", description: "Zum Beispiel «1. Stock, oben an der Treppe»", validation: (r) => r.required() }),
      ],
    }),
    defineField({
      name: "postadresse", title: "Postadresse", type: "object", group: "kontakt", validation: (r) => r.required(),
      fields: [
        defineField({ name: "postfach", title: "Postfach", type: "string", validation: (r) => r.required() }),
        defineField({ name: "plz", title: "Postleitzahl des Postfachs", type: "string", validation: (r) => r.required().regex(/^\d{4}$/, { name: "vierstellige Postleitzahl" }) }),
        defineField({ name: "ort", title: "Ort", type: "string", validation: (r) => r.required() }),
      ],
    }),
    defineField({ name: "telefon", title: "Telefon (Zentrale)", type: "string", description: "Im internationalen Format: +41 43 322 12 12", group: "kontakt", validation: (r) => r.required().custom(telefonFormat) }),
    defineField({ name: "email", title: "E-Mail", type: "string", description: "An diese Adresse richtet das Kontaktformular die vorbereitete E-Mail.", group: "kontakt", validation: (r) => r.required().email() }),
    defineField({
      name: "telefonzeiten", title: "Telefonzeiten und Terminregelung", type: "object", group: "kontakt", validation: (r) => r.required(),
      fields: [
        defineField({ name: "tage", title: "Tage", type: "string", description: "Zum Beispiel «Montag bis Donnerstag». Nur Tage eintragen, an denen das Telefon wirklich besetzt ist.", validation: (r) => r.required() }),
        defineField({ name: "zeiten", title: "Zeitfenster", type: "array", of: [defineArrayMember({ type: "string" })], description: "Ein Eintrag je Fenster, zum Beispiel «09.00 bis 12.00 Uhr».", validation: (r) => r.required().min(1).max(3) }),
        defineField({ name: "terminhinweis", title: "Terminregelung", type: "string", description: "Zum Beispiel «Termine nur gegen Voranmeldung.»", validation: (r) => r.required() }),
      ],
    }),
    { ...zeilenFeld("anfahrt", "Anfahrt", "Ein Satz je Eintrag (Bus, Gehminuten). Keine Angaben zu Lift, Barrierefreiheit oder Parkplätzen ohne Beleg."), group: "kontakt" },
    defineField({ name: "karten", title: "Kartenlinks (extern)", type: "array", of: [defineArrayMember({ type: "verweis" })], description: "Öffnen sich in einem neuen Fenster. Es wird keine Karte eingebettet.", group: "kontakt", validation: (r) => r.required().min(1) }),
    defineField({ name: "logo", title: "Wortmarke", type: "bildMitText", description: "Die Wortmarke der Kanzlei (schwarze Platte).", group: "bilder", validation: (r) => r.required() }),
    defineField({ name: "foto", title: "Strassenfoto", type: "bildMitText", description: "Echte Aufnahme, mit geklärten Rechten.", group: "bilder", validation: (r) => r.required() }),
    defineField({ name: "seoBild", title: "Vorschaubild für geteilte Links", type: "bildMitText", description: "1200 × 630 Pixel.", group: "bilder", validation: (r) => r.required() }),
    { ...herkunftFeld("Quellen der Kanzleiangaben"), group: "quellen" },
    { ...freigabeFeld, group: "quellen" },
  ],
  preview: { select: { title: "name", subtitle: "email", media: "logo" } },
});

// ── Team ───────────────────────────────────────────────────────────────────
export const beratungssprache = defineType({
  name: "beratungssprache",
  title: "Beratungssprache",
  type: "document",
  fields: [
    text("name", "Sprache (deutscher Name)", "Zum Beispiel «Arabisch». Wird in Profilen und im Teamfilter angezeigt."),
    slug("name"),
    reihenfolge,
  ],
  preview: { select: { title: "name" } },
});

export const person = defineType({
  name: "person",
  title: "Person",
  type: "document",
  groups: [{ name: "person", title: "Person", default: true }, { name: "taetigkeit", title: "Rechtsgebiete und Sprachen" }, { name: "werdegang", title: "Werdegang" }, { name: "bilder", title: "Portraits" }, { name: "quellen", title: "Quellen und Freigabe" }, { name: "seo", title: "Suchmaschinen" }],
  fields: [
    { ...text("vorname", "Vorname"), group: "person" },
    { ...text("nachname", "Nachname"), group: "person" },
    { ...slug("nachname"), group: "person" },
    { ...text("rolle", "Berufsbezeichnung, Titel und Funktion", "Im Wortlaut, zum Beispiel «Rechtsanwalt, lic. iur., Partner» oder «MLaw, Substitutin». Nur zugelassene Anwältinnen und Anwälte als solche bezeichnen."), group: "person" },
    defineField({ name: "berufsbezeichnung", title: "Zugelassen als", type: "string", description: "Nur setzen, wenn die Person im Anwaltsregister eingetragen ist. Leer lassen bei Substitutinnen, Sekretariat und bei Personen ohne Schweizer Zulassung.", options: { list: [{ title: "Rechtsanwältin", value: "Rechtsanwältin" }, { title: "Rechtsanwalt", value: "Rechtsanwalt" }], layout: "radio" }, group: "person" }),
    defineField({ name: "gruppe", title: "Gruppe auf der Teamseite", type: "string", options: { list: [{ title: "Partnerinnen und Partner, Rechtsanwältinnen und Rechtsanwälte", value: "anwaeltinnen-und-anwaelte" }, { title: "Juristische Mitarbeitende und Substitutinnen", value: "substitutinnen-und-substituten" }, { title: "Sekretariat", value: "sekretariat" }], layout: "radio" }, group: "person", validation: (r) => r.required() }),
    defineField({ name: "funktion", title: "Funktion", type: "string", options: { list: [{ title: "Partnerin", value: "partnerin" }, { title: "Partner", value: "partner" }, { title: "Associate", value: "associate" }, { title: "Substitutin", value: "substitutin" }, { title: "Substitut", value: "substitut" }, { title: "Leitung Sekretariat", value: "leitung-sekretariat" }] }, group: "person", validation: (r) => r.required() }),
    { ...reihenfolge, group: "person" },
    { ...text("sprachenOriginal", "Sprachen (Anzeige im Profil)", "Im Wortlaut, zum Beispiel «Deutsch, Italienisch (Englisch, Spanisch und Französisch mündlich)»."), group: "taetigkeit" },
    defineField({
      name: "sprachen", title: "Beratungssprachen (für den Filter)", type: "array", group: "taetigkeit",
      of: [defineArrayMember({ type: "object", name: "sprachzuordnung", fields: [defineField({ name: "sprache", title: "Sprache", type: "reference", to: [{ type: "beratungssprache" }], validation: (r) => r.required() }), defineField({ name: "zusatz", title: "Zusatz", type: "string", description: "Zum Beispiel «Muttersprache» oder «mündlich»" })], preview: { select: { title: "sprache.name", subtitle: "zusatz" } } })],
      validation: (r) => r.required().min(1),
    }),
    { ...textOptional("rechtsgebieteTitel", "Zwischentitel der Rechtsgebiete", "«Bevorzugte Rechtsgebiete» oder «Rechtsgebiete». Leer bei Personen ohne Rechtsgebiete."), group: "taetigkeit" },
    defineField({
      name: "rechtsgebiete", title: "Rechtsgebiete", type: "array", group: "taetigkeit", initialValue: [],
      description: "Bezeichnung im Wortlaut der Person plus Zuordnung zum Rechtsgebiet der Website (für Filter und Übersicht). Nur Gebiete eintragen, die die Person selbst nennt.",
      of: [defineArrayMember({ type: "object", name: "gebietszuordnung", fields: [
        defineField({ name: "text", title: "Bezeichnung im Profil", type: "string", validation: (r) => r.required().custom(schreibweise) }),
        defineField({ name: "gebiet", title: "Rechtsgebiet der Website", type: "reference", to: [{ type: "rechtsgebiet" }] }),
        defineField({ name: "fussnote", title: "Fussnote (Nummer)", type: "number", description: "Verweist auf den Eintrag gleicher Nummer unter «Anmerkungen»." }),
      ], preview: { select: { title: "text", subtitle: "gebiet.titel" } } })],
    }),
    { ...zeilenFeld("fussnoten", "Anmerkungen (Fussnoten)", "Nummeriert in der Reihenfolge der Einträge.", false), group: "taetigkeit" },
    defineField({ name: "telefon", title: "Telefon", type: "string", description: "+41 43 322 12 12", group: "person", validation: (r) => r.required().custom(telefonFormat) }),
    defineField({ name: "telefonBezeichnung", title: "Beschriftung des Telefons", type: "string", options: { list: ["Telefon direkt", "Telefon"], layout: "radio" }, initialValue: "Telefon direkt", group: "person", validation: (r) => r.required() }),
    defineField({ name: "email", title: "E-Mail (optional)", type: "string", description: "Nur, wenn die Person eine persönliche Adresse veröffentlichen will.", group: "person", validation: (r) => r.email() }),
    { ...zeilenFeld("werdegang", "Werdegang", "Ein Absatz je Eintrag, im Wortlaut der Person (Ich-Form erlaubt)."), group: "werdegang" },
    { ...textOptional("mitgliedschaftenTitel", "Titel der Mitgliedschaften", "Zum Beispiel «Mitgliedschaften» oder «Berufsbezogene Mitgliedschaften»"), group: "werdegang" },
    { ...zeilenFeld("mitgliedschaften", "Mitgliedschaften", "Eine je Eintrag. Nichts ergänzen, was die Person nicht bestätigt hat.", false), group: "werdegang" },
    defineField({ name: "portrait", title: "Portrait (Querformat, Profilseite)", type: "bildMitText", group: "bilder", validation: (r) => r.required() }),
    defineField({ name: "portraitQuadrat", title: "Portrait (quadratisch, Teamübersicht)", type: "bildMitText", description: "Ausschnitt mit Gesicht; keine Retusche.", group: "bilder", validation: (r) => r.required() }),
    { ...herkunftFeld("Quellen des Profils"), group: "quellen" },
    { ...freigabeFeld, group: "quellen" },
    defineField({ name: "seoBeschreibung", title: "Beschreibung für Suchmaschinen", type: "text", rows: 3, description: "50 bis 170 Zeichen: Name, Funktion, Rechtsgebiete, Sprachen.", group: "seo", validation: (r) => r.required().min(50).max(170) }),
  ],
  orderings: [{ title: "Reihenfolge", name: "reihenfolge", by: [{ field: "reihenfolge", direction: "asc" }] }],
  preview: { select: { vorname: "vorname", nachname: "nachname", subtitle: "rolle", media: "portraitQuadrat" }, prepare: ({ vorname, nachname, subtitle, media }) => ({ title: `${vorname ?? ""} ${nachname ?? ""}`.trim(), subtitle, media }) },
});

// ── Rechtsgebiete ──────────────────────────────────────────────────────────
const uebersetzung = (code: string, titel: string) =>
  defineField({ name: code, title: titel, type: "object", validation: (r) => r.required(), fields: [
    fremdtext("titel", "Bezeichnung"),
    defineField({ name: "status", title: "Status", type: "string", options: { list: [{ title: "Entwurf (noch nicht freigegeben)", value: "entwurf" }, { title: "Freigegeben", value: "freigegeben" }], layout: "radio" }, initialValue: "entwurf", validation: (r) => r.required() }),
  ] });

export const rechtsgebiet = defineType({
  name: "rechtsgebiet",
  title: "Rechtsgebiet",
  type: "document",
  groups: [{ name: "inhalt", title: "Inhalt", default: true }, { name: "uebersetzungen", title: "Übersetzungen" }, { name: "quellen", title: "Quellen" }],
  fields: [
    { ...text("titel", "Bezeichnung", "Zum Beispiel «Migrationsrecht»"), group: "inhalt" },
    { ...slug("titel"), group: "inhalt" },
    { ...textOptional("zusatz", "Zusatz", "Zum Beispiel «Asyl-, Ausländer- und Bürgerrecht»"), group: "inhalt" },
    defineField({ name: "schwerpunkt", title: "Schwerpunkt der Kanzlei", type: "boolean", description: "Nur die auf der Partnerschaftsseite genannten Spezialisierungen (Migrationsrecht, Straf-, Familien-, Mietrecht).", initialValue: false, group: "inhalt" }),
    { ...reihenfolge, group: "inhalt" },
    { ...zeilenFeld("begriffe", "Bezeichnungen in den Profilen", "Im Wortlaut der Profile.", false), group: "inhalt" },
    { ...zeilenFeld("hintergrund", "Hintergrund aus den Lebensläufen", "Belegte Tätigkeiten und Mitgliedschaften, ein Satz je Eintrag. Keine Leistungsversprechen.", false), group: "inhalt" },
    defineField({ name: "uebersetzungen", title: "Übersetzungen", type: "object", group: "uebersetzungen", validation: (r) => r.required(), fields: [uebersetzung("en", "Englisch"), uebersetzung("fr", "Französisch"), uebersetzung("it", "Italienisch"), uebersetzung("es", "Spanisch"), uebersetzung("ar", "Arabisch")] }),
    { ...herkunftFeld(), group: "quellen" },
    { ...freigabeFeld, group: "quellen" },
  ],
  orderings: [{ title: "Reihenfolge", name: "reihenfolge", by: [{ field: "reihenfolge", direction: "asc" }] }],
  preview: { select: { title: "titel", subtitle: "zusatz" } },
});

// ── Seiten ─────────────────────────────────────────────────────────────────
const abschnittMitLink = (name: string, title: string) => defineField({ name, title, type: "object", validation: (r) => r.required(), fields: [text("titel", "Titel"), text("text", "Text", undefined, 3), verweisFeld("link", "Link")] });

export const startseite = defineType({
  name: "startseite",
  title: "Startseite",
  type: "document",
  groups: seoGruppe,
  fields: [
    defineField({ name: "hero", title: "Einstieg", type: "object", group: "inhalt", validation: (r) => r.required(), fields: [text("titel", "Titel", "Höchstens 60 Zeichen."), text("text", "Satz der Kanzlei", "Höchstens 24 Wörter, im Wortlaut der Kanzlei.", 3), text("sprachwahlTitel", "Titel der Sprachwahl")] }),
    defineField({ name: "kanzlei", title: "Abschnitt «Die Kanzlei»", type: "object", group: "inhalt", validation: (r) => r.required(), fields: [text("titel", "Titel"), zeilenFeld("absaetze", "Absätze")] }),
    defineField({ name: "foto", title: "Strassenfoto", type: "object", group: "inhalt", validation: (r) => r.required(), fields: [text("legende", "Bildlegende")] }),
    defineField({ name: "erreichbarkeit", title: "Erreichbarkeit", type: "object", group: "inhalt", validation: (r) => r.required(), fields: [text("titel", "Titel")] }),
    { ...abschnittMitLink("rechtsgebiete", "Abschnitt Rechtsgebiete"), group: "inhalt" },
    { ...abschnittMitLink("team", "Abschnitt Team"), group: "inhalt" },
    defineField({ name: "mitarbeit", title: "Abschnitt Mitarbeit und Partnerschaft", type: "object", group: "inhalt", validation: (r) => r.required(), fields: [text("titel", "Titel"), abschnittMitLink("partnerschaft", "Fenster Partnerschaft"), abschnittMitLink("stellen", "Fenster Stellen")] }),
    belegeFeld,
    ...seoFelder,
  ],
  preview: { prepare: () => ({ title: "Startseite" }) },
});

export const rechtsgebieteSeite = defineType({
  name: "rechtsgebieteSeite",
  title: "Rechtsgebiete (Übersichtsseite)",
  type: "document",
  groups: seoGruppe,
  fields: [
    { ...text("titel", "Titel"), group: "inhalt" },
    { ...zeilenFeld("einleitung", "Einleitung (Absätze)"), group: "inhalt" },
    { ...text("weitereTitel", "Titel «Weitere Tätigkeitsgebiete»"), group: "inhalt" },
    { ...text("personenTitel", "Beschriftung Ansprechpersonen"), group: "inhalt" },
    { ...text("begriffeTitel", "Beschriftung Bezeichnungen"), group: "inhalt" },
    { ...text("hintergrundTitel", "Beschriftung Hintergrund"), group: "inhalt" },
    { ...text("hinweis", "Hinweis am Seitenende", "Keine Rechtsberatung, keine Zusage.", 3), group: "inhalt" },
    belegeFeld,
    ...seoFelder,
  ],
  preview: { prepare: () => ({ title: "Rechtsgebiete (Übersichtsseite)" }) },
});

export const teamSeite = defineType({
  name: "teamSeite",
  title: "Team (Übersichtsseite)",
  type: "document",
  groups: seoGruppe,
  fields: [
    { ...text("titel", "Titel"), group: "inhalt" },
    { ...text("einleitung", "Einleitung", undefined, 3), group: "inhalt" },
    defineField({ name: "gruppen", title: "Gruppentitel", type: "object", group: "inhalt", validation: (r) => r.required(), fields: [text("anwaeltinnenUndAnwaelte", "Anwältinnen und Anwälte"), text("substitutinnenUndSubstituten", "Juristische Mitarbeitende"), text("sekretariat", "Sekretariat")] }),
    defineField({ name: "filter", title: "Filter", type: "object", group: "inhalt", validation: (r) => r.required(), fields: [text("titel", "Titel"), text("rechtsgebiet", "Beschriftung Rechtsgebiet"), text("sprache", "Beschriftung Sprache"), text("alle", "«Alle»"), text("zuruecksetzen", "«Zurücksetzen»"), text("treffer", "Wort nach der Trefferzahl"), text("keineTreffer", "Text ohne Treffer"), text("hinweis", "Hinweis zur Herkunft der Zuordnungen", undefined, 3)] }),
    defineField({ name: "verlinkt", title: "Ebenfalls verlinkt", type: "object", group: "inhalt", validation: (r) => r.required(), fields: [text("titel", "Titel"), text("text", "Text", undefined, 3), defineField({ name: "links", title: "Links", type: "array", of: [defineArrayMember({ type: "object", name: "externerLink", fields: [text("name", "Name"), text("beschreibung", "Beschreibung"), defineField({ name: "ziel", title: "Adresse", type: "url", validation: (r) => r.required().uri({ scheme: ["https"] }) })] })], validation: (r) => r.required().min(1) })] }),
    defineField({ name: "profil", title: "Beschriftungen im Profil", type: "object", group: "inhalt", validation: (r) => r.required(), fields: [text("zurueck", "Zurück zum Team"), text("funktion", "Funktion"), text("sprachen", "Sprachen"), text("telefon", "Telefon"), text("email", "E-Mail"), text("emailKanzlei", "E-Mail (Kanzlei), wenn keine persönliche Adresse"), text("werdegang", "Werdegang"), text("fussnotenTitel", "Anmerkung"), text("keineRechtsgebiete", "Text ohne Rechtsgebiete")] }),
    belegeFeld,
    ...seoFelder,
  ],
  preview: { prepare: () => ({ title: "Team (Übersichtsseite)" }) },
});

export const stelle = defineType({
  name: "stelle",
  title: "Offene Stelle",
  type: "document",
  description: "Ablauf: als Entwurf anlegen, prüfen, auf «Veröffentlicht» stellen und einen Build auslösen; nach Ablauf auf «Archiviert» stellen (bleibt dokumentiert) und erneut bauen.",
  fields: [
    text("titel", "Titel", "Zum Beispiel «Anwaltspraktikum / Substitut»"),
    slug("titel"),
    statusFeld,
    defineField({ name: "veroeffentlichtAb", title: "Sichtbar ab (optional)", type: "date", description: "Vor diesem Datum erscheint die Stelle nicht, auch wenn sie veröffentlicht ist." }),
    defineField({ name: "archiviertAb", title: "Sichtbar bis (optional)", type: "date", description: "Ab diesem Datum erscheint die Stelle nicht mehr. Der Build muss nach dem Datum erneut laufen.", validation: (r) => r.custom((wert, kontext) => { const ab = (kontext.document as { veroeffentlichtAb?: string } | undefined)?.veroeffentlichtAb; return !wert || !ab || wert > ab ? true : "«Sichtbar bis» muss nach «Sichtbar ab» liegen."; }) }),
    textOptional("stand", "Stand der Angaben", "Wird sichtbar angezeigt, zum Beispiel «Ausschreibung vom 1. März 2027»."),
    defineField({ name: "inhalt", title: "Text", type: "fliesstext", validation: (r) => r.required() }),
    defineField({ name: "bewerbung", title: "Bewerbung", type: "object", validation: (r) => r.required(), fields: [text("text", "Text", undefined, 3), defineField({ name: "email", title: "E-Mail für Bewerbungen", type: "string", validation: (r) => r.required().email() }), defineField({ name: "person", title: "Ansprechperson", type: "reference", to: [{ type: "person" }], validation: (r) => r.required() })] }),
  ],
  preview: { select: { title: "titel", subtitle: "status" } },
});

export const mitarbeitSeite = defineType({
  name: "mitarbeitSeite",
  title: "Mitarbeit und Partnerschaft (Seite)",
  type: "document",
  groups: [{ name: "inhalt", title: "Seite", default: true }, { name: "partnerschaft", title: "Partnerschaft" }, { name: "seo", title: "Suchmaschinen" }],
  fields: [
    { ...text("titel", "Titel"), group: "inhalt" },
    { ...text("einleitung", "Einleitung", undefined, 3), group: "inhalt" },
    { ...text("stellenTitel", "Titel «Offene Stellen»"), group: "inhalt" },
    { ...text("keineStellen", "Text, wenn keine Stelle sichtbar ist"), group: "inhalt" },
    { ...text("bewerbungTitel", "Titel «Bewerbung»"), group: "inhalt" },
    { ...text("standLabel", "Beschriftung «Stand der Angaben»"), group: "inhalt" },
    defineField({ name: "partnerschaft", title: "Partnerschaft", type: "object", group: "partnerschaft", validation: (r) => r.required(), fields: [
      defineField({ name: "slug", title: "Sprungmarke", type: "slug", initialValue: { current: "partnerschaft" }, validation: (r) => r.required() }),
      text("titel", "Titel"),
      statusFeld,
      textOptional("stand", "Stand der Angaben", "Sichtbar; datierte Aussagen wie «ab Januar 2026» hier einordnen."),
      defineField({ name: "inhalt", title: "Text", type: "fliesstext", validation: (r) => r.required() }),
      text("kontakteTitel", "Titel der Auskunftspersonen"),
      defineField({ name: "kontakte", title: "Auskunftspersonen", type: "array", validation: (r) => r.required().min(1), of: [defineArrayMember({ type: "object", name: "auskunft", fields: [defineField({ name: "person", title: "Person", type: "reference", to: [{ type: "person" }], validation: (r) => r.required() }), defineField({ name: "email", title: "E-Mail", type: "string", validation: (r) => r.required().email() }), defineField({ name: "telefon", title: "Telefon", type: "string", validation: (r) => r.required().custom(telefonFormat) })], preview: { select: { title: "person.nachname", subtitle: "email" } } })] }),
    ] }),
    belegeFeld,
    ...seoFelder,
  ],
  preview: { prepare: () => ({ title: "Mitarbeit und Partnerschaft" }) },
});

export const kontaktSeite = defineType({
  name: "kontaktSeite",
  title: "Kontakt und Anfahrt",
  type: "document",
  groups: seoGruppe,
  fields: [
    { ...text("titel", "Titel"), group: "inhalt" },
    { ...text("einleitung", "Einleitung", undefined, 3), group: "inhalt" },
    { ...text("erreichbarkeitTitel", "Titel Erreichbarkeit"), group: "inhalt" },
    { ...text("adresseTitel", "Titel Adresse"), group: "inhalt" },
    { ...text("anfahrtTitel", "Titel Anfahrt"), group: "inhalt" },
    { ...text("kartenHinweis", "Hinweis zu den Kartenlinks"), group: "inhalt" },
    defineField({ name: "hinweis", title: "Hinweis zu Anfragen", type: "object", group: "inhalt", validation: (r) => r.required(), description: "Der Wortlaut der Kanzlei (24 Stunden) und der Zusatz zur Mandatsannahme. Beides gibt die Kanzlei frei.", fields: [text("titel", "Titel"), text("text", "Text der Kanzlei", undefined, 4), text("zusatz", "Zusatz zur Mandatsannahme", undefined, 3)] }),
    { ...text("formularTitel", "Titel des Formulars"), group: "inhalt" },
    belegeFeld,
    ...seoFelder,
  ],
  preview: { prepare: () => ({ title: "Kontakt und Anfahrt" }) },
});

export const rechtSeite = defineType({
  name: "rechtSeite",
  title: "Rechtsseite",
  type: "document",
  groups: seoGruppe,
  fields: [
    defineField({ name: "slug", title: "Seite", type: "slug", options: { source: "titel" }, group: "inhalt", readOnly: true, validation: (r) => r.required() }),
    { ...text("titel", "Titel"), group: "inhalt" },
    { ...textOptional("einleitung", "Einleitung", undefined, 3), group: "inhalt" },
    { ...text("stand", "Stand", "Zum Beispiel «3. November 2026»"), group: "inhalt" },
    defineField({ name: "inhalt", title: "Text", type: "fliesstext", group: "inhalt", validation: (r) => r.required() }),
    belegeFeld,
    ...seoFelder,
  ],
  preview: { select: { title: "titel", subtitle: "stand" } },
});

// ── Sprachfassungen ────────────────────────────────────────────────────────
const ft = fremdtext;
export const sprachseite = defineType({
  name: "sprachseite",
  title: "Sprachfassung",
  type: "document",
  description: "Eine Seite je Sprache (Englisch, Französisch, Italienisch, Spanisch, Arabisch). Einführung im Wortlaut der Kanzlei; alle anderen Texte sind Übersetzungen der Oberfläche.",
  groups: [{ name: "seite", title: "Seite", default: true }, { name: "ui", title: "Beschriftungen" }, { name: "formular", title: "Formular" }, { name: "quellen", title: "Quellen" }],
  fields: [
    defineField({ name: "sprache", title: "Sprache", type: "string", options: { list: [{ title: "Englisch", value: "en" }, { title: "Französisch", value: "fr" }, { title: "Italienisch", value: "it" }, { title: "Spanisch", value: "es" }, { title: "Arabisch", value: "ar" }], layout: "radio" }, group: "seite", validation: (r) => r.required() }),
    defineField({ name: "lang", title: "Sprachcode (lang)", type: "string", description: "en, fr, it, es oder ar", group: "seite", validation: (r) => r.required().regex(/^[a-z]{2}(-[A-Z]{2})?$/) }),
    defineField({ name: "richtung", title: "Schreibrichtung", type: "string", options: { list: [{ title: "Links nach rechts", value: "ltr" }, { title: "Rechts nach links (Arabisch)", value: "rtl" }], layout: "radio" }, group: "seite", validation: (r) => r.required() }),
    { ...ft("name", "Name der Sprache in dieser Sprache", "Zum Beispiel «Français»"), group: "seite" },
    { ...text("nameDeutsch", "Name der Sprache auf Deutsch"), group: "seite" },
    { ...ft("gruss", "Gruss (wie auf der bisherigen Startseite)", "Zum Beispiel «bienvenue»"), group: "seite" },
    { ...ft("titel", "Titel der Seite"), group: "seite" },
    defineField({ name: "intro", title: "Einführung (Absätze)", type: "array", of: [defineArrayMember({ type: "text", rows: 4 })], description: "Im Wortlaut der Kanzlei. Keine freien Übersetzungen rechtlicher Aussagen.", group: "seite", validation: (r) => r.required().min(1) }),
    defineField({ name: "kapazitaetshinweis", title: "Hinweis zu Anfragen", type: "object", group: "seite", validation: (r) => r.required(), fields: [ft("text", "Text", undefined, 4), defineField({ name: "status", title: "Herkunft", type: "string", options: { list: [{ title: "Wortlaut der bisherigen Website", value: "quelle" }, { title: "Übersetzungsentwurf (Freigabe offen)", value: "entwurf" }], layout: "radio" }, validation: (r) => r.required() })] }),
    defineField({ name: "ui", title: "Beschriftungen", type: "object", group: "ui", validation: (r) => r.required(), fields: [
      defineField({ name: "navigation", title: "Abschnittsnavigation", type: "array", validation: (r) => r.required().length(4), of: [defineArrayMember({ type: "object", name: "abschnittLink", fields: [ft("text", "Beschriftung"), defineField({ name: "anker", title: "Abschnitt", type: "string", options: { list: ["kanzlei", "rechtsgebiete", "team", "kontakt"] }, validation: (r) => r.required() })], preview: { select: { title: "text", subtitle: "anker" } } })] }),
      ft("sprache", "Sprache"), ft("spracheWaehlen", "Sprache wählen"), ft("zumInhalt", "Zum Inhalt springen"), ft("zurStartseite", "Zur Startseite (aria)"),
      ft("telefonzeiten", "Telefonzeiten"), ft("tage", "Tage"), defineField({ name: "zeiten", title: "Zeitfenster", type: "array", of: [defineArrayMember({ type: "string" })], validation: (r) => r.required().min(1).max(3) }), ft("terminhinweis", "Terminregelung"),
      ft("besuchsadresse", "Besuchsadresse"), ft("postadresse", "Postadresse"), ft("stockwerk", "Stockwerk"), ft("telefon", "Telefon"), ft("email", "E-Mail"), ft("anrufen", "Anrufen"),
      ft("anfahrt", "Anfahrt (Titel)"), defineField({ name: "anfahrtPunkte", title: "Anfahrt (Einträge)", type: "array", of: [defineArrayMember({ type: "string" })], validation: (r) => r.required().min(1) }), ft("karte", "Karte öffnen"),
      defineField({ name: "karten", title: "Kartenlinks", type: "array", of: [defineArrayMember({ type: "verweis" })], validation: (r) => r.required().min(1) }),
      ft("rechtsgebieteTitel", "Rechtsgebiete (Titel)"), ft("rechtsgebieteText", "Rechtsgebiete (Hinweis Deutsch)", undefined, 2), ft("teamTitel", "Team (Titel)"), ft("teamText", "Team (Hinweis Deutsch)", undefined, 2), ft("gesprocheneSprachen", "Sprachen (Beschriftung)"), ft("nurDeutsch", "nur auf Deutsch"), ft("zurDeutschenWebsite", "Zur deutschen Website"),
      ft("kontaktTitel", "Kontakt (Titel)"), ft("hinweisTitel", "Hinweis zu Anfragen (Titel)"), ft("impressum", "Impressum"), ft("datenschutz", "Datenschutz"), ft("demoHinweis", "Demo-Hinweis", undefined, 2), ft("oeffnetNeuesFenster", "öffnet in einem neuen Fenster"), ft("uebersetzungshinweis", "Hinweis zu den Übersetzungen", undefined, 3),
      defineField({ name: "gruppen", title: "Gruppentitel des Teams", type: "object", validation: (r) => r.required(), fields: [ft("anwaeltinnenUndAnwaelte", "Partnerinnen, Partner und Anwälte"), ft("substitutinnenUndSubstituten", "Juristische Mitarbeitende"), ft("sekretariat", "Sekretariat")] }),
    ] }),
    defineField({ name: "formular", title: "Formular", type: "object", group: "formular", validation: (r) => r.required(), fields: [
      ft("titel", "Titel"), ft("einleitung", "Einleitung", undefined, 3), ft("keineVertraulich", "Hinweis: keine vertraulichen Unterlagen", undefined, 3), ft("name", "Name"), ft("email", "E-Mail"), ft("telefon", "Telefon"), ft("telefonHilfe", "Hilfe Telefon"), ft("betreff", "Betreff"),
      defineField({ name: "betreffOptionen", title: "Betreff-Optionen", type: "array", of: [defineArrayMember({ type: "object", name: "betreffOption", fields: [defineField({ name: "wert", title: "Kennung", type: "string", validation: (r) => r.required().regex(/^[a-z0-9-]+$/) }), ft("titel", "Bezeichnung")], preview: { select: { title: "titel" } } })], validation: (r) => r.required().min(2) }),
      ft("betreffPraefix", "Betreff-Präfix"), ft("nachricht", "Nachricht"), ft("nachrichtHilfe", "Hilfe Nachricht"), ft("pflicht", "Pflichtfeld-Hinweis"), ft("absenden", "Knopf «E-Mail vorbereiten»"), ft("hinweisNachher", "Hinweis nach dem Klick", undefined, 3),
      ft("fehlerName", "Fehler Name"), ft("fehlerEmail", "Fehler E-Mail"), ft("fehlerNachricht", "Fehler Nachricht"), ft("kopieren", "Kopieren"), ft("kopiert", "Kopiert"), ft("kopierenFehler", "Kopieren fehlgeschlagen"), ft("zuLangFehler", "Zu lang", undefined, 2), ft("volltextLabel", "Volltext"), ft("ohneJavascript", "Ohne JavaScript"), ft("datenschutzHinweis", "Datenschutz-Hinweis"), ft("datenschutzLink", "Datenschutz-Linktext"),
    ] }),
    { ...belegeFeld, group: "quellen" },
    { ...defineField({ name: "seoTitel", title: "Seitentitel für Suchmaschinen", type: "string", validation: (r) => r.required().max(70) }), group: "seite" },
    { ...defineField({ name: "seoBeschreibung", title: "Beschreibung für Suchmaschinen", type: "text", rows: 3, validation: (r) => r.required().min(50).max(170) }), group: "seite" },
  ],
  preview: { select: { title: "nameDeutsch", subtitle: "sprache" } },
});

// ── Texte (deutsche Oberfläche) ────────────────────────────────────────────
export const texte = defineType({
  name: "texte",
  title: "Navigation, Fusszeile, Formular, Sprachen",
  type: "document",
  groups: [{ name: "navigation", title: "Navigation und Sprachen", default: true }, { name: "ui", title: "Beschriftungen" }, { name: "footer", title: "Fusszeile" }, { name: "formular", title: "Formular" }, { name: "einwilligung", title: "Datenschutz-Einstellungen" }, { name: "seo", title: "Suchmaschinen" }],
  fields: [
    defineField({ name: "navigation", title: "Register (Hauptnavigation)", type: "array", of: [defineArrayMember({ type: "verweis" })], description: "Zwei bis sechs Einträge, kurze Wörter (sie müssen auf dem Handy in eine Zeile passen). Der erste ist die Startseite «/».", group: "navigation", validation: (r) => r.required().min(2).max(6) }),
    defineField({ name: "sprachen", title: "Sprachen (Reihenfolge der Sprachwahl)", type: "array", group: "navigation", validation: (r) => r.required().length(6), of: [defineArrayMember({ type: "object", name: "sprachEintrag", fields: [
      defineField({ name: "code", title: "Code", type: "string", options: { list: ["de", "en", "fr", "ar", "it", "es"] }, validation: (r) => r.required() }),
      ft("name", "Name in der Sprache"), text("nameDeutsch", "Name auf Deutsch"), ft("gruss", "Gruss"), defineField({ name: "lang", title: "lang-Attribut", type: "string", validation: (r) => r.required() }),
      defineField({ name: "richtung", title: "Richtung", type: "string", options: { list: ["ltr", "rtl"] }, validation: (r) => r.required() }),
    ], preview: { select: { title: "name", subtitle: "code" } } })] }),
    defineField({ name: "kopf", title: "Kopfzeile", type: "object", group: "ui", validation: (r) => r.required(), fields: [text("logoAlt", "Alternativtext der Wortmarke"), text("zurStartseite", "Zur Startseite (aria)"), text("sprache", "Sprache"), text("spracheWaehlen", "Sprache wählen"), text("aktuelleSprache", "aktuelle Sprache"), text("anrufen", "Anrufen"), text("navigationLabel", "Name der Navigation"), text("sprachenLabel", "Name der Sprachliste")] }),
    defineField({ name: "ui", title: "Allgemeine Beschriftungen", type: "object", group: "ui", validation: (r) => r.required(), fields: [
      text("zumInhalt", "Zum Inhalt springen"), text("oeffnetNeuesFenster", "öffnet in einem neuen Fenster"), text("telefonzeiten", "Telefonzeiten"), text("terminhinweis", "Terminregelung"), text("besuchsadresse", "Besuchsadresse"), text("postadresse", "Postadresse"), text("telefon", "Telefon"), text("email", "E-Mail"),
      text("anrufen", "Anrufen"), text("kontaktAufnehmen", "Knopf Kontakt"), text("mehr", "Mehr"), text("nurDeutsch", "nur auf Deutsch"), text("personenLabel", "Ansprechpersonen"), text("nichtGefundenTitel", "Fehlerseite: Titel"), text("nichtGefundenText", "Fehlerseite: Text", undefined, 3), verweisFeld("nichtGefundenLink", "Fehlerseite: Link"),
      text("schliessen", "Schliessen"), text("stand", "Stand der Angaben"), text("kapazitaetshinweisTitel", "Hinweis zu Anfragen (Titel)"), text("entwurf", "Entwurf (Marke)"),
    ] }),
    defineField({ name: "footer", title: "Fusszeile", type: "object", group: "footer", validation: (r) => r.required(), fields: [text("kontaktTitel", "Kontakt"), text("sprachenTitel", "Sprachen"), text("seitenTitel", "Seiten"), defineField({ name: "rechtliches", title: "Rechtliche Links", type: "array", of: [defineArrayMember({ type: "verweis" })], validation: (r) => r.required().min(2) }), text("einstellungen", "Datenschutz-Einstellungen"), verweisFeld("bildnachweis", "Bildnachweis"), text("demoHinweis", "Demo-Hinweis", undefined, 2), text("copyright", "Copyright")] }),
    defineField({ name: "formular", title: "Formular", type: "object", group: "formular", validation: (r) => r.required(), fields: [
      text("titel", "Titel"), text("einleitung", "Einleitung", undefined, 3), text("keineVertraulich", "Hinweis: keine vertraulichen Unterlagen", undefined, 3), text("name", "Name"), text("email", "E-Mail"), text("telefon", "Telefon"), text("telefonHilfe", "Hilfe Telefon"), text("betreff", "Betreff"),
      defineField({ name: "betreffOptionen", title: "Betreff-Optionen", type: "array", of: [defineArrayMember({ type: "object", name: "betreffOption", fields: [defineField({ name: "wert", title: "Kennung", type: "string", validation: (r) => r.required().regex(/^[a-z0-9-]+$/) }), text("titel", "Bezeichnung")], preview: { select: { title: "titel" } } })], validation: (r) => r.required().min(2) }),
      text("betreffPraefix", "Betreff-Präfix"), text("nachricht", "Nachricht"), text("nachrichtHilfe", "Hilfe Nachricht"), text("pflicht", "Pflichtfeld-Hinweis"), text("absenden", "Knopf"), text("hinweisNachher", "Hinweis nach dem Klick", undefined, 3),
      text("fehlerName", "Fehler Name"), text("fehlerEmail", "Fehler E-Mail"), text("fehlerNachricht", "Fehler Nachricht"), text("kopieren", "Kopieren"), text("kopiert", "Kopiert"), text("kopierenFehler", "Kopieren fehlgeschlagen"), text("zuLangFehler", "Zu lang", undefined, 2), text("volltextLabel", "Volltext"), text("ohneJavascript", "Ohne JavaScript"), text("datenschutzHinweis", "Datenschutz-Hinweis"), verweisFeld("datenschutzLink", "Datenschutz-Link"),
    ] }),
    defineField({ name: "einwilligung", title: "Datenschutz-Einstellungen", type: "object", group: "einwilligung", validation: (r) => r.required(), description: "Kategorien leer lassen, solange keine einwilligungspflichtigen Dienste eingebunden sind: dann erscheint kein Banner.", fields: [
      text("bannerTitel", "Banner: Titel"), text("bannerText", "Banner: Text", undefined, 3), text("alleAkzeptieren", "Alle akzeptieren"), text("nurNotwendige", "Nur notwendige"), text("einstellungen", "Einstellungen"), text("auswahlSpeichern", "Auswahl speichern"), text("widerrufen", "Widerrufen"),
      text("notwendigTitel", "Notwendig: Titel"), text("notwendigText", "Notwendig: Text", undefined, 2), text("ruhendTitel", "Ohne Dienste: Titel"), text("ruhendText", "Ohne Dienste: Text", undefined, 3), text("datenschutzerklaerung", "Linktext Datenschutzerklärung"),
      defineField({ name: "kategorien", title: "Optionale Kategorien", type: "array", initialValue: [], of: [defineArrayMember({ type: "object", name: "einwilligungKategorie", fields: [defineField({ name: "kennung", title: "Kennung", type: "string", validation: (r) => r.required().regex(/^[a-z0-9-]+$/) }), text("titel", "Titel"), text("beschreibung", "Beschreibung", undefined, 2)], preview: { select: { title: "titel", subtitle: "kennung" } } })] }),
    ] }),
    defineField({ name: "seo", title: "Suchmaschinen", type: "object", group: "seo", validation: (r) => r.required(), fields: [text("titelZusatz", "Zusatz im Seitentitel"), defineField({ name: "beschreibung", title: "Standardbeschreibung", type: "text", rows: 3, validation: (r) => r.required().min(50).max(170) })] }),
    { ...text("demoHinweis", "Demo-Hinweis (Leiste oben)"), group: "ui" },
  ],
  preview: { prepare: () => ({ title: "Navigation, Fusszeile, Formular, Sprachen" }) },
});
