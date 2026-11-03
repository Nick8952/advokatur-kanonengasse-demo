import type { Block, Inline } from "./modell";

/**
 * Kleine Auszeichnung für lokale Texte: **fett**, *kursiv* und [Linktext](Ziel). Mehr braucht die Website nicht.
 * Die lokale Quelle wandelt damit Zeichenketten in das Fliesstext-Modell (`Block`) um; Sanity liefert Portable Text,
 * den lib/content/sanity.ts in dasselbe Modell überführt.
 */
export function inline(text: string): Inline[] {
  const teile: Inline[] = [];
  const muster = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let pos = 0;
  for (let m = muster.exec(text); m; m = muster.exec(text)) {
    if (m.index > pos) teile.push(text.slice(pos, m.index));
    if (m[1] !== undefined) teile.push({ text: m[1], fett: true });
    else if (m[2] !== undefined) teile.push({ text: m[2], kursiv: true });
    else teile.push({ text: m[3], link: m[4] });
    pos = m.index + m[0].length;
  }
  if (pos < text.length) teile.push(text.slice(pos));
  return teile;
}

/** Rohform in lokalen JSON-Dateien: Zeichenkette = Absatz, { titel } = Zwischentitel, { liste } = Aufzählung, { hinweis } = hervorgehobener Hinweis. */
export type RohBlock = string | { titel: string; stufe?: 2 | 3 | 4 } | { liste: string[] } | { hinweis: string };

/** Sprungmarke aus einem Titel, identisch für lokale Inhalte und Sanity (Portable Text kennt keine eigenen Anker). */
export function anker(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-$/, "") || "abschnitt";
}

/** Vergibt jedem Zwischentitel eine eindeutige Sprungmarke aus seinem Text (bei Wiederholungen «-2», «-3» …). */
export function ankerVergeben(bloecke: Block[]): Block[] {
  const gesehen = new Map<string, number>();
  return bloecke.map((b) => {
    if (b.art !== "titel") return b;
    const basis = anker(b.text);
    const n = (gesehen.get(basis) ?? 0) + 1;
    gesehen.set(basis, n);
    return { ...b, anker: n === 1 ? basis : `${basis}-${n}` };
  });
}

export function bloecke(roh: RohBlock[]): Block[] {
  return ankerVergeben(
    roh.map((b): Block => {
      if (typeof b === "string") return { art: "absatz", inhalt: inline(b) };
      if ("liste" in b) return { art: "liste", punkte: b.liste.map(inline) };
      if ("hinweis" in b) return { art: "hinweis", inhalt: inline(b.hinweis) };
      return { art: "titel", stufe: b.stufe ?? 2, text: b.titel, anker: anker(b.titel) };
    }),
  );
}

/** Reiner Text eines Inline-Abschnitts (für Prüfungen und Vorschauen). */
export function inlineText(teile: Inline[]): string {
  return teile.map((t) => (typeof t === "string" ? t : t.text)).join("");
}

/** Reiner Text eines Blocks. */
export function blockText(b: Block): string {
  if (b.art === "titel") return b.text;
  if (b.art === "liste") return b.punkte.map(inlineText).join("\n");
  return inlineText(b.inhalt);
}

/** Zwischentitel eines Textes als Inhaltsverzeichnis. */
export function inhaltsverzeichnis(bloecke: Block[]): { stufe: 2 | 3 | 4; text: string; anker: string }[] {
  return bloecke.flatMap((b) => (b.art === "titel" ? [{ stufe: b.stufe, text: b.text, anker: b.anker }] : []));
}
