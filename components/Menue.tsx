"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Navigation, type NavEintrag } from "./Navigation";
import { MenueSymbol, SchliessenSymbol } from "./Pfeil";
import { EMail, Telefon } from "./Telefon";

export type MenueSprache = { code: string; name: string; lang: string; pfad: string; aktuell: boolean };

/**
 * Menü für Handy und Tablet (unter 64 rem): ein Knopf öffnet ein natives <dialog> bildschirmfüllend über showModal() (modal, Escape,
 * Fokusfalle und Fokusrückgabe vom Browser). Der React-Zustand folgt dem Dialog über das close-Ereignis, nie umgekehrt. Linkklick und
 * Seitenwechsel schliessen das Menü. Inhalt: Hauptseiten gross, Sprachen als Pillen, Telefon und E-Mail.
 */
export function Menue({ titel, schliessen, eintraege, navLabel, anker, sprachen, sprachenTitel, aktuellLabel, kontaktTitel, telefon, email, anrufen }: {
  titel: string; schliessen: string; eintraege: NavEintrag[]; navLabel: string; anker?: boolean;
  sprachen: MenueSprache[]; sprachenTitel: string; aktuellLabel: string; kontaktTitel: string; telefon: string; email: string; anrufen: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [offen, setOffen] = useState(false);
  const pfad = usePathname();
  const zu = () => { const d = ref.current; if (d?.open) d.close(); };
  const auf = () => { const d = ref.current; if (d && !d.open) { d.showModal(); setOffen(true); } };
  // Seitenwechsel (auch Zurück-Taste) schliesst ein offenes Menü
  useEffect(() => { zu(); }, [pfad]);
  // Wird das Fenster breiter als 64 rem (Drehung, Vergrösserung), übernimmt die Hauptnavigation im Kopf: Menü schliessen
  useEffect(() => {
    const mq = matchMedia("(min-width: 64rem)");
    const wechsel = () => { if (mq.matches) zu(); };
    mq.addEventListener("change", wechsel);
    return () => mq.removeEventListener("change", wechsel);
  }, []);
  return (
    <>
      <button type="button" className="menue-knopf" aria-haspopup="dialog" aria-expanded={offen} onClick={auf}>
        <MenueSymbol />
        {titel}
      </button>
      <dialog ref={ref} className="menue" aria-label={titel} onClose={() => setOffen(false)}>
        <div className="menue-innen">
          <div className="menue-kopf">
            <strong>{titel}</strong>
            <button type="button" className="menue-schliessen" onClick={zu}>
              <SchliessenSymbol />
              {schliessen}
            </button>
          </div>
          <Navigation eintraege={eintraege} label={navLabel} variante="menue" anker={anker} beimWechsel={zu} />
          <div className="menue-fuss">
            <nav aria-label={sprachenTitel}>
              <h2>{sprachenTitel}</h2>
              <ul className="menue-sprachen pillen">
                {sprachen.map((s) => (
                  <li key={s.code}>
                    <Link href={s.pfad} className="pille" lang={s.lang} hrefLang={s.lang} aria-current={s.aktuell ? "true" : undefined} onClick={zu}>
                      {s.name}
                      {s.aktuell ? <span className="nur-sr"> ({aktuellLabel})</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <h2>{kontaktTitel}</h2>
              <div className="menue-kontakt">
                <Telefon nummer={telefon} label={anrufen} />
                <EMail adresse={email} />
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
