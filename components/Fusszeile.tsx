import Link from "next/link";
import type { ReactNode } from "react";
import type { Kanzlei } from "@/lib/content/modell";
import { telLink } from "@/lib/assets";
import { EMail } from "./Telefon";

export type FussTexte = {
  kontaktTitel: string; telefonzeiten: string; tage: string; zeiten: string[]; terminhinweis: string; anrufen: string;
  besuchsadresse: string; postadresse: string; seitenTitel?: string; sprachenTitel: string; rechtlichesTitel: string; copyright: string; demoHinweis?: string;
};

/**
 * Fusszeile als marineblaues Band: oben die Telefonnummer sehr gross, E-Mail, Telefonzeiten und beide Adressen (getrennt); darunter die
 * Spalten Seiten, Sprachen und Rechtliches; zuletzt Copyright und die Kennzeichnung als Entwurf. Texte kommen je Sprache von aussen.
 */
export function Fusszeile({ kanzlei: k, t, seiten, sprachen, rechtliches }: {
  kanzlei: Kanzlei; t: FussTexte; seiten?: { text: string; ziel: string }[]; sprachen: { code: string; name: string; lang: string; pfad: string }[]; rechtliches: ReactNode;
}) {
  return (
    <footer className="fuss">
      <div className="behaelter">
        <div className="fuss-oben">
          <div className="grid gap-3">
            <h2 className="etikett">{t.kontaktTitel}</h2>
            <a href={telLink(k.telefon)} className="fuss-telefon" aria-label={`${t.anrufen}: ${k.telefon}`}><bdi dir="ltr" className="zahl">{k.telefon}</bdi></a>
            <EMail adresse={k.email} />
          </div>
          <div className="fuss-zeiten grid gap-3">
            <p><strong>{t.telefonzeiten}</strong><br />{t.tage}, {t.zeiten.map((z, i) => <span key={z}>{i ? " / " : ""}<bdi dir="auto" className="zahl">{z}</bdi></span>)}<br />{t.terminhinweis}</p>
            <address className="grid gap-1 sm:grid-cols-2">
              <span><strong>{t.besuchsadresse}</strong><br /><bdi dir="ltr">{k.name}</bdi><br /><bdi dir="ltr">{k.besuchsadresse.strasse}</bdi><br /><bdi dir="ltr">{k.besuchsadresse.plz} {k.besuchsadresse.ort}</bdi></span>
              <span><strong>{t.postadresse}</strong><br /><bdi dir="ltr">{k.postadresse.postfach}</bdi><br /><bdi dir="ltr">{k.postadresse.plz} {k.postadresse.ort}</bdi></span>
            </address>
          </div>
        </div>
        <div className="fuss-raster">
          {seiten && t.seitenTitel ? (
            <nav aria-label={t.seitenTitel}>
              <h2>{t.seitenTitel}</h2>
              <ul className="fuss-liste">{seiten.map((n) => <li key={n.ziel}><Link href={n.ziel}>{n.text}</Link></li>)}</ul>
            </nav>
          ) : <div />}
          <nav aria-label={t.sprachenTitel}>
            <h2>{t.sprachenTitel}</h2>
            <ul className="fuss-liste">{sprachen.map((s) => <li key={s.code}><Link href={s.pfad} lang={s.lang} hrefLang={s.lang}>{s.name}</Link></li>)}</ul>
          </nav>
          <div>
            <h2>{t.rechtlichesTitel}</h2>
            <ul className="fuss-liste">{rechtliches}</ul>
          </div>
        </div>
        <div className="fuss-unten">
          <p className="klein">{t.copyright}</p>
          {t.demoHinweis ? <p className="demo-hinweis max-w-[60ch]">{t.demoHinweis}</p> : null}
        </div>
      </div>
    </footer>
  );
}
