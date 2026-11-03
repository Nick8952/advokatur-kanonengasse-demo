"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

// Vor dem ersten Bild nach einem Seitenwechsel ausführen, damit neuer Inhalt nie unsichtbar gezeichnet wird (auf dem Server gibt es kein Layout)
const useVorDemZeichnen = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Enthüllung beim Scrollen. Grundzustand ist sichtbar: Erst wenn dieses Skript läuft und Bewegung erlaubt ist, erhält <html> die Klasse
 * «bewegung-bereit»; davor werden Elemente, die schon im Fenster stehen, sofort als sichtbar markiert, damit nichts aufblitzt. Elemente
 * unterhalb des Fensters erscheinen über einen IntersectionObserver; ein MutationObserver nimmt Elemente auf, die später gerendert werden
 * (zum Beispiel gefilterte Teamlisten). Bei jedem Seitenwechsel werden die Beobachter und die Klasse abgebaut und vor dem ersten Bild der
 * neuen Seite neu gesetzt (Layout-Effekt), damit nichts für einen Frame unsichtbar ist.
 * Ohne JavaScript, bei prefers-reduced-motion: reduce oder ohne IntersectionObserver bleibt alles sichtbar, ohne Übergang.
 */
export function Bewegung() {
  const pfad = usePathname();
  useVorDemZeichnen(() => {
    const html = document.documentElement;
    const reduziert = matchMedia("(prefers-reduced-motion: reduce)");
    if (reduziert.matches || typeof IntersectionObserver === "undefined") { html.classList.remove("bewegung-bereit"); return; }
    const wurzel = document.getElementById("inhalt") ?? document.body;
    const io = new IntersectionObserver((eintraege) => {
      for (const e of eintraege) if (e.isIntersecting) { e.target.classList.add("sichtbar"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    const aufnehmen = (el: HTMLElement) => {
      if (el.classList.contains("sichtbar")) return;
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.94 && r.bottom > 0) el.classList.add("sichtbar");
      else io.observe(el);
    };
    const sammeln = (knoten: ParentNode) => knoten.querySelectorAll<HTMLElement>("[data-reveal]").forEach(aufnehmen);
    sammeln(wurzel);
    html.classList.add("bewegung-bereit");
    const mo = new MutationObserver((liste) => {
      for (const m of liste) m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        if (n.matches("[data-reveal]")) aufnehmen(n);
        sammeln(n);
      });
    });
    mo.observe(wurzel, { childList: true, subtree: true });
    const umschalten = () => { if (reduziert.matches) { html.classList.remove("bewegung-bereit"); io.disconnect(); mo.disconnect(); } };
    reduziert.addEventListener("change", umschalten);
    return () => { io.disconnect(); mo.disconnect(); reduziert.removeEventListener("change", umschalten); html.classList.remove("bewegung-bereit"); };
  }, [pfad]);
  return null;
}
