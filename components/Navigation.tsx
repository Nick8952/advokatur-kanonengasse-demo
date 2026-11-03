"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pfeil } from "./Pfeil";

export type NavEintrag = { text: string; ziel: string };

/**
 * Hauptnavigation. Variante «kopf»: die Einträge inline im Kopf (ab 64 rem sichtbar). Variante «menue»: grosse Liste im Menü-Dialog.
 * Deutsche Seiten: next/link mit aria-current="page" (Unterseiten wie Profile markieren ihre Hauptseite). Sprachseiten (anker): einfache
 * Sprungmarken auf derselben Seite, ohne aria-current.
 */
export function Navigation({ eintraege, label, variante, anker = false, beimWechsel }: { eintraege: NavEintrag[]; label: string; variante: "kopf" | "menue"; anker?: boolean; beimWechsel?: () => void }) {
  const pfad = usePathname() ?? "/";
  const aktuell = anker ? undefined : eintraege.find((e) => (e.ziel === "/" ? pfad === "/" : pfad.startsWith(e.ziel)))?.ziel;
  const klasse = variante === "kopf" ? "hauptnav-link" : undefined;
  const link = (e: NavEintrag) => {
    const current = !anker && e.ziel === aktuell ? ("page" as const) : undefined;
    const inhalt = variante === "menue" ? <>{e.text}<Pfeil groesse={22} /></> : e.text;
    return anker
      ? <a href={e.ziel} className={klasse} onClick={beimWechsel}>{inhalt}</a>
      : <Link href={e.ziel} className={klasse} aria-current={current} onClick={beimWechsel}>{inhalt}</Link>;
  };
  if (variante === "kopf") return <nav className="hauptnav" aria-label={label}>{eintraege.map((e) => <span key={e.ziel} className="contents">{link(e)}</span>)}</nav>;
  return (
    <nav className="menue-liste" aria-label={label}>
      <ul>{eintraege.map((e) => <li key={e.ziel}>{link(e)}</li>)}</ul>
    </nav>
  );
}
