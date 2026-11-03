import Link from "next/link";
import type { CSSProperties } from "react";
import type { Bild as BildTyp } from "@/lib/content/modell";
import { assetUrl } from "@/lib/assets";

export type Kachel = { slug: string; name: string; rolle: string; pfad: string; bild: Pick<BildTyp, "alt" | "breite" | "hoehe" | "quellen"> };

const srcset = (varianten: { breite: number; url: string }[]) => varianten.map((v) => `${assetUrl(v.url)} ${v.breite}w`).join(", ");

/** Eine Kachel je Person: quadratisches Portrait (zoomt leicht im Hover), Name als Link (die ganze Kachel ist klickbar), Rolle im Wortlaut der Quelle. */
export function Personenkachel({ k, i = 0, sizes = "(min-width: 64rem) 20rem, (min-width: 40rem) 33vw, 50vw" }: { k: Kachel; i?: number; sizes?: string }) {
  const groesste = k.bild.quellen.webp[k.bild.quellen.webp.length - 1];
  return (
    <li className="kachel" data-reveal style={{ "--i": i % 4 } as CSSProperties}>
      <div className="kachel-bild">
        <picture>
          {k.bild.quellen.avif.length ? <source type="image/avif" srcSet={srcset(k.bild.quellen.avif)} sizes={sizes} /> : null}
          <source type="image/webp" srcSet={srcset(k.bild.quellen.webp)} sizes={sizes} />
          <img src={assetUrl(groesste.url)} alt="" width={k.bild.breite} height={k.bild.hoehe} loading="lazy" decoding="async" />
        </picture>
      </div>
      <div className="kachel-inhalt">
        <Link href={k.pfad} className="kachel-link">{k.name}</Link>
        <span className="kachel-rolle">{k.rolle}</span>
      </div>
    </li>
  );
}
