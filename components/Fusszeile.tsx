import Link from "next/link";
import type { Kanzlei, Texte } from "@/lib/content/modell";
import { EinwilligungFussLink } from "./Einwilligung";
import { SmartLink } from "./SmartLink";
import { EMail, Telefon } from "./Telefon";

/** Fusszeile der deutschen Seiten: Kontakt mit Telefonzeiten, Seiten, Sprachen, Rechtliches und die Kennzeichnung als Entwurf. */
export function Fusszeile({ kanzlei: k, texte: t, sprachen, zeigeDemoHinweis }: { kanzlei: Kanzlei; texte: Texte; sprachen: { code: string; name: string; lang: string; pfad: string }[]; zeigeDemoHinweis: boolean }) {
  return (
    <footer className="fuss">
      <div className="behaelter abschnitt-knapp">
        <div className="fuss-raster">
          <div>
            <h2>{t.footer.kontaktTitel}</h2>
            <address className="not-italic">
              <span className="block">{k.name}</span>
              <span className="block">{k.besuchsadresse.strasse}, {k.besuchsadresse.plz} {k.besuchsadresse.ort}</span>
              <span className="block">{k.postadresse.postfach}, {k.postadresse.plz} {k.postadresse.ort}</span>
              <span className="block mt-2"><Telefon nummer={k.telefon} label={t.ui.anrufen} /></span>
              <span className="block"><EMail adresse={k.email} /></span>
            </address>
            <p className="mt-3 klein">
              {t.ui.telefonzeiten}: {k.telefonzeiten.tage}, {k.telefonzeiten.zeiten.join(" und ")}. {k.telefonzeiten.terminhinweis}
            </p>
          </div>
          <nav aria-label={t.footer.seitenTitel}>
            <h2>{t.footer.seitenTitel}</h2>
            <ul className="fuss-liste">
              {t.navigation.map((n) => <li key={n.ziel}><Link href={n.ziel}>{n.text}</Link></li>)}
            </ul>
          </nav>
          <nav aria-label={t.footer.sprachenTitel}>
            <h2>{t.footer.sprachenTitel}</h2>
            <ul className="fuss-liste">
              {sprachen.map((s) => <li key={s.code}><Link href={s.pfad} lang={s.lang} hrefLang={s.lang}>{s.name}</Link></li>)}
            </ul>
          </nav>
          <div>
            <h2>{t.footer.rechtliches.map((r) => r.text).join(" und ")}</h2>
            <ul className="fuss-liste">
              {t.footer.rechtliches.map((r) => <li key={r.ziel}><SmartLink ziel={r.ziel}>{r.text}</SmartLink></li>)}
              <li><SmartLink ziel={t.footer.bildnachweis.ziel}>{t.footer.bildnachweis.text}</SmartLink></li>
              <li><EinwilligungFussLink titel={t.footer.einstellungen} /></li>
            </ul>
          </div>
        </div>
        <div className="trenner mt-8 pt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <p className="klein">{t.footer.copyright}</p>
          {zeigeDemoHinweis ? <p className="demo-hinweis max-w-[60ch]">{t.footer.demoHinweis}</p> : null}
        </div>
      </div>
    </footer>
  );
}
