import Link from "next/link";

export type SprachFenster = { code: string; name: string; nameDeutsch: string; gruss: string; lang: string; pfad: string; aktuell: boolean };

/**
 * Die sechs Sprachfenster: Gruss in der jeweiligen Sprache (wie auf der bisherigen Startseite) und darunter der ausgeschriebene
 * Sprachname. Drei mal zwei Zellen, die aktuelle Sprache in Orange. Keine Flaggen.
 */
export function Sprachfenster({ sprachen, titel, aktuellLabel }: { sprachen: SprachFenster[]; titel: string; aktuellLabel: string }) {
  return (
    <nav aria-label={titel}>
      <h2 className="nur-sr">{titel}</h2>
      <ul className="fenster-raster fenster-raster-sprachen">
        {sprachen.map((s) => (
          <li key={s.code} className={`fenster fenster-sprache${s.aktuell ? " fenster-akzent" : ""}`}>
            <span className="gruss" lang={s.lang} aria-hidden="true">{s.gruss}</span>
            <Link href={s.pfad} className="fenster-link fenster-text" lang={s.lang} hrefLang={s.lang} aria-current={s.aktuell ? "true" : undefined}>
              {s.name}
              {s.aktuell ? <span className="nur-sr"> ({aktuellLabel})</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
