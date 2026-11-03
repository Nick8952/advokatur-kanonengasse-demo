"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Das Register: alle Hauptseiten in einer Zeile, auf jeder Breite (fünf kurze Wörter), ohne Menü-Dialog.
 * Die aktuelle Seite trägt aria-current="page"; Unterseiten (Profile) markieren ihre Hauptseite (Team).
 */
export function Register({ eintraege, label }: { eintraege: { text: string; ziel: string }[]; label: string }) {
  const pfad = usePathname() ?? "/";
  const aktuell = eintraege.find((e) => (e.ziel === "/" ? pfad === "/" : pfad.startsWith(e.ziel)))?.ziel;
  return (
    <nav className="register" aria-label={label}>
      {eintraege.map((e) => (
        <Link key={e.ziel} href={e.ziel} className="register-link" aria-current={e.ziel === aktuell ? "page" : undefined}>
          {e.text}
        </Link>
      ))}
    </nav>
  );
}
