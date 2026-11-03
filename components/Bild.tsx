// Die Bildvarianten sind mit sharp vorgerendert (statischer Export ohne Bild-Optimierer), deshalb <picture>/<img> statt next/image.
import type { Bild as BildTyp } from "@/lib/content/modell";
import { assetUrl } from "@/lib/assets";

const srcset = (varianten: { breite: number; url: string }[]) => varianten.map((v) => `${assetUrl(v.url)} ${v.breite}w`).join(", ");

/**
 * Bild mit festen Abmessungen (kein Layoutsprung), AVIF mit WebP-Rückfall und passenden Grössen je Viewport.
 * `alt` überschreibt den Alternativtext des Bildes, zum Beispiel "" für rein dekorative Wiederholungen.
 */
export function Bild({ bild, sizes, className, prio = false, alt }: { bild: BildTyp; sizes: string; className?: string; prio?: boolean; alt?: string }) {
  const groesste = bild.quellen.webp[bild.quellen.webp.length - 1];
  return (
    <picture className="contents">
      {bild.quellen.avif.length ? <source type="image/avif" srcSet={srcset(bild.quellen.avif)} sizes={sizes} /> : null}
      <source type="image/webp" srcSet={srcset(bild.quellen.webp)} sizes={sizes} />
      <img
        src={assetUrl(groesste.url)}
        alt={alt ?? bild.alt}
        width={bild.breite}
        height={bild.hoehe}
        loading={prio ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={prio ? "high" : undefined}
        className={className}
        style={{ maxWidth: `${bild.breite}px` }}
      />
    </picture>
  );
}

/** Bild mit Legende (Bildlegende aus dem Bild oder ausdrücklich übergeben). Bilder werden nie über ihre Originalbreite hinaus vergrössert. */
export function Figur({ bild, sizes, legende, className, prio }: { bild: BildTyp; sizes: string; legende?: string; className?: string; prio?: boolean }) {
  const text = legende ?? bild.legende;
  return (
    <figure className={`figur ${className ?? ""}`.trim()}>
      <Bild bild={bild} sizes={sizes} prio={prio} className="block h-auto w-full" />
      {text ? <figcaption>{text}</figcaption> : null}
    </figure>
  );
}
