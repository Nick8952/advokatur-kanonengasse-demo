import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../../globals.css";
import { Kopf } from "@/components/Kopf";
import { SmartLink } from "@/components/SmartLink";
import { EMail, Telefon } from "@/components/Telefon";
import { inhaltsquelle, pfade } from "@/lib/content";
import { siteUrl } from "@/lib/deploy-ziel";
import { CSP_META } from "@/lib/csp";
import { indexierungErlaubt } from "@/lib/seo";

type Params = Promise<{ sprache: string }>;
const SPRACHEN = ["en", "fr", "it", "es", "ar"] as const;
type Code = (typeof SPRACHEN)[number];

// Alle fünf Sprachseiten beim Build erzeugen; andere Codes gibt es nicht.
export const dynamicParams = false;
export function generateStaticParams() {
  return SPRACHEN.map((sprache) => ({ sprache }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sprache } = await params;
  const q = await inhaltsquelle();
  const [k, s] = await Promise.all([q.getKanzlei(), q.getSprachseite(sprache as Code)]);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: k.name, template: `%s | ${k.name}` },
    description: s?.seoBeschreibung,
    robots: indexierungErlaubt ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export const viewport: Viewport = { themeColor: "#e9e9e7", colorScheme: "light" };

/**
 * Wurzel-Layout der Sprachseiten: <html lang> und dir je Sprache (Arabisch rechts nach links). Kopf mit Logo-Platte und Sprachwahl,
 * darunter die Abschnittsnavigation der Seite (statt des deutschen Registers). Fusszeile mit Kontakt, Sprachen und den deutschen Rechtsseiten.
 */
export default async function SprachLayout({ children, params }: { children: ReactNode; params: Params }) {
  const { sprache } = await params;
  const q = await inhaltsquelle();
  const [k, t, s] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getSprachseite(sprache as Code)]);
  if (!s) throw new Error(`Sprachseite «${sprache}» fehlt.`);
  const sprachen = t.sprachen.map((x) => ({ code: x.code, name: x.name, nameDeutsch: x.nameDeutsch, lang: x.lang, pfad: pfade.sprache(x.code), aktuell: x.code === s.sprache }));
  return (
    <html lang={s.lang} dir={s.richtung}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP_META} />
      </head>
      <body>
        <a href="#inhalt" className="nur-sr fixed start-4 top-4 z-50 bg-akzent px-4 py-3 font-semibold text-akzent-text focus:not-sr-only focus:[clip:auto] focus:[height:auto] focus:[width:auto] focus:[position:fixed] focus:[white-space:normal] focus:[margin:0] focus:[overflow:visible]">
          {s.ui.zumInhalt}
        </a>
        {!indexierungErlaubt ? <p className="demo-leiste klein border-b border-fuge bg-fenster-2 px-4 py-1.5 text-center text-rahmen-2">{s.ui.demoHinweis}</p> : null}
        <Kopf
          logo={k.logo} logoAlt={t.kopf.logoAlt} startPfad={pfade.sprache(s.sprache)} startLabel={s.ui.zurStartseite}
          sprachen={sprachen} sprachLabel={s.ui.sprache} sprachTitel={s.ui.spracheWaehlen} aktuellLabel={s.ui.sprache}
          register={
            <nav className="register" aria-label={s.ui.spracheWaehlen}>
              {s.ui.navigation.map((n) => <a key={n.anker} href={`#${n.anker}`} className="register-link">{n.text}</a>)}
            </nav>
          }
        />
        <main id="inhalt" tabIndex={-1} className="w-full max-w-full overflow-x-hidden outline-none">
          {children}
        </main>
        <footer className="fuss">
          <div className="behaelter abschnitt-knapp">
            <div className="fuss-raster">
              <div>
                <h2>{s.ui.kontaktTitel}</h2>
                <address className="not-italic">
                  <span className="block">{k.name}</span>
                  <span className="block"><bdi dir="ltr">{k.besuchsadresse.strasse}, {k.besuchsadresse.plz} {k.besuchsadresse.ort}</bdi></span>
                  <span className="block"><bdi dir="ltr">{k.postadresse.postfach}, {k.postadresse.plz} {k.postadresse.ort}</bdi></span>
                  <span className="block mt-2"><Telefon nummer={k.telefon} label={s.ui.anrufen} /></span>
                  <span className="block"><EMail adresse={k.email} /></span>
                </address>
              </div>
              <nav aria-label={s.ui.sprache}>
                <h2>{s.ui.sprache}</h2>
                <ul className="fuss-liste">
                  {sprachen.map((x) => <li key={x.code}><a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${x.pfad}`} lang={x.lang} hrefLang={x.lang}>{x.name}</a></li>)}
                </ul>
              </nav>
              <div>
                <h2>{s.ui.impressum} / {s.ui.datenschutz}</h2>
                <ul className="fuss-liste">
                  <li><SmartLink ziel={pfade.impressum} hrefLang="de">{s.ui.impressum} ({s.ui.nurDeutsch})</SmartLink></li>
                  <li><SmartLink ziel={pfade.datenschutz} hrefLang="de">{s.ui.datenschutz} ({s.ui.nurDeutsch})</SmartLink></li>
                  <li><SmartLink ziel={pfade.start} hrefLang="de">{s.ui.zurDeutschenWebsite}</SmartLink></li>
                </ul>
              </div>
            </div>
            <div className="trenner mt-8 pt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <p className="klein">{t.footer.copyright}</p>
              {!indexierungErlaubt ? <p className="demo-hinweis max-w-[60ch]">{s.ui.demoHinweis}</p> : null}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
