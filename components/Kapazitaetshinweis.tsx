/**
 * Hinweis der Kanzlei zu Anfragen (Wortlaut der bisherigen Website): Er beschreibt, was ausbleibende Rückmeldung bedeutet.
 * Er ist keine Antwortzusage und keine Empfangsbestätigung; deshalb steht er neben dem Formular, nicht nach dem Absenden.
 */
export function Kapazitaetshinweis({ titel, text, zusatz, entwurf }: { titel: string; text: string; zusatz?: string; entwurf?: string }) {
  return (
    <aside className="hinweis" aria-labelledby="kapazitaet-titel">
      <h2 id="kapazitaet-titel" className="titel-4">
        {titel}
        {entwurf ? <span className="entwurf-marke">{entwurf}</span> : null}
      </h2>
      <p className="mt-2">{text}</p>
      {zusatz ? <p className="mt-2 klein">{zusatz}</p> : null}
    </aside>
  );
}
