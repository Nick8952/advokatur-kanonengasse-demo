/**
 * Einziger Ort, an dem der GitHub-Pages-Unterpfad vor Datei-URLs gesetzt wird.
 * `next/link` erledigt das für Seitenlinks selbst; Bilder, Dokumente und CSS-Hintergründe brauchen diesen Helfer.
 * Als fremder Host ist nur das Sanity-CDN erlaubt (für den späteren Betrieb mit Sanity; die Website liefert aber
 * auch dann aus einem lokalen Spiegel, siehe scripts/sanity-bilder.mts).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetUrl(pfad: string): string {
  if (/^https:\/\/cdn\.sanity\.io\//.test(pfad)) return pfad;
  if (/^([a-z]+:)?\/\//i.test(pfad) || /^[a-z]+:/i.test(pfad)) throw new Error(`assetUrl: nur lokale Pfade oder https://cdn.sanity.io/ sind erlaubt, nicht «${pfad.slice(0, 60)}».`);
  if (!pfad.startsWith("/")) return `${basePath}/${pfad}`;
  return `${basePath}${pfad}`;
}

/** Interne Links («/kontakt/») bleiben; externe/Sonder-Links werden erkannt. */
export function istExternerLink(ziel: string): boolean {
  return /^(https?:|mailto:|tel:)/.test(ziel);
}

/**
 * Erlaubte Linkziele (auch aus dem CMS): interner Pfad («/kontakt/», nicht «//host»), Sprungziel («#anker»), https://, mailto:, tel:.
 * Alles andere (javascript:, data:, http://, protokollrelative URLs) wird abgewiesen; dieselbe Regel gilt im Sanity-Schema.
 */
export function istErlaubtesLinkziel(ziel: string): boolean {
  if (/^\/(?![\/\\])[^\s\\]*$/.test(ziel) || /^#[A-Za-z][\w-]*$/.test(ziel) || /^(mailto:[^\s@]+@[^\s@]+|tel:\+?[\d\s()-]+)$/.test(ziel)) return true;
  return istHttpsAdresse(ziel);
}

/** Echte https-Adresse: parsebar, Protokoll https, Host vorhanden, keine Benutzerangaben, kein Leerraum oder Backslash. */
export function istHttpsAdresse(wert: string): boolean {
  if (!/^https:\/\/[^\s\\]+$/.test(wert)) return false;
  try {
    const u = new URL(wert);
    return u.protocol === "https:" && u.hostname.length > 0 && !u.username && !u.password;
  } catch {
    return false;
  }
}

/** Liefert das Ziel unverändert oder «#», wenn es nicht erlaubt ist (Schutz vor javascript:-Links aus Inhalten). */
export function sichererLink(ziel: string): string {
  return istErlaubtesLinkziel(ziel) ? ziel : "#";
}

/** «043 960 36 28» oder «+41 43 960 36 28» → «tel:+41439603628» */
export function telLink(nummer: string): string {
  const ziffern = nummer.replace(/\D/g, "");
  if (ziffern.startsWith("00")) return `tel:+${ziffern.slice(2)}`;
  if (ziffern.startsWith("0")) return `tel:+41${ziffern.slice(1)}`;
  return `tel:+${ziffern}`;
}

/** «+41 43 960 36 28» → «043 960 36 28» (Anzeige für Besucherinnen und Besucher in der Schweiz) */
export function telefonAnzeige(telefon: string): string {
  return telefon.replace(/^\+41\s?/, "0");
}
