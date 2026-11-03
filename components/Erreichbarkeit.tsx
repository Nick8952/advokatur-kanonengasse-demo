import type { CSSProperties } from "react";
import type { Kanzlei } from "@/lib/content/modell";
import { EMail, Telefon } from "./Telefon";

export type ErreichbarkeitTexte = {
  telefonzeiten: string; tage: string; zeiten: string[]; terminhinweis: string;
  besuchsadresse: string; postadresse: string; stockwerk: string; telefon: string; email: string; anrufen: string;
};

/**
 * Die drei wichtigsten Angaben als drei Karten: Telefonzeiten mit Terminregel, Telefon und E-Mail, Besuchs- und Postadresse getrennt.
 * Texte kommen je Sprache von aussen; die Fakten (Zeiten, Adressen, Nummern) nur aus den Kanzleidaten. Die Karten erscheinen gestaffelt.
 */
export function Erreichbarkeit({ kanzlei: k, t, gross = false }: { kanzlei: Kanzlei; t: ErreichbarkeitTexte; gross?: boolean }) {
  const karte = (i: number) => ({ className: "fakten karte-info", "data-reveal": true, style: { "--i": i } as CSSProperties });
  return (
    <div className="erreichbarkeit karten-3">
      <dl {...karte(0)}>
        <div>
          <dt>{t.telefonzeiten}</dt>
          <dd>
            <span className="block">{t.tage}</span>
            {t.zeiten.map((z) => <span key={z} className="block zahl"><bdi dir="auto">{z}</bdi></span>)}
            <span className="block mt-2 font-semibold">{t.terminhinweis}</span>
          </dd>
        </div>
      </dl>
      <dl {...karte(1)}>
        <div className={gross ? "gross" : undefined}>
          <dt>{t.telefon}</dt>
          <dd><Telefon nummer={k.telefon} label={t.anrufen} /></dd>
        </div>
        <div>
          <dt>{t.email}</dt>
          <dd><EMail adresse={k.email} /></dd>
        </div>
      </dl>
      <dl {...karte(2)}>
        <div>
          <dt>{t.besuchsadresse}</dt>
          <dd>
            <span className="block"><bdi dir="ltr">{k.name}</bdi></span>
            <span className="block"><bdi dir="ltr">{k.besuchsadresse.strasse}</bdi></span>
            <span className="block"><bdi dir="ltr">{k.besuchsadresse.plz} {k.besuchsadresse.ort}</bdi></span>
            <span className="block meta">{t.stockwerk}</span>
          </dd>
        </div>
        <div>
          <dt>{t.postadresse}</dt>
          <dd>
            <span className="block"><bdi dir="ltr">{k.postadresse.postfach}</bdi></span>
            <span className="block"><bdi dir="ltr">{k.postadresse.plz} {k.postadresse.ort}</bdi></span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
