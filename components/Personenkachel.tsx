import Link from "next/link";
import type { Bild as BildTyp } from "@/lib/content/modell";
import { assetUrl } from "@/lib/assets";

export type Kachel = { slug: string; name: string; rolle: string; pfad: string; bild: Pick<BildTyp, "alt" | "breite" | "hoehe" | "quellen"> };

const srcset = (varianten: { breite: number; url: string }[]) => varianten.map((v) => `${assetUrl(v.url)} ${v.breite}w`).join(", ");

/** Ein Fenster je Person: quadratisches Portrait, Name, Rolle im Wortlaut der Quelle. Die ganze Zelle ist der Link. */
export function Personenkachel({ k, sizes = "(min-width: 64rem) 20rem, (min-width: 40rem) 33vw, 50vw" }: { k: Kachel; sizes?: string }) {
  const groesste = k.bild.quellen.webp[k.bild.quellen.webp.length - 1];
  return (
    <li className="fenster fenster-person">
      <picture>
        {k.bild.quellen.avif.length ? <source type="image/avif" srcSet={srcset(k.bild.quellen.avif)} sizes={sizes} /> : null}
        <source type="image/webp" srcSet={srcset(k.bild.quellen.webp)} sizes={sizes} />
        <img src={assetUrl(groesste.url)} alt="" width={k.bild.breite} height={k.bild.hoehe} loading="lazy" decoding="async" />
      </picture>
      <div className="fenster-inhalt">
        <Link href={k.pfad} className="fenster-link fenster-titel">{k.name}</Link>
        <span className="fenster-text">{k.rolle}</span>
      </div>
    </li>
  );
}
