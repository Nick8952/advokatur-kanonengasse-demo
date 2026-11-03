"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { Personenkachel, type Kachel } from "./Personenkachel";

export type FilterPerson = Kachel & { gruppe: string; gebiete: string[]; sprachen: string[] };
export type FilterTexte = { titel: string; rechtsgebiet: string; sprache: string; alle: string; zuruecksetzen: string; treffer: string; keineTreffer: string; hinweis: string };

/**
 * Team mit Filter nach Rechtsgebiet und Beratungssprache. Die Zuordnungen stammen vollständig aus den Profilen der bisherigen Website;
 * es werden nur Gebiete und Sprachen angeboten, die mindestens eine Person nennt. Die Filterknöpfe erscheinen erst nach dem Laden
 * (useSyncExternalStore liefert auf dem Server «nicht geladen»); ohne JavaScript steht die vollständige Personenliste ohne funktionslose
 * Bedienelemente da. Zustände liegen nur im Speicher, nie in der Adresse oder im Browser-Speicher.
 */
export function Teamfilter({ personen, gruppen, gebiete, sprachen, t }: { personen: FilterPerson[]; gruppen: { kennung: string; titel: string }[]; gebiete: { slug: string; titel: string }[]; sprachen: string[]; t: FilterTexte }) {
  const id = useId();
  const geladen = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [gebiet, setGebiet] = useState<string | null>(null);
  const [sprache, setSprache] = useState<string | null>(null);
  const aktiv = gebiet !== null || sprache !== null;
  const passt = (p: FilterPerson) => (gebiet === null || p.gebiete.includes(gebiet)) && (sprache === null || p.sprachen.includes(sprache));
  const treffer = personen.filter(passt);
  return (
    <div className="grid gap-10">
      {geladen ? <div className="filter" role="group" aria-labelledby={`${id}-titel`}>
        <p id={`${id}-titel`} className="titel-4">{t.titel}</p>
        <fieldset>
          <legend>{t.rechtsgebiet}</legend>
          <div className="filter-optionen">
            <button type="button" className="filter-option" aria-pressed={gebiet === null} onClick={() => setGebiet(null)}>{t.alle}</button>
            {gebiete.map((g) => (
              <button key={g.slug} type="button" className="filter-option" aria-pressed={gebiet === g.slug} onClick={() => setGebiet(gebiet === g.slug ? null : g.slug)}>{g.titel}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t.sprache}</legend>
          <div className="filter-optionen">
            <button type="button" className="filter-option" aria-pressed={sprache === null} onClick={() => setSprache(null)}>{t.alle}</button>
            {sprachen.map((s) => (
              <button key={s} type="button" className="filter-option" aria-pressed={sprache === s} onClick={() => setSprache(sprache === s ? null : s)}>{s}</button>
            ))}
          </div>
        </fieldset>
        <p className="klein text-rahmen-2">{t.hinweis}</p>
        <p role="status" aria-live="polite" className="klein flex flex-wrap items-center gap-x-4 gap-y-1">
          {aktiv ? <span>{treffer.length} {t.treffer} ({[gebiet ? gebiete.find((g) => g.slug === gebiet)?.titel : null, sprache].filter(Boolean).join(", ")})</span> : null}
          {aktiv ? <button type="button" className="textlink" onClick={() => { setGebiet(null); setSprache(null); }}>{t.zuruecksetzen}</button> : null}
        </p>
      </div> : null}
      {gruppen.map((g) => {
        const liste = treffer.filter((p) => p.gruppe === g.kennung);
        if (!liste.length) return null;
        return (
          <section key={g.kennung} aria-labelledby={`${id}-${g.kennung}`} className="grid gap-5">
            <h2 id={`${id}-${g.kennung}`} className="gruppe-titel titel-3">{g.titel}<span className="zaehler zahl">{liste.length}</span></h2>
            <ul className="portraits">
              {liste.map((p, i) => <Personenkachel key={p.slug} k={p} i={i} />)}
            </ul>
          </section>
        );
      })}
      {treffer.length === 0 ? <p className="hinweis">{t.keineTreffer}</p> : null}
    </div>
  );
}
