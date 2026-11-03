/**
 * Adressen der Seiten (ohne Unterpfad; den setzt next/link bzw. assetUrl).
 * Bewusst ohne Abhängigkeiten: Diese Datei darf in Client-Komponenten landen.
 * Deutsch liegt an der Wurzel, die übrigen Sprachfassungen unter /en/, /fr/, /it/, /es/, /ar/ (je eine Seite).
 */
export const SPRACHCODES = ["de", "en", "fr", "it", "es", "ar"] as const;
export type Sprachcode = (typeof SPRACHCODES)[number];

export const pfade = {
  start: "/",
  rechtsgebiete: "/rechtsgebiete/",
  rechtsgebiet: (slug: string) => `/rechtsgebiete/#${slug}`,
  team: "/team/",
  person: (slug: string) => `/team/${slug}/`,
  mitarbeit: "/mitarbeit/",
  kontakt: "/kontakt/",
  impressum: "/impressum/",
  datenschutz: "/datenschutz/",
  fehler: "/404/",
  sprache: (code: Sprachcode) => (code === "de" ? "/" : `/${code}/`),
} as const;

/** Sprungmarken der Sprachseiten; die deutschen Seiten haben dieselben Abschnitte als eigene Seiten (Kontext beim Sprachwechsel). */
export const SPRACHSEITEN_ANKER = { kanzlei: "kanzlei", rechtsgebiete: "rechtsgebiete", team: "team", kontakt: "kontakt" } as const;

/** Welche deutsche Seite welchem Abschnitt der Sprachseiten entspricht (für den Sprachwechsel mit erhaltenem Kontext). */
export function abschnittZuPfad(deutscherPfad: string): keyof typeof SPRACHSEITEN_ANKER | null {
  if (deutscherPfad === pfade.start) return "kanzlei";
  if (deutscherPfad.startsWith(pfade.rechtsgebiete)) return "rechtsgebiete";
  if (deutscherPfad.startsWith(pfade.team)) return "team";
  if (deutscherPfad.startsWith(pfade.kontakt)) return "kontakt";
  return null;
}
