import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../../globals.css";
import { Bewegung } from "@/components/Bewegung";
import { Fusszeile } from "@/components/Fusszeile";
import { Kopf } from "@/components/Kopf";
import { SmartLink } from "@/components/SmartLink";
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

export const viewport: Viewport = { themeColor: "#182153", colorScheme: "light" };

/**
 * Wurzel-Layout der Sprachseiten: <html lang> und dir je Sprache (Arabisch rechts nach links). Kopf mit Wortmarke, Abschnittsnavigation
 * (Sprungmarken derselben Seite statt des deutschen Registers), Sprachwahl und Menü. Fusszeile mit Kontakt, Sprachen und den deutschen Rechtsseiten.
 */
export default async function SprachLayout({ children, params }: { children: ReactNode; params: Params }) {
  const { sprache } = await params;
  const q = await inhaltsquelle();
  const [k, t, s] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getSprachseite(sprache as Code)]);
  if (!s) throw new Error(`Sprachseite «${sprache}» fehlt.`);
  const sprachen = t.sprachen.map((x) => ({ code: x.code, name: x.name, nameDeutsch: x.nameDeutsch, lang: x.lang, pfad: pfade.sprache(x.code), aktuell: x.code === s.sprache }));
  const navigation = s.ui.navigation.map((n) => ({ text: n.text, ziel: `#${n.anker}` }));
  const fuss = {
    kontaktTitel: s.ui.kontaktTitel, telefonzeiten: s.ui.telefonzeiten, tage: s.ui.tage, zeiten: s.ui.zeiten, terminhinweis: s.ui.terminhinweis, anrufen: s.ui.anrufen,
    besuchsadresse: s.ui.besuchsadresse, postadresse: s.ui.postadresse, sprachenTitel: s.ui.sprache, rechtlichesTitel: `${s.ui.impressum} / ${s.ui.datenschutz}`,
    copyright: t.footer.copyright, demoHinweis: indexierungErlaubt ? undefined : s.ui.demoHinweis,
  };
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
          navigation={navigation} navLabel={s.ui.navigationLabel} anker menue={{ titel: s.ui.menue, schliessen: s.ui.menueSchliessen }}
          kontakt={{ titel: s.ui.kontaktTitel, telefon: k.telefon, email: k.email, anrufen: s.ui.anrufen }}
        />
        <main id="inhalt" tabIndex={-1} className="inhalt w-full max-w-full outline-none">
          {children}
        </main>
        <Fusszeile
          kanzlei={k} t={fuss} sprachen={sprachen}
          rechtliches={<>
            <li><SmartLink ziel={pfade.impressum} hrefLang="de">{s.ui.impressum} ({s.ui.nurDeutsch})</SmartLink></li>
            <li><SmartLink ziel={pfade.datenschutz} hrefLang="de">{s.ui.datenschutz} ({s.ui.nurDeutsch})</SmartLink></li>
            <li><SmartLink ziel={pfade.start} hrefLang="de">{s.ui.zurDeutschenWebsite}</SmartLink></li>
          </>}
        />
        <Bewegung />
      </body>
    </html>
  );
}
