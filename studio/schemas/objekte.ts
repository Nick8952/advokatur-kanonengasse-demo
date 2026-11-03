import { defineArrayMember, defineField, defineType } from "sanity";

/** Dieselbe Regel wie lib/assets.ts (istErlaubtesLinkziel): interne Seite, Sprungmarke, https, E-Mail oder Telefon. */
const httpsOk = (wert: string) => { if (!/^https:\/\/[^\s\\]+$/.test(wert)) return false; try { const u = new URL(wert); return u.protocol === "https:" && u.hostname.length > 0 && !u.username && !u.password; } catch { return false; } };
export const linkzielErlaubt = (ziel: string | undefined) =>
  !ziel || /^\/(?![\/\\])[^\s\\]*$/.test(ziel) || /^#[A-Za-z][\w-]*$/.test(ziel) || /^(mailto:[^\s@]+@[^\s@]+|tel:\+?[\d\s()-]+)$/.test(ziel) || httpsOk(ziel) ? true : "Erlaubt sind interne Seiten («/kontakt/»), Sprungmarken («#anker»), https://-Adressen, mailto: und tel:.";

/** Schweizer Schreibweise und ruhige Satzzeichen für deutsche Texte. */
export const schreibweise = (text: string | undefined) => {
  if (!text) return true;
  if (text.includes("ß")) return "Bitte «ss» statt «ß» schreiben (Schweizer Schreibweise).";
  if (/[—–]/.test(text)) return "Bitte keinen Gedankenstrich verwenden: Satz umstellen oder einen Punkt setzen.";
  return true;
};
export const telefonFormat = (wert: string | undefined) => (!wert || /^\+41 \d{2} \d{3} \d{2} \d{2}$/.test(wert) ? true : "Format: +41 43 322 12 12");

const FREIGABE = { list: [{ title: "Demo (belegt, nicht bestätigt)", value: "demo" }, { title: "Live (von der Kanzlei freigegeben)", value: "live" }], layout: "radio" as const };

export const verweis = defineType({
  name: "verweis",
  title: "Link",
  type: "object",
  fields: [
    defineField({ name: "text", title: "Beschriftung", type: "string", validation: (r) => r.required().custom(schreibweise) }),
    defineField({ name: "ziel", title: "Ziel", type: "string", description: "Interne Seite («/kontakt/»), Sprungmarke, https://-Adresse, mailto: oder tel:", validation: (r) => r.required().custom(linkzielErlaubt) }),
  ],
  preview: { select: { title: "text", subtitle: "ziel" } },
});

export const bildMitText = defineType({
  name: "bildMitText",
  title: "Bild",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({ name: "alt", title: "Bildbeschreibung (Alternativtext)", type: "string", description: "Beschreibt, was auf dem Bild zu sehen ist, für Menschen, die es nicht sehen.", validation: (r) => r.required().min(5).custom(schreibweise) }),
    defineField({ name: "legende", title: "Bildlegende", type: "string", description: "Kurzer Text unter dem Bild (optional).", validation: (r) => r.custom(schreibweise) }),
    defineField({
      name: "nachweis",
      title: "Bildnachweis und Nutzungsrecht",
      type: "object",
      description: "Erscheint im Impressum. Ohne geklärtes Nutzungsrecht kein Bild veröffentlichen. Portraits nur mit Einverständnis der abgebildeten Person.",
      fields: [
        defineField({ name: "urheber", title: "Fotografin oder Fotograf", type: "string", validation: (r) => r.required() }),
        defineField({ name: "titel", title: "Bezeichnung (optional)", type: "string" }),
        defineField({ name: "quelle", title: "Quelle", type: "string", description: "Adresse der Bildquelle oder «eigenes Bild»", validation: (r) => r.required() }),
        defineField({ name: "lizenz", title: "Lizenz oder Nutzungsrecht", type: "string", description: "Zum Beispiel «Rechte bei der Kanzlei» oder «Nutzung freigegeben am …»", validation: (r) => r.required() }),
        defineField({ name: "bearbeitung", title: "Bearbeitung (optional)", type: "string", description: "Zum Beispiel «nur verkleinert» oder «quadratischer Ausschnitt»" }),
      ],
      validation: (r) => r.required(),
    }),
  ],
});

export const herkunft = defineType({
  name: "herkunft",
  title: "Quelle",
  type: "object",
  fields: [
    defineField({ name: "quelle", title: "Bezeichnung der Quelle", type: "string", description: "Zum Beispiel «Profilseite der bisherigen Website» oder «Bestätigung der Kanzlei, E-Mail vom 3. März»", validation: (r) => r.required().min(3) }),
    defineField({
      name: "url", title: "Adresse der Quelle", type: "url",
      description: "Pflicht bei Website- und amtlichen Quellen. Bei eigenen Angaben der Kanzlei und redaktionellen Formulierungen darf sie fehlen.",
      validation: (r) => r.uri({ scheme: ["https"] }).custom((url, kontext) => (url || ["eigene-quelle", "redaktion"].includes((kontext.parent as { art?: string } | undefined)?.art ?? "") ? true : "Bitte die Adresse der Quelle angeben.")),
    }),
    defineField({ name: "abgerufen", title: "Abgerufen oder bestätigt am", type: "date", validation: (r) => r.required() }),
    defineField({
      name: "art",
      title: "Art der Quelle",
      type: "string",
      description: "Verzeichniseinträge, Bewertungsplattformen und automatisch erzeugte Texte sind keine zulässige Quelle.",
      options: { list: [{ title: "Bisherige Website der Kanzlei", value: "bisherige-website" }, { title: "Amtlich (Register, Behörde)", value: "amtlich" }, { title: "Eigene Angabe der Kanzlei", value: "eigene-quelle" }, { title: "Redaktionelle Formulierung ohne neuen Sachverhalt", value: "redaktion" }], layout: "radio" },
      validation: (r) => r.required(),
    }),
  ],
  preview: { select: { title: "quelle", subtitle: "abgerufen" } },
});

export const belege = defineType({
  name: "belege",
  title: "Belege für die Texte dieser Seite",
  type: "object",
  description: "Freie Texte dieser Seite sagen etwas über die Kanzlei. Hier steht, worauf sie sich stützen und ob die Kanzlei sie freigegeben hat.",
  fields: [
    defineField({ name: "herkunft", title: "Quellen", type: "array", of: [defineArrayMember({ type: "herkunft" })], validation: (r) => r.required().min(1).error("Mindestens eine Quelle angeben.") }),
    defineField({ name: "freigabe", title: "Freigabe", type: "string", description: "«Live» erst, wenn die Kanzlei die Texte dieser Seite bestätigt hat. Vorher lässt sich die Website nicht für Suchmaschinen freigeben.", options: FREIGABE, initialValue: "demo", validation: (r) => r.required() }),
  ],
});

export const freigabeFeld = defineField({ name: "freigabe", title: "Freigabe", type: "string", description: "«Demo»: belegt, aber von der Kanzlei noch nicht bestätigt. «Live»: von der Kanzlei freigegeben.", options: FREIGABE, initialValue: "demo", validation: (r) => r.required() });

/** Fliesstext: Absätze, Zwischentitel, Hinweis, Aufzählung, Fett, Kursiv, Links mit geprüftem Ziel. */
export const fliesstext = defineType({
  name: "fliesstext",
  title: "Text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [{ title: "Absatz", value: "normal" }, { title: "Zwischentitel", value: "h2" }, { title: "Untertitel", value: "h3" }, { title: "Kleiner Titel", value: "h4" }, { title: "Hinweis (hervorgehoben)", value: "hinweis" }],
      lists: [{ title: "Aufzählung", value: "bullet" }],
      marks: {
        decorators: [{ title: "Fett", value: "strong" }, { title: "Kursiv", value: "em" }],
        annotations: [defineArrayMember({ name: "link", type: "object", title: "Link", fields: [defineField({ name: "href", title: "Ziel", type: "string", validation: (r) => r.required().custom(linkzielErlaubt) })] })],
      },
    }),
  ],
});

/** Kurzform für ein einfaches Pflicht-Textfeld mit Schreibweise-Prüfung (einzeilig, mit `zeilen` mehrzeilig). */
export function text(name: string, title: string, description?: string, zeilen?: number) {
  return zeilen
    ? defineField({ name, title, description, type: "text", rows: zeilen, validation: (r) => r.required().custom(schreibweise) })
    : defineField({ name, title, description, type: "string", validation: (r) => r.required().custom(schreibweise) });
}
export function textOptional(name: string, title: string, description?: string, zeilen?: number) {
  return zeilen
    ? defineField({ name, title, description, type: "text", rows: zeilen, validation: (r) => r.custom(schreibweise) })
    : defineField({ name, title, description, type: "string", validation: (r) => r.custom(schreibweise) });
}
/** Wie text(), aber ohne deutsche Schreibweise-Prüfung (Sprachfassungen). */
export function fremdtext(name: string, title: string, description?: string, zeilen?: number) {
  return zeilen ? defineField({ name, title, description, type: "text", rows: zeilen, validation: (r) => r.required() }) : defineField({ name, title, description, type: "string", validation: (r) => r.required() });
}
export const zeilenFeld = (name: string, title: string, description?: string, pflicht = true) =>
  defineField({ name, title, description, type: "array", of: [defineArrayMember({ type: "string", validation: (r) => r.custom(schreibweise) })], validation: pflicht ? (r) => r.required().min(1) : undefined, initialValue: [] });

export const seoFelder = [
  defineField({ name: "seoTitel", title: "Seitentitel für Suchmaschinen", type: "string", description: "Erscheint im Browser-Tab und in Suchergebnissen. «advokatur kanonengasse» wird automatisch angehängt.", group: "seo", validation: (r) => r.required().max(60) }),
  defineField({ name: "seoBeschreibung", title: "Beschreibung für Suchmaschinen", type: "text", rows: 3, description: "Ein bis zwei Sätze, 50 bis 170 Zeichen.", group: "seo", validation: (r) => r.required().min(50).max(170) }),
];
export const seoGruppe = [{ name: "inhalt", title: "Inhalt", default: true }, { name: "seo", title: "Suchmaschinen" }];
