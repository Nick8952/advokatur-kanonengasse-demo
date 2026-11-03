"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Die Rechtsgebiete als «Schiene». Grundversion (Server-HTML, ohne Skript, unter 64 rem, bei reduzierter Bewegung, rechts nach links):
 * gestapelte Karten, die beim Scrollen nacheinander oben kleben (reines CSS). Erweiterung: Ab 64 rem mit erlaubter Bewegung, links nach
 * rechts und Unterstützung für view-timeline setzt dieses Skript die Klasse «gepinnt» und misst den Überhang der Spur (Breite der Spur minus
 * Fensterbreite) als CSS-Variable; die Fahrt selbst rechnet der Browser über eine scroll-getriebene Animation (--p). Erhält eine Karte den
 * Tastaturfokus, wird das Fenster vertikal so weit gescrollt, dass die Karte sichtbar ist.
 */
export function Schiene({ id, labelledBy, kopf, children }: { id?: string; labelledBy: string; kopf: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const s = ref.current;
    if (!s) return;
    const spur = s.querySelector<HTMLElement>(".schiene-spur");
    const fenster = s.querySelector<HTMLElement>(".schiene-fenster");
    if (!spur || !fenster) return;
    const faehig = typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()") && document.documentElement.dir !== "rtl";
    if (!faehig) return;
    const mq = matchMedia("(min-width: 64rem) and (prefers-reduced-motion: no-preference)");
    const messen = () => {
      if (!mq.matches) { s.classList.remove("gepinnt"); s.style.removeProperty("--ueberhang"); return; }
      s.classList.add("gepinnt");
      const ueberhang = Math.max(0, Math.round(spur.scrollWidth - fenster.clientWidth));
      s.style.setProperty("--ueberhang", `${ueberhang}px`);
    };
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(spur);
    ro.observe(fenster);
    mq.addEventListener("change", messen);
    const fokus = (ev: FocusEvent) => {
      if (!s.classList.contains("gepinnt")) return;
      const karte = (ev.target as HTMLElement).closest<HTMLElement>(".karte-gebiet");
      if (!karte) return;
      const r = karte.getBoundingClientRect();
      const delta = r.left + r.width / 2 - innerWidth / 2;
      const oben = s.getBoundingClientRect().top + scrollY;
      const ueberhang = parseFloat(s.style.getPropertyValue("--ueberhang")) || 0;
      const ziel = Math.min(Math.max(scrollY + delta, oben), oben + ueberhang);
      if (Math.abs(ziel - scrollY) > 1) scrollTo({ top: ziel, behavior: "instant" });
    };
    s.addEventListener("focusin", fokus);
    return () => { ro.disconnect(); mq.removeEventListener("change", messen); s.removeEventListener("focusin", fokus); s.classList.remove("gepinnt"); s.style.removeProperty("--ueberhang"); };
  }, []);
  return (
    <section ref={ref} id={id} className="schiene" aria-labelledby={labelledBy}>
      <div className="schiene-kleber">
        <div className="behaelter">{kopf}</div>
        <div className="schiene-fenster behaelter">
          <ul className="schiene-spur">{children}</ul>
        </div>
        <div className="behaelter"><div className="schiene-balken" aria-hidden="true" /></div>
      </div>
    </section>
  );
}
