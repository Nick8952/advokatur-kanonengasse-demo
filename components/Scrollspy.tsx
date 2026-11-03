"use client";

import { useEffect, useRef, useState } from "react";

export type IndexGruppe = { titel?: string; eintraege: { id: string; text: string; zaehler?: number }[] };

/**
 * Index-Navigation mit Scrollspy: Sprungmarken zu Abschnitten derselben Seite; der Abschnitt auf der Messlinie bei einem Viertel der Fensterhöhe ist «aktuell»
 * (aria-current="true", nie auf mehreren Einträgen). Unter 64 rem eine klebende, horizontal scrollbare Chip-Reihe, die den aktuellen Chip
 * nachführt; ab 64 rem eine klebende Spalte. Ohne JavaScript sind es gewöhnliche Sprungmarken.
 */
export function Scrollspy({ gruppen, label }: { gruppen: IndexGruppe[]; label: string }) {
  const [aktiv, setAktiv] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const ids = gruppen.flatMap((g) => g.eintraege.map((e) => e.id));
  useEffect(() => {
    const ziele = ids.map((id) => document.getElementById(id)).filter((x): x is HTMLElement => !!x);
    if (!ziele.length || typeof IntersectionObserver === "undefined") return;
    const sichtbar = new Map<string, number>();
    const io = new IntersectionObserver((eintraege) => {
      for (const e of eintraege) { if (e.isIntersecting) sichtbar.set(e.target.id, e.boundingClientRect.top); else sichtbar.delete(e.target.id); }
      if (!sichtbar.size) return;
      // Messlinie bei 25 % der Fensterhöhe: aktuell ist der Abschnitt, der sie schneidet (bei zweien der zuletzt begonnene)
      const juengster = [...sichtbar.entries()].sort((a, b) => b[1] - a[1])[0][0];
      setAktiv(juengster);
    }, { rootMargin: "-25% 0px -73% 0px", threshold: [0, 0.001] });
    ziele.forEach((z) => io.observe(z));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);
  // Chip-Reihe (schmal): aktuellen Chip in Sicht halten, ohne die Seite zu scrollen
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !aktiv || nav.scrollWidth <= nav.clientWidth + 1) return;
    const link = nav.querySelector<HTMLElement>(`a[href="#${aktiv}"]`);
    if (!link) return;
    const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;
    nav.scrollTo({ left: link.offsetLeft - 16, behavior: ruhig ? "auto" : "smooth" });
  }, [aktiv]);
  return (
    <nav ref={navRef} className="index-nav" aria-label={label}>
      {gruppen.map((g, gi) => (
        <div key={gi} className="contents">
          {g.titel ? <p className="index-gruppe">{g.titel}</p> : null}
          {g.eintraege.map((e) => (
            <a key={e.id} href={`#${e.id}`} className="index-link" aria-current={aktiv === e.id ? "true" : undefined}>
              {e.text}
              {typeof e.zaehler === "number" ? <span className="zaehler zahl">{e.zaehler}</span> : null}
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
}
