"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export type SprachEintrag = { code: string; name: string; nameDeutsch: string; lang: string; pfad: string; aktuell: boolean };

/**
 * Sprachwahl als <details>: funktioniert ohne JavaScript (auf- und zuklappen, Links). Mit JavaScript schliesst sie sich bei Klick
 * ausserhalb und bei Escape. Alle Sprachen stehen ausgeschrieben in ihrer eigenen Schreibweise, dazu der deutsche Name;
 * keine Flaggen. Jeder Eintrag trägt lang und hreflang, der aktuelle aria-current.
 */
export function Sprachwahl({ eintraege, label, titel, aktuellLabel }: { eintraege: SprachEintrag[]; label: string; titel: string; aktuellLabel: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const aktuell = eintraege.find((e) => e.aktuell) ?? eintraege[0];
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const klick = (ev: MouseEvent) => { if (d.open && !d.contains(ev.target as Node)) d.open = false; };
    const taste = (ev: KeyboardEvent) => { if (ev.key === "Escape" && d.open) { d.open = false; d.querySelector("summary")?.focus(); } };
    document.addEventListener("click", klick);
    document.addEventListener("keydown", taste);
    return () => { document.removeEventListener("click", klick); document.removeEventListener("keydown", taste); };
  }, []);
  return (
    <details ref={ref} className="sprachwahl">
      <summary aria-label={`${label}: ${aktuell.name}. ${titel}`}>
        <span aria-hidden="true"><span className="sprachwahl-praefix">{label}: </span><span lang={aktuell.lang}>{aktuell.name}</span></span>
      </summary>
      <ul className="sprachwahl-liste" aria-label={titel}>
        {eintraege.map((e) => (
          <li key={e.code}>
            <Link href={e.pfad} lang={e.lang} hrefLang={e.lang} aria-current={e.aktuell ? "true" : undefined} onClick={() => { if (ref.current) ref.current.open = false; }}>
              <span>{e.name}{e.aktuell ? <span className="nur-sr"> ({aktuellLabel})</span> : null}</span>
              {e.nameDeutsch !== e.name ? <span className="sprache-deutsch" lang="de">{e.nameDeutsch}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
