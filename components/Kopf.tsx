import Link from "next/link";
import type { Bild as BildTyp } from "@/lib/content/modell";
import { Bild } from "./Bild";
import { Menue, type MenueSprache } from "./Menue";
import { Navigation, type NavEintrag } from "./Navigation";
import { Sprachwahl, type SprachEintrag } from "./Sprachwahl";

/**
 * Kopf: klebt oben, schwebt über dem Einstieg und setzt sich beim Scrollen fest (CSS, scroll-driven). Links die Wortmarke der bisherigen
 * Website, in der Mitte ab 64 rem die Hauptnavigation, rechts die Sprachwahl (ab 64 rem) und der Menü-Knopf (darunter).
 */
export function Kopf({ logo, logoAlt, startPfad, startLabel, sprachen, sprachLabel, sprachTitel, aktuellLabel, navigation, navLabel, anker = false, menue, kontakt }: {
  logo: BildTyp; logoAlt: string; startPfad: string; startLabel: string; sprachen: SprachEintrag[]; sprachLabel: string; sprachTitel: string; aktuellLabel: string;
  navigation: NavEintrag[]; navLabel: string; anker?: boolean; menue: { titel: string; schliessen: string }; kontakt: { titel: string; telefon: string; email: string; anrufen: string };
}) {
  const menueSprachen: MenueSprache[] = sprachen.map((s) => ({ code: s.code, name: s.name, lang: s.lang, pfad: s.pfad, aktuell: s.aktuell }));
  return (
    <header className="kopf">
      <div className="kopf-innen">
        <div className="behaelter kopf-zeile">
          <Link href={startPfad} className="platte" aria-label={startLabel}>
            <Bild bild={logo} sizes="(min-width: 64rem) 256px, 40vw" prio alt={logoAlt} />
          </Link>
          <Navigation eintraege={navigation} label={navLabel} variante="kopf" anker={anker} />
          <div className="kopf-rechts">
            <Sprachwahl eintraege={sprachen} label={sprachLabel} titel={sprachTitel} aktuellLabel={aktuellLabel} />
            <Menue
              titel={menue.titel} schliessen={menue.schliessen} eintraege={navigation} navLabel={navLabel} anker={anker}
              sprachen={menueSprachen} sprachenTitel={sprachTitel} aktuellLabel={aktuellLabel}
              kontaktTitel={kontakt.titel} telefon={kontakt.telefon} email={kontakt.email} anrufen={kontakt.anrufen}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
