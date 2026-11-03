import type { ReactNode } from "react";

/**
 * Kopf der Unterseiten: Etikett (Kurzbeschreibung der Kanzlei oder Gruppe), sehr grosser Titel, der orangene Strich, Vorspann und eine
 * optionale Zeile (Sprungmarken, Zurück-Link). Taucht beim Laden gestaffelt auf (CSS-Keyframes, ohne JavaScript sichtbar).
 */
export function Seitenkopf({ etikett, titel, titelId, kinder, zeile }: { etikett?: string; titel: ReactNode; titelId?: string; kinder?: ReactNode; zeile?: ReactNode }) {
  return (
    <header className="seitenkopf">
      <div className="behaelter">
        <div className="seitenkopf-innen">
          {etikett ? <p className="etikett">{etikett}</p> : null}
          <h1 id={titelId} className="titel-riesig">{titel}</h1>
          <span className="strich" aria-hidden="true" />
          {kinder}
          {zeile ? <div className="seitenkopf-zeile">{zeile}</div> : null}
        </div>
      </div>
    </header>
  );
}
