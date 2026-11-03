import type { ReactNode } from "react";

/** Kopf eines Abschnitts: Nummer (dekorativ), Titel, Strich, Text und optional ein Link. Erscheint beim Scrollen (data-reveal). */
export function Abschnittskopf({ nummer, id, titel, text, kinder, klasse }: { nummer: string; id: string; titel: string; text?: string; kinder?: ReactNode; klasse?: string }) {
  return (
    <div className={`abschnitt-kopf ${klasse ?? ""}`.trim()} data-reveal>
      <p className="index zahl" aria-hidden="true">{nummer}</p>
      <h2 id={id} className="titel-2">{titel}</h2>
      <span className="strich" aria-hidden="true" />
      {text ? <p className="lauftext">{text}</p> : null}
      {kinder}
    </div>
  );
}
