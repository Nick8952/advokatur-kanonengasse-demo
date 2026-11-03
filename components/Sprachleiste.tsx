import Link from "next/link";

export type SprachPille = { code: string; name: string; lang: string; pfad: string; aktuell: boolean };

/** Die sechs Sprachen als Pillen (ausgeschriebene Namen in eigener Schreibweise, keine Flaggen); die aktuelle Sprache ist markiert. */
export function Sprachleiste({ sprachen, titel, aktuellLabel, klasse = "buehne-sprachen" }: { sprachen: SprachPille[]; titel: string; aktuellLabel: string; klasse?: string }) {
  return (
    <nav aria-label={titel} className={klasse}>
      <h2>{titel}</h2>
      <ul className="pillen">
        {sprachen.map((s) => (
          <li key={s.code}>
            <Link href={s.pfad} className="pille" lang={s.lang} hrefLang={s.lang} aria-current={s.aktuell ? "true" : undefined}>
              {s.name}
              {s.aktuell ? <span className="nur-sr"> ({aktuellLabel})</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
