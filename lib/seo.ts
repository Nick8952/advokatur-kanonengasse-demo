import type { Metadata } from "next";
import type { Bild, Kanzlei, Person, Rechtsgebiet, Texte } from "./content/modell";
import { pfade } from "./content/pfade";
import { indexierungErlaubt, siteUrl } from "./deploy-ziel";
import { telLink } from "./assets";

export { indexierungErlaubt };

const robots = () => (indexierungErlaubt ? { index: true, follow: true } : { index: false, follow: false });
/** Lokale Pfade bekommen die Site-URL (samt Unterpfad auf GitHub Pages). */
export const absolut = (url: string) => (/^https?:\/\//.test(url) ? url : `${siteUrl}${url}`);

const OG_LOCALE: Record<string, string> = { de: "de_CH", en: "en_GB", fr: "fr_CH", it: "it_CH", es: "es_ES", ar: "ar_AR" };

/**
 * hreflang nur für Seiten, die einander tatsächlich entsprechen: die Startseite (Deutsch) und die fünf Sprachseiten sind
 * dieselbe «Willkommen»-Seite in sechs Sprachen. Alle anderen deutschen Seiten haben keine Entsprechung und bekommen keine Alternates.
 */
export function sprachAlternates(texte: Texte): Record<string, string> {
  const liste: Record<string, string> = {};
  for (const s of texte.sprachen) liste[s.lang] = `${siteUrl}${pfade.sprache(s.code)}`;
  liste["x-default"] = `${siteUrl}/`;
  return liste;
}

/**
 * Metadaten einer Seite. `pfad` ist der Pfad ohne Unterpfad («/kontakt/»); Canonical und Open Graph zeigen immer auf die
 * tatsächliche Adresse der laufenden Installation (Demo: GitHub Pages, später: SITE_URL der Kanzleidomain).
 */
export function seitenMetadaten(opt: { titel: string; beschreibung: string; pfad: string; bild?: Bild; kanzlei: Kanzlei; texte: Texte; istStart?: boolean; sprache?: string; alternates?: Record<string, string>; profil?: boolean }): Metadata {
  const { titel, pfad, kanzlei: k, texte: t, beschreibung } = opt;
  const b = opt.bild ?? k.seoBild;
  const groesste = b.quellen.webp[b.quellen.webp.length - 1];
  const sprache = opt.sprache ?? "de";
  return {
    title: opt.istStart ? { absolute: `${k.name}: ${titel}` } : titel,
    description: beschreibung,
    alternates: { canonical: `${siteUrl}${pfad}`, ...(opt.alternates ? { languages: opt.alternates } : {}) },
    openGraph: {
      title: opt.istStart ? `${k.name}: ${titel}` : `${titel} | ${t.seo.titelZusatz}`,
      description: beschreibung,
      url: `${siteUrl}${pfad}`,
      siteName: k.name,
      locale: OG_LOCALE[sprache] ?? "de_CH",
      type: opt.profil ? "profile" : "website",
      images: [{ url: absolut(groesste.url), width: b.breite, height: b.hoehe, alt: b.alt }],
    },
    robots: robots(),
  };
}

const adresse = (k: Kanzlei) => ({ "@type": "PostalAddress", streetAddress: k.besuchsadresse.strasse, postalCode: k.besuchsadresse.plz, addressLocality: k.besuchsadresse.ort, addressCountry: "CH" });
const personId = (slug: string) => `${siteUrl}${pfade.person(slug)}#person`;
const KANZLEI_ID = () => `${siteUrl}/#kanzlei`;
void KANZLEI_ID;

/**
 * Strukturierte Daten für die Kanzlei (schema.org LegalService) und die Personen (Person). Nur mit INDEXIERUNG=1 ausgegeben und nur
 * mit belegten Angaben: Name, Adresse, Telefon, E-Mail, Beratungssprachen aus den Profilen, Rechtsgebiete als Stichworte; Personen mit
 * Funktion im Wortlaut. Keine Öffnungszeiten (Telefonzeiten sind keine Öffnungszeiten), keine Bewertungen, keine Honorare, keine Gründung,
 * kein Einzugsgebiet, keine Anstellungsverhältnisse.
 */
export function kanzleiJsonLd(k: Kanzlei, personen: Person[], rechtsgebiete: Rechtsgebiet[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LegalService",
        "@id": KANZLEI_ID(),
        name: k.name,
        url: `${siteUrl}/`,
        image: absolut(k.seoBild.quellen.webp[k.seoBild.quellen.webp.length - 1].url),
        telephone: telLink(k.telefon).replace("tel:", ""),
        email: k.email,
        address: adresse(k),
        // Beratungssprachen nur aus den Profilen (belegt), nicht aus den Sprachen der Website
        availableLanguage: [...new Set(personen.flatMap((p) => p.sprachen.map((x) => x.name)))].sort((a, b) => a.localeCompare(b, "de")),
        knowsAbout: rechtsgebiete.map((r) => r.titel),
      },
      ...personen.map((p) => personJsonLd(p, k, false)),
    ],
  };
}

export function personJsonLd(p: Person, k: Kanzlei, mitKontext = true) {
  const portrait = absolut(p.portrait.quellen.webp[p.portrait.quellen.webp.length - 1].url);
  return {
    ...(mitKontext ? { "@context": "https://schema.org" } : {}),
    "@type": "Person",
    "@id": personId(p.slug),
    name: `${p.vorname} ${p.nachname}`,
    givenName: p.vorname,
    familyName: p.nachname,
    jobTitle: p.rolle,
    image: portrait,
    url: `${siteUrl}${pfade.person(p.slug)}`,
    telephone: telLink(p.telefon).replace("tel:", ""),
    ...(p.email ? { email: p.email } : {}),
    // Keine Arbeitgeber- oder Mitgliedsbeziehung (employee, worksFor, member): Die Bürogemeinschaft ist belegt, ein
    // Anstellungsverhältnis nicht. Die Zugehörigkeit steht in der Rolle (jobTitle) im Wortlaut der Kanzlei.
    knowsLanguage: p.sprachen.map((s) => s.name),
    ...(p.rechtsgebiete.length ? { knowsAbout: p.rechtsgebiete.map((r) => r.text) } : {}),
  };
}

/** JSON für ein <script type="application/ld+json">: «<» wird maskiert, damit Inhalte das Skript nicht beenden können. */
export function jsonLdSicher(daten: unknown): string {
  return JSON.stringify(daten).replace(/</g, "\\u003c");
}
