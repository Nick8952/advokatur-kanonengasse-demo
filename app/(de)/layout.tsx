import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { Einwilligung } from "@/components/Einwilligung";
import { Fusszeile } from "@/components/Fusszeile";
import { Kopf } from "@/components/Kopf";
import { Register } from "@/components/Register";
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

export const viewport: Viewport = { themeColor: "#e9e9e7", colorScheme: "light" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const q = await inhaltsquelle();
  const [k, t, personen, rechtsgebiete] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getPersonen(), q.getRechtsgebiete()]);
  const sprachen = t.sprachen.map((s) => ({ code: s.code, name: s.name, nameDeutsch: s.nameDeutsch, lang: s.lang, pfad: pfade.sprache(s.code), aktuell: s.code === "de" }));
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
          register={<Register eintraege={t.navigation} label={t.kopf.navigationLabel} />}
        />
        <main id="inhalt" tabIndex={-1} className="w-full max-w-full overflow-x-hidden outline-none">
          {children}
        </main>
        <Fusszeile kanzlei={k} texte={t} sprachen={sprachen} zeigeDemoHinweis={!indexierungErlaubt} />
        <Einwilligung texte={t.einwilligung} datenschutzPfad={pfade.datenschutz} schliessen={t.ui.schliessen} />
        {indexierungErlaubt ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSicher(kanzleiJsonLd(k, personen, rechtsgebiete)) }} /> : null}
      </body>
    </html>
  );
}
