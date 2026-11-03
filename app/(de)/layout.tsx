import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { Bewegung } from "@/components/Bewegung";
import { Einwilligung, EinwilligungFussLink } from "@/components/Einwilligung";
import { Fusszeile } from "@/components/Fusszeile";
import { Kopf } from "@/components/Kopf";
import { SmartLink } from "@/components/SmartLink";
import { inhaltsquelle, pfade } from "@/lib/content";
import { siteUrl } from "@/lib/deploy-ziel";
import { CSP_META } from "@/lib/csp";
import { indexierungErlaubt, jsonLdSicher, kanzleiJsonLd } from "@/lib/seo";

/**
 * Wurzel-Layout der deutschen Seiten (lang="de-CH"). Die Sprachseiten haben ein eigenes Wurzel-Layout unter app/(sprachen),
 * weil <html lang> und dir je Sprache verschieden sind. Schriften werden lokal über @font-face in globals.css geladen.
 */
export async function generateMetadata(): Promise<Metadata> {
  const q = await inhaltsquelle();
  const [k, t] = await Promise.all([q.getKanzlei(), q.getTexte()]);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: k.name, template: `%s | ${t.seo.titelZusatz}` },
    description: t.seo.beschreibung,
    robots: indexierungErlaubt ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export const viewport: Viewport = { themeColor: "#182153", colorScheme: "light" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const q = await inhaltsquelle();
  const [k, t, personen, rechtsgebiete] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getPersonen(), q.getRechtsgebiete()]);
  const sprachen = t.sprachen.map((s) => ({ code: s.code, name: s.name, nameDeutsch: s.nameDeutsch, lang: s.lang, pfad: pfade.sprache(s.code), aktuell: s.code === "de" }));
  const fuss = {
    kontaktTitel: t.footer.kontaktTitel, telefonzeiten: t.ui.telefonzeiten, tage: k.telefonzeiten.tage, zeiten: k.telefonzeiten.zeiten, terminhinweis: k.telefonzeiten.terminhinweis,
    anrufen: t.ui.anrufen, besuchsadresse: t.ui.besuchsadresse, postadresse: t.ui.postadresse, seitenTitel: t.footer.seitenTitel, sprachenTitel: t.footer.sprachenTitel,
    rechtlichesTitel: t.footer.rechtliches.map((r) => r.text).join(" und "), copyright: t.footer.copyright, demoHinweis: indexierungErlaubt ? undefined : t.footer.demoHinweis,
  };
  return (
    <html lang="de-CH" dir="ltr">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP_META} />
      </head>
      <body>
        <a href="#inhalt" className="nur-sr fixed start-4 top-4 z-50 bg-akzent px-4 py-3 font-semibold text-akzent-text focus:not-sr-only focus:[clip:auto] focus:[height:auto] focus:[width:auto] focus:[position:fixed] focus:[white-space:normal] focus:[margin:0] focus:[overflow:visible]">
          {t.ui.zumInhalt}
        </a>
        {!indexierungErlaubt ? <p className="demo-leiste klein border-b border-fuge bg-fenster-2 px-4 py-1.5 text-center text-rahmen-2">{t.demoHinweis}</p> : null}
        <Kopf
          logo={k.logo} logoAlt={t.kopf.logoAlt} startPfad={pfade.start} startLabel={t.kopf.zurStartseite}
          sprachen={sprachen} sprachLabel={t.kopf.sprache} sprachTitel={t.kopf.spracheWaehlen} aktuellLabel={t.kopf.aktuelleSprache}
          navigation={t.navigation} navLabel={t.kopf.navigationLabel} menue={{ titel: t.kopf.menue, schliessen: t.kopf.menueSchliessen }}
          kontakt={{ titel: t.footer.kontaktTitel, telefon: k.telefon, email: k.email, anrufen: t.ui.anrufen }}
        />
        <main id="inhalt" tabIndex={-1} className="inhalt w-full max-w-full outline-none">
          {children}
        </main>
        <Fusszeile
          kanzlei={k} t={fuss} seiten={t.navigation} sprachen={sprachen}
          rechtliches={<>
            {t.footer.rechtliches.map((r) => <li key={r.ziel}><SmartLink ziel={r.ziel}>{r.text}</SmartLink></li>)}
            <li><SmartLink ziel={t.footer.bildnachweis.ziel}>{t.footer.bildnachweis.text}</SmartLink></li>
            <li><EinwilligungFussLink titel={t.footer.einstellungen} /></li>
          </>}
        />
        <Einwilligung texte={t.einwilligung} datenschutzPfad={pfade.datenschutz} schliessen={t.ui.schliessen} />
        <Bewegung />
        {indexierungErlaubt ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSicher(kanzleiJsonLd(k, personen, rechtsgebiete)) }} /> : null}
      </body>
    </html>
  );
}
