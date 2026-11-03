import Link from "next/link";
import type { ReactNode } from "react";
import type { Bild as BildTyp } from "@/lib/content/modell";
import { Bild } from "./Bild";
import { Sprachwahl, type SprachEintrag } from "./Sprachwahl";

/**
 * Kopfzeile: links die Logo-Platte (die unveränderte Wortmarke der bisherigen Website, schwarz auf schwarz), rechts die Sprachwahl.
 * Darunter das Register (deutsche Seiten) oder die Abschnittsnavigation (Sprachseiten), als `register` übergeben.
 */
export function Kopf({ logo, logoAlt, startPfad, startLabel, sprachen, sprachLabel, sprachTitel, aktuellLabel, register }: {
  logo: BildTyp; logoAlt: string; startPfad: string; startLabel: string; sprachen: SprachEintrag[]; sprachLabel: string; sprachTitel: string; aktuellLabel: string; register: ReactNode;
}) {
  return (
    <header className="kopf">
      <div className="behaelter">
        <div className="kopf-zeile">
          <Link href={startPfad} className="platte" aria-label={startLabel}>
            <Bild bild={logo} sizes="(min-width: 64rem) 400px, (min-width: 40rem) 330px, 290px" prio alt={logoAlt} />
          </Link>
          <Sprachwahl eintraege={sprachen} label={sprachLabel} titel={sprachTitel} aktuellLabel={aktuellLabel} />
        </div>
      </div>
      <div className="behaelter">{register}</div>
    </header>
  );
}
