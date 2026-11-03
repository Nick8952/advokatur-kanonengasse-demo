"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { Texte } from "@/lib/content/modell";
import { OEFFNEN_EREIGNIS } from "@/lib/einwilligung";
import { useEinwilligung } from "@/lib/einwilligung-hook";

/**
 * Einwilligung, VORBEREITET.
 *
 * Solange `texte.einwilligung.kategorien` leer ist, bindet die Website keine einwilligungspflichtigen Dienste ein. Dann gibt es
 * kein Banner, keine Schalter und keinen Zugriff auf localStorage: Der Footer-Link «Datenschutz-Einstellungen» öffnet nur einen kurzen Hinweis.
 *
 * Mit mindestens einer Kategorie erscheinen Banner («Alle akzeptieren», «Nur notwendige», «Einstellungen») und der
 * Einstellungsdialog (natives <dialog>, Fokus bleibt im Dialog, Escape schliesst). Optionale Kategorien sind standardmässig aus,
 * Ablehnen ist ein Klick wie Zustimmen, und über den Footer-Link lässt sich die Einwilligung jederzeit ändern oder widerrufen.
 * Komponenten, die einen optionalen Dienst laden, prüfen vorher `erlaubt(kennung)` aus lib/einwilligung-hook.ts.
 */
export function Einwilligung({ texte: t, datenschutzPfad, schliessen }: { texte: Texte["einwilligung"]; datenschutzPfad: string; schliessen: string }) {
  // Ruhender Zustand: keine Kategorien, also kein Banner, keine Schalter und KEIN Zugriff auf den Speicher des Browsers.
  if (t.kategorien.length === 0) return <EinwilligungRuhend texte={t} datenschutzPfad={datenschutzPfad} schliessen={schliessen} />;
  return <EinwilligungAktiv texte={t} datenschutzPfad={datenschutzPfad} />;
}

/** Nur ein Hinweisdialog: liest und schreibt nichts. */
function EinwilligungRuhend({ texte: t, datenschutzPfad, schliessen }: { texte: Texte["einwilligung"]; datenschutzPfad: string; schliessen: string }) {
  const [dialogOffen, setDialogOffen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const oeffnen = () => setDialogOffen(true);
    window.addEventListener(OEFFNEN_EREIGNIS, oeffnen);
    return () => window.removeEventListener(OEFFNEN_EREIGNIS, oeffnen);
  }, []);
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (dialogOffen && !d.open) d.showModal();
    if (!dialogOffen && d.open) d.close();
  }, [dialogOffen]);
  return (
    <dialog ref={dialogRef} className="m-auto w-[min(92vw,34rem)] border border-fuge-stark bg-fenster p-0 text-rahmen" aria-labelledby={`${id}-titel`} onClose={() => setDialogOffen(false)}>
      <div className="grid gap-4 p-6">
        <h2 id={`${id}-titel`} className="titel-3">{t.ruhendTitel}</h2>
        <p className="klein text-rahmen-2">{t.ruhendText}</p>
        <p className="klein"><Link href={datenschutzPfad} className="textlink inline-flex min-h-11 items-center" onClick={() => setDialogOffen(false)}>{t.datenschutzerklaerung}</Link></p>
        <form method="dialog"><button type="submit" className="knopf knopf-primaer knopf-klein">{schliessen}</button></form>
      </div>
    </dialog>
  );
}

/** Mit mindestens einer Kategorie: Banner, Einstellungsdialog, Speicherung der Entscheidung, Widerruf. */
function EinwilligungAktiv({ texte: t, datenschutzPfad }: { texte: Texte["einwilligung"]; datenschutzPfad: string }) {
  const kennungen = t.kategorien.map((k) => k.kennung);
  const { einwilligung, geladen, setzen, widerrufen } = useEinwilligung(kennungen);
  const [dialogOffen, setDialogOffen] = useState(false);
  const [auswahl, setAuswahl] = useState<Record<string, boolean>>({});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const oeffnen = () => { setAuswahl(einwilligung?.kategorien ?? {}); setDialogOffen(true); };
    window.addEventListener(OEFFNEN_EREIGNIS, oeffnen);
    return () => window.removeEventListener(OEFFNEN_EREIGNIS, oeffnen);
  }, [einwilligung]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (dialogOffen && !d.open) d.showModal();
    if (!dialogOffen && d.open) d.close();
  }, [dialogOffen]);

  const alle = Object.fromEntries(kennungen.map((k) => [k, true]));
  const keine = Object.fromEntries(kennungen.map((k) => [k, false]));
  const speichernUndSchliessen = (k: Record<string, boolean>) => { setzen(k); setDialogOffen(false); };

  return (
    <>
      {geladen && !einwilligung ? (
        <div role="region" aria-label={t.bannerTitel} className="fixed inset-x-0 bottom-0 z-40 border-t border-fuge-stark bg-fenster">
          <div className="behaelter grid gap-4 py-4 sm:py-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="titel-4">{t.bannerTitel}</p>
              <p className="klein mt-1 max-w-3xl text-rahmen-2">
                {t.bannerText} <Link href={datenschutzPfad} className="textlink">{t.datenschutzerklaerung}</Link>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="knopf knopf-sekundaer knopf-klein" onClick={() => { setAuswahl({}); setDialogOffen(true); }}>{t.einstellungen}</button>
              <button type="button" className="knopf knopf-sekundaer knopf-klein" onClick={() => speichernUndSchliessen(keine)}>{t.nurNotwendige}</button>
              <button type="button" className="knopf knopf-sekundaer knopf-klein" onClick={() => speichernUndSchliessen(alle)}>{t.alleAkzeptieren}</button>
            </div>
          </div>
        </div>
      ) : null}

      <dialog ref={dialogRef} className="m-auto w-[min(92vw,34rem)] border border-fuge-stark bg-fenster p-0 text-rahmen" aria-labelledby={`${id}-titel`} onClose={() => setDialogOffen(false)}>
        <form method="dialog" className="grid gap-5 p-6" onSubmit={(ev) => { ev.preventDefault(); speichernUndSchliessen({ ...keine, ...auswahl }); }}>
          <h2 id={`${id}-titel`} className="titel-3">{t.bannerTitel}</h2>
          <div className="grid gap-3">
            <label className="flex items-start gap-3 border border-fuge-stark p-3">
              <input type="checkbox" checked disabled className="mt-1 size-5" />
              <span><span className="titel-4 block">{t.notwendigTitel}</span><span className="klein block text-rahmen-2">{t.notwendigText}</span></span>
            </label>
            {t.kategorien.map((k) => (
              <label key={k.kennung} className="flex items-start gap-3 border border-fuge-stark p-3">
                <input type="checkbox" className="mt-1 size-5" checked={auswahl[k.kennung] === true} onChange={(ev) => setAuswahl({ ...auswahl, [k.kennung]: ev.target.checked })} />
                <span><span className="titel-4 block">{k.titel}</span><span className="klein block text-rahmen-2">{k.beschreibung}</span></span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="knopf knopf-primaer knopf-klein">{t.auswahlSpeichern}</button>
            <button type="button" className="knopf knopf-sekundaer knopf-klein" onClick={() => speichernUndSchliessen(keine)}>{t.nurNotwendige}</button>
            {einwilligung ? <button type="button" className="knopf knopf-sekundaer knopf-klein" onClick={() => { widerrufen(); setDialogOffen(false); }}>{t.widerrufen}</button> : null}
          </div>
        </form>
      </dialog>
    </>
  );
}

/** Link in der Fusszeile, der die Datenschutz-Einstellungen öffnet (auch für den Widerruf). */
export function EinwilligungFussLink({ titel }: { titel: string }) {
  return (
    <button type="button" className="inline-flex min-h-11 items-center text-left hover:underline" aria-haspopup="dialog" onClick={() => window.dispatchEvent(new Event(OEFFNEN_EREIGNIS))}>
      {titel}
    </button>
  );
}
