import type { Kanzlei } from "@/lib/content/modell";
import { EMail, Telefon } from "./Telefon";

export type ErreichbarkeitTexte = {
  telefonzeiten: string; tage: string; zeiten: string[]; terminhinweis: string;
  besuchsadresse: string; postadresse: string; stockwerk: string; telefon: string; email: string; anrufen: string;
};

/**
 * Die drei wichtigsten Angaben nebeneinander: Telefonzeiten mit Terminregel, Telefon und E-Mail, Besuchs- und Postadresse getrennt.
 * Texte kommen je Sprache von aussen; die Fakten (Zeiten, Adressen, Nummern) nur aus den Kanzleidaten.
 */
export function Erreichbarkeit({ kanzlei: k, t, gross = false }: { kanzlei: Kanzlei; t: ErreichbarkeitTexte; gross?: boolean }) {
  return (
    <div className="erreichbarkeit">
      <dl className="fakten">
        <div>
          <dt>{t.telefonzeiten}</dt>
          <dd>
            <span className="block">{t.tage}</span>
            {t.zeiten.map((z) => <span key={z} className="block zahl"><bdi dir="auto">{z}</bdi></span>)}
          </dd>
        </div>
        <div>
          <dd className="font-semibold">{t.terminhinweis}</dd>
        </div>
      </dl>
      <dl className="fakten">
        <div className={gross ? "gross" : undefined}>
          <dt>{t.telefon}</dt>
          <dd><Telefon nummer={k.telefon} label={t.anrufen} /></dd>
        </div>
        <div>
          <dt>{t.email}</dt>
          <dd><EMail adresse={k.email} /></dd>
        </div>
      </dl>
      <dl className="fakten">
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
