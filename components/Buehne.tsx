import type { ReactNode } from "react";
import type { Bild as BildTyp } from "@/lib/content/modell";
import { Bild } from "./Bild";

/**
 * Einstieg in voller Höhe: das Strassenfoto der bisherigen Website füllt die Bühne (Parallaxe beim Scrollen ab 48 rem, CSS), darüber ein
 * marineblauer Verlauf, unten Etikett, Titel, Vorspann, Handlungen, Fakten und die Sprachen. Das Foto bleibt ein frühes <picture>
 * (LCP), nichts wird nachgeladen. Bei reduzierter Bewegung steht das Bild still.
 */
export function Buehne({ id, foto, etikett, titel, titelId, vorspann, knoepfe, fakten, sprachen }: {
  id?: string; foto: BildTyp; etikett: string; titel: string; titelId: string; vorspann: string[]; knoepfe: ReactNode; fakten: ReactNode; sprachen: ReactNode;
}) {
  return (
    <section id={id} className="buehne" aria-labelledby={titelId}>
      <div className="buehne-bild">
        <Bild bild={foto} sizes="100vw" prio />
      </div>
      <div className="behaelter">
        <div className="buehne-inhalt">
          <p className="etikett">{etikett}</p>
          <h1 id={titelId} className="titel-riesig">{titel}</h1>
          {vorspann.map((a) => <p key={a} className="vorspann">{a}</p>)}
          <div className="flex flex-wrap gap-3">{knoepfe}</div>
          <p className="buehne-fakten">{fakten}</p>
          {sprachen}
        </div>
      </div>
      <span className="scrollhinweis" aria-hidden="true" />
    </section>
  );
}
