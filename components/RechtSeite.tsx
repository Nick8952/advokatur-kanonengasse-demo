import { RichText } from "./RichText";
import { Seitenkopf } from "./Seitenkopf";
import type { Bildnachweis, RechtSeite as RechtSeiteTyp } from "@/lib/content/modell";

/** Impressum und Datenschutzerklärung: Seitenkopf mit Einleitung und Stand, Fliesstext; das Impressum trägt am Ende den Bildnachweis (#bildnachweis). */
export function RechtSeite({ seite: s, etikett, standLabel, bildnachweise, bildnachweisTitel }: { seite: RechtSeiteTyp; etikett: string; standLabel: string; bildnachweise?: Bildnachweis[]; bildnachweisTitel?: string }) {
  return (
    <article>
      <Seitenkopf etikett={etikett} titel={s.titel} kinder={<>{s.einleitung ? <p className="vorspann">{s.einleitung}</p> : null}<p className="meta">{standLabel}: {s.stand}</p></>} />
      <div className="behaelter abschnitt grid gap-8">
        <RichText bloecke={s.bloecke} />
        {bildnachweise && bildnachweisTitel ? (
          <section id="bildnachweis" aria-labelledby="bildnachweis-titel" className="richtext scroll-mt-24">
            <h2 id="bildnachweis-titel">{bildnachweisTitel}</h2>
            <ul>
              {bildnachweise.map((b) => (
                <li key={b.quelle}><strong>{b.titel}</strong>: {b.urheber}. Quelle: <span className="break-all">{b.quelle}</span>. {b.lizenz}.</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}
