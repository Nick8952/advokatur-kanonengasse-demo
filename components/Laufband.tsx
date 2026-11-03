"use client";

import { useEffect, useRef, useState } from "react";
import { PauseSymbol, PlaySymbol } from "./Pfeil";

/**
 * Laufband mit den sechs Willkommensworten der bisherigen Startseite (je in ihrer Sprache). Die Wörter sind dekorativ (aria-hidden), weil
 * die Sprachen daneben als Links stehen. Es läuft langsam, hält bei Mausberührung, ausserhalb des Fensters und auf Knopfdruck an
 * («Laufband anhalten» / «Laufband fortsetzen», WCAG 2.2.2); der Zustand liegt nur im Speicher der Seite. Bei reduzierter Bewegung steht es,
 * bricht um, und der Knopf entfällt.
 */
export function Laufband({ eintraege, anhalten, fortsetzen }: { eintraege: { gruss: string; lang: string }[]; anhalten: string; fortsetzen: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [angehalten, setAngehalten] = useState(false);
  const [imFenster, setImFenster] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setImFenster(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="laufband" data-pause={angehalten || !imFenster ? "true" : undefined}>
      <div className="laufband-spur" aria-hidden="true">
        {[0, 1].map((i) => (
          <div key={i} className={`laufband-gruppe${i ? " doppel" : ""}`}>
            {eintraege.map((e) => <span key={e.lang} lang={e.lang}>{e.gruss}</span>)}
          </div>
        ))}
      </div>
      <button type="button" className="laufband-knopf" onClick={() => setAngehalten((a) => !a)}>
        {angehalten ? <PlaySymbol /> : <PauseSymbol />}
        {angehalten ? fortsetzen : anhalten}
      </button>
    </div>
  );
}
