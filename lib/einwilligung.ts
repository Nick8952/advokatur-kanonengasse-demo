/**
 * Einwilligungsverwaltung (ohne Framework-Abhängigkeit), VORBEREITET.
 *
 * Derzeit bindet die Website keine Dienste Dritter ein: keine Karte, keine Videos, keine Analyse, keine externen Schriften.
 * Deshalb ist `texte.einwilligung.kategorien` leer, und es erscheint kein Banner (kein irreführendes Banner). Der Footer-Link
 * «Datenschutz-Einstellungen» öffnet dann nur einen Hinweis ohne Schalter.
 * Sobald eine Kategorie eingetragen wird (z. B. «karten» für eine eingebettete Karte), zeigt `components/Einwilligung.tsx`
 * den Banner mit «Alle akzeptieren», «Nur notwendige» und «Einstellungen»; die Entscheidung liegt in localStorage und ist über die
 * Fusszeile widerrufbar. Komponenten, die einen optionalen Dienst laden, prüfen vorher `erlaubt(kennung)`.
 */
export const SPEICHER_SCHLUESSEL = "ak-einwilligung";
/** Bei Änderungen an Kategorien oder Texten erhöhen: alte Entscheidungen gelten dann nicht mehr. */
export const VERSION = 1;

export type Einwilligung = { version: number; zeitpunkt: string; kategorien: Record<string, boolean> };

/** Zeichenkette aus localStorage in eine gültige Einwilligung überführen; sonst null (auch bei alter Version/kaputtem JSON). */
export function lesen(roh: string | null | undefined, bekannt: readonly string[]): Einwilligung | null {
  if (!roh) return null;
  try {
    const wert = JSON.parse(roh) as Partial<Einwilligung>;
    if (wert.version !== VERSION || typeof wert.zeitpunkt !== "string" || typeof wert.kategorien !== "object" || !wert.kategorien) return null;
    const kategorien: Record<string, boolean> = {};
    for (const k of bekannt) kategorien[k] = wert.kategorien[k] === true;
    return { version: VERSION, zeitpunkt: wert.zeitpunkt, kategorien };
  } catch {
    return null;
  }
}

export function erzeugen(kategorien: Record<string, boolean>, jetzt = new Date()): Einwilligung {
  return { version: VERSION, zeitpunkt: jetzt.toISOString(), kategorien };
}

/** Rückfall im Speicher: Im Privatmodus oder bei gesperrtem Speicher gilt die Entscheidung nur für diese Seite. */
let imSpeicher: string | null = null;

export function rohLesen(): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage.getItem(SPEICHER_SCHLUESSEL) ?? imSpeicher;
  } catch {
    // Speicher gesperrt
  }
  return imSpeicher;
}

export function speichern(einwilligung: Einwilligung | null): void {
  const roh = einwilligung ? JSON.stringify(einwilligung) : null;
  imSpeicher = roh;
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (roh === null) window.localStorage.removeItem(SPEICHER_SCHLUESSEL);
    else window.localStorage.setItem(SPEICHER_SCHLUESSEL, roh);
  } catch {
    // Speicher gesperrt: Entscheidung gilt nur für diese Seite
  }
}

/** Andere Komponenten (Banner, Einstellungen, künftige Einbettungen) hören auf dieses Ereignis. */
export const EREIGNIS = "ak-einwilligung-geaendert";

export function bekanntgeben(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EREIGNIS));
}

/** Ereignis, mit dem der Footer-Link den Dialog öffnet. */
export const OEFFNEN_EREIGNIS = "ak-einwilligung-oeffnen";
