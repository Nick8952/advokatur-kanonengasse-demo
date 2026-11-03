"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { CopyIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { SmartLink } from "./SmartLink";

/** Ab dieser Länge kürzen manche E-Mail-Programme oder Betriebssysteme einen mailto:-Link. */
const MAILTO_GRENZE = 1800;
export const GRENZEN = { name: 100, email: 120, telefon: 40, nachricht: 1200 } as const;

export type FormularTexte = {
  titel: string; einleitung: string; keineVertraulich: string; name: string; email: string; telefon: string; telefonHilfe: string; betreff: string;
  betreffOptionen: { wert: string; titel: string }[]; betreffPraefix: string; nachricht: string; nachrichtHilfe: string; pflicht: string;
  absenden: string; hinweisNachher: string; fehlerName: string; fehlerEmail: string; fehlerNachricht: string; kopieren: string; kopiert: string; kopierenFehler: string;
  zuLangFehler: string; volltextLabel: string; ohneJavascript: string; datenschutzHinweis: string; datenschutzLinkText: string; datenschutzLinkZiel: string;
};

/** Baut den mailto:-Link. Alles ist mit encodeURIComponent kodiert (auch Zeilenumbrüche als %0A und «&», «?», «#»). */
export function mailtoBauen(empfaenger: string, betreff: string, text: string): string {
  return `mailto:${empfaenger}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;
}

/**
 * «E-Mail vorbereiten»: baut aus Name, E-Mail, Telefon (freiwillig), Betreff und Nachricht einen mailto:-Link und öffnet das
 * E-Mail-Programm. Die Website sendet, speichert und protokolliert nichts; es gibt keine Versandbestätigung, nur den Hinweis,
 * dass sich das E-Mail-Programm öffnen sollte. Sehr lange Nachrichten passen nicht in einen mailto-Link: Dann öffnet sich die E-Mail nur
 * mit den Angaben, und der ganze Text steht sichtbar zum Markieren bereit. In die Zwischenablage schreibt die Website nie von sich aus;
 * «Nachricht kopieren» ist eine ausdrückliche Handlung der Besucherin. Keine Datei-Uploads, keine Falldetails.
 * Ohne JavaScript bleibt der Knopf gesperrt (ein gewöhnliches Absenden würde die Eingaben als Parameter an die Adresse hängen);
 * stattdessen nennt <noscript> die E-Mail-Adresse. Alle Texte kommen je Sprache von aussen.
 */
export function Anfrageformular({ texte: f, empfaenger, ueberschriftStufe = 2 }: { texte: FormularTexte; empfaenger: string; ueberschriftStufe?: 2 | 3 }) {
  const id = useId();
  const geladen = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [betreffWert, setBetreffWert] = useState(f.betreffOptionen[0].wert);
  const [nachricht, setNachricht] = useState("");
  const [fehler, setFehler] = useState<{ name?: string; email?: string; nachricht?: string }>({});
  const [status, setStatus] = useState("");
  const [vorbereitet, setVorbereitet] = useState(false);
  const [volltext, setVolltext] = useState(false);
  const Titel = ueberschriftStufe === 3 ? "h3" : "h2";

  const betreffTitel = f.betreffOptionen.find((o) => o.wert === betreffWert)?.titel ?? betreffWert;
  const emailGueltig = (w: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(w.trim());
  const kopf = [`${f.name}: ${name.trim()}`, `${f.email}: ${email.trim()}`, ...(telefon.trim() ? [`${f.telefon}: ${telefon.trim()}`] : []), `${f.betreff}: ${betreffTitel}`].join("\n");
  const text = `${kopf}\n\n${nachricht.trim()}`;
  const betreff = `${f.betreffPraefix}: ${betreffTitel}`;

  async function kopieren(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(`${empfaenger}\n${betreff}\n\n${text}`);
      return true;
    } catch {
      return false;
    }
  }

  return (
    <form
      className="grid gap-5"
      noValidate={geladen}
      onSubmit={(ev) => {
        ev.preventDefault();
        const neu: typeof fehler = {};
        if (!name.trim()) neu.name = f.fehlerName;
        if (!emailGueltig(email)) neu.email = f.fehlerEmail;
        if (!nachricht.trim()) neu.nachricht = f.fehlerNachricht;
        setFehler(neu);
        const erstes = (["name", "email", "nachricht"] as const).find((k) => neu[k]);
        if (erstes) { setStatus(""); document.getElementById(`${id}-${erstes}`)?.focus(); return; }
        let link = mailtoBauen(empfaenger, betreff, text);
        let hinweis = f.hinweisNachher;
        if (link.length > MAILTO_GRENZE) {
          // Zu lang für einen Link: E-Mail nur mit den Angaben öffnen, der ganze Text steht unten zum Markieren (nichts wird kopiert)
          link = mailtoBauen(empfaenger, betreff, `${kopf}\n\n(…)`);
          setVolltext(true);
          hinweis = f.zuLangFehler;
        }
        setVorbereitet(true);
        setStatus(hinweis);
        window.location.href = link;
      }}
    >
      <div>
        <Titel className="titel-3">{f.titel}</Titel>
        <p className="klein mt-3 max-w-[58ch] text-rahmen-2">{f.einleitung}</p>
        <p className="hinweis klein mt-3">{f.keineVertraulich}</p>
        <noscript>
          <p className="klein mt-3">
            {f.ohneJavascript} <a href={`mailto:${empfaenger}`} className="textlink"><bdi dir="ltr">{empfaenger}</bdi></a>.
          </p>
        </noscript>
      </div>
      <div className="formular-raster">
        <div className="feld">
          <label htmlFor={`${id}-name`}>{f.name} <span aria-hidden="true">*</span></label>
          <input id={`${id}-name`} name="name" type="text" autoComplete="name" maxLength={GRENZEN.name} required aria-required="true" aria-invalid={fehler.name ? "true" : undefined} aria-describedby={fehler.name ? `${id}-name-fehler` : undefined} value={name} onChange={(ev) => setName(ev.target.value)} />
          {fehler.name ? <p id={`${id}-name-fehler`} className="fehler" role="alert">{fehler.name}</p> : null}
        </div>
        <div className="feld">
          <label htmlFor={`${id}-email`}>{f.email} <span aria-hidden="true">*</span></label>
          <input id={`${id}-email`} name="email" type="email" autoComplete="email" inputMode="email" dir="ltr" maxLength={GRENZEN.email} required aria-required="true" aria-invalid={fehler.email ? "true" : undefined} aria-describedby={fehler.email ? `${id}-email-fehler` : undefined} value={email} onChange={(ev) => setEmail(ev.target.value)} />
          {fehler.email ? <p id={`${id}-email-fehler`} className="fehler" role="alert">{fehler.email}</p> : null}
        </div>
        <div className="feld">
          <label htmlFor={`${id}-telefon`}>{f.telefon}</label>
          <input id={`${id}-telefon`} name="telefon" type="tel" autoComplete="tel" inputMode="tel" dir="ltr" maxLength={GRENZEN.telefon} aria-describedby={`${id}-telefon-hilfe`} value={telefon} onChange={(ev) => setTelefon(ev.target.value)} />
          <p id={`${id}-telefon-hilfe`} className="hilfe">{f.telefonHilfe}</p>
        </div>
        <div className="feld">
          <label htmlFor={`${id}-betreff`}>{f.betreff}</label>
          <select id={`${id}-betreff`} name="betreff" value={betreffWert} onChange={(ev) => setBetreffWert(ev.target.value)}>
            {f.betreffOptionen.map((o) => (
              <option key={o.wert} value={o.wert}>{o.titel}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="feld">
        <label htmlFor={`${id}-nachricht`}>{f.nachricht} <span aria-hidden="true">*</span></label>
        <textarea id={`${id}-nachricht`} name="nachricht" rows={6} maxLength={GRENZEN.nachricht} required aria-required="true" aria-invalid={fehler.nachricht ? "true" : undefined} aria-describedby={`${id}-hilfe${fehler.nachricht ? ` ${id}-nachricht-fehler` : ""}`} value={nachricht} onChange={(ev) => setNachricht(ev.target.value)} />
        <p id={`${id}-hilfe`} className="hilfe">{f.nachrichtHilfe} (<bdi dir="ltr">{nachricht.length}/{GRENZEN.nachricht}</bdi>)</p>
        {fehler.nachricht ? <p id={`${id}-nachricht-fehler`} className="fehler" role="alert">{fehler.nachricht}</p> : null}
      </div>
      <p className="klein text-grau">
        {f.pflicht} {f.datenschutzHinweis} <SmartLink ziel={f.datenschutzLinkZiel} className="textlink">{f.datenschutzLinkText}</SmartLink>.
      </p>
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="knopf knopf-primaer" disabled={!geladen}>
            <EnvelopeSimpleIcon size={20} aria-hidden="true" />
            {f.absenden}
          </button>
          {vorbereitet ? (
            <button type="button" className="knopf knopf-sekundaer" onClick={async () => { const ok = await kopieren(); if (!ok) setVolltext(true); setStatus(ok ? f.kopiert : f.kopierenFehler); }}>
              <CopyIcon size={20} aria-hidden="true" />
              {f.kopieren}
            </button>
          ) : null}
        </div>
        <p role="status" aria-live="polite" className="klein max-w-[58ch] text-rahmen-2">
          {status}
          {vorbereitet ? <> <a href={`mailto:${empfaenger}`} className="textlink"><bdi dir="ltr">{empfaenger}</bdi></a></> : null}
        </p>
        {volltext ? (
          <div className="feld">
            <label htmlFor={`${id}-volltext`}>{f.volltextLabel}</label>
            <textarea id={`${id}-volltext`} readOnly rows={8} value={`${empfaenger}\n${betreff}\n\n${text}`} onFocus={(ev) => ev.currentTarget.select()} />
          </div>
        ) : null}
      </div>
    </form>
  );
}
