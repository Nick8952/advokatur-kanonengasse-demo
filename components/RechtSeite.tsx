import { RichText } from "./RichText";
import type { Bildnachweis, RechtSeite as RechtSeiteTyp } from "@/lib/content/modell";

/** Impressum und Datenschutzerklärung: Einleitung, Stand, Fliesstext; das Impressum trägt am Ende den Bildnachweis (#bildnachweis). */
export function RechtSeite({ seite: s, standLabel, bildnachweise, bildnachweisTitel }: { seite: RechtSeiteTyp; standLabel: string; bildnachweise?: Bildnachweis[]; bildnachweisTitel?: string }) {
  return (
    <article className="behaelter abschnitt grid gap-8">
      <header className="grid gap-4">
        <h1 className="titel-1">{s.titel}</h1>
        {s.einleitung ? <p className="vorspann">{s.einleitung}</p> : null}
        <p className="meta">{standLabel}: {s.stand}</p>
      </header>
      <RichText bloecke={s.bloecke} />
      {bildnachweise && bildnachweisTitel ? (
        <section id="bildnachweis" aria-labelledby="bildnachweis-titel" className="richtext scroll-mt-6">
          <h2 id="bildnachweis-titel">{bildnachweisTitel}</h2>
          <ul>
            {bildnachweise.map((b) => (
              <li key={b.quelle}><strong>{b.titel}</strong>: {b.urheber}. Quelle: <span className="break-all">{b.quelle}</span>. {b.lizenz}.</li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
