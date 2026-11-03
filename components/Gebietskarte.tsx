import type { CSSProperties, ReactNode } from "react";
import { Pfeil } from "./Pfeil";

/**
 * Eine Karte der Schiene: Nummer, optionale Marke (Schwerpunkt), Titel als Link (die ganze Karte ist klickbar), Zusatz, Fusszeile mit Pfeil.
 * Schwerpunkte sind marineblau. --i steuert den Versatz der gestapelten Karten.
 */
export function Gebietskarte({ i, link, text, fuss, schwerpunkt, marke }: { i: number; link: ReactNode; text?: ReactNode; fuss: ReactNode; schwerpunkt: boolean; marke?: string }) {
  return (
    <li className={`karte-gebiet${schwerpunkt ? " schwerpunkt" : ""}`} style={{ "--i": i } as CSSProperties}>
      <div className="karte-kopf">
        <span className="karte-index zahl" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
        {schwerpunkt && marke ? <span className="karte-marke">{marke}</span> : null}
      </div>
      <div className="grid gap-2 content-start">
        {link}
        {text ? <span className="karte-text">{text}</span> : null}
      </div>
      <div className="karte-fuss">
        <span>{fuss}</span>
        <Pfeil />
      </div>
    </li>
  );
}
