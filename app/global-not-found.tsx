import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Bild } from "@/components/Bild";
import { Pfeil } from "@/components/Pfeil";
import { Seitenkopf } from "@/components/Seitenkopf";
import { inhaltsquelle, pfade } from "@/lib/content";
import { telLink } from "@/lib/assets";
import { CSP_META } from "@/lib/csp";

/**
 * Gestaltete Fehlerseite für unbekannte Adressen. Als global-not-found gebaut, weil die Website zwei Wurzel-Layouts hat (Deutsch,
 * Sprachseiten) und deshalb selbst <html> und <body> rendern muss. Next schreibt daraus out/404.html; GitHub Pages und Vercel liefern
 * diese Datei bei unbekannten Adressen aus. Deutsch mit kurzem englischem Hinweis, Telefon und Weg zur Startseite.
 */
// Next setzt auf der globalen Fehlerseite selbst «noindex»; kein zweites robots-Meta.
export const metadata: Metadata = { title: "Seite nicht gefunden" };
export const viewport: Viewport = { themeColor: "#182153", colorScheme: "light" };

export default async function GlobalNotFound() {
  const q = await inhaltsquelle();
  const [t, k] = await Promise.all([q.getTexte(), q.getKanzlei()]);
  return (
    <html lang="de-CH" dir="ltr">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP_META} />
      </head>
      <body>
        <a href="#inhalt" className="nur-sr fixed start-4 top-4 z-50 bg-akzent px-4 py-3 font-semibold text-akzent-text focus:not-sr-only focus:[clip:auto] focus:[height:auto] focus:[width:auto] focus:[position:fixed] focus:[white-space:normal] focus:[margin:0] focus:[overflow:visible]">
          {t.ui.zumInhalt}
        </a>
        <header className="kopf">
          <div className="kopf-innen">
            <div className="behaelter kopf-zeile">
              <Link href={pfade.start} className="platte" aria-label={t.kopf.zurStartseite}>
                <Bild bild={k.logo} sizes="256px" prio alt={t.kopf.logoAlt} />
              </Link>
            </div>
          </div>
        </header>
        <main id="inhalt" tabIndex={-1} className="inhalt outline-none">
          <Seitenkopf
            etikett={k.name} titel={t.ui.nichtGefundenTitel}
            kinder={<>
              <p className="vorspann">{t.ui.nichtGefundenText}</p>
              <p className="klein text-rahmen-2" lang="en">This page does not exist. The navigation on the home page lists all pages of the firm.</p>
            </>}
            zeile={<>
              <Link href={t.ui.nichtGefundenLink.ziel} className="knopf knopf-primaer">{t.ui.nichtGefundenLink.text}<Pfeil /></Link>
              <a href={telLink(k.telefon)} className="knopf knopf-sekundaer">{t.ui.anrufen}: <bdi dir="ltr">{k.telefon}</bdi></a>
            </>}
          />
          <div className="abschnitt" />
        </main>
      </body>
    </html>
  );
}
