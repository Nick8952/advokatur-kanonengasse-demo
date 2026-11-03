import type { Metadata } from "next";
import { Seitenkopf } from "@/components/Seitenkopf";
import { SmartLink } from "@/components/SmartLink";
import { Teamfilter } from "@/components/Teamfilter";
import { inhaltsquelle, pfade } from "@/lib/content";
import { seitenMetadaten } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const q = await inhaltsquelle();
  const [k, t, s] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getTeamSeite()]);
  return seitenMetadaten({ titel: s.seoTitel, beschreibung: s.seoBeschreibung, pfad: pfade.team, kanzlei: k, texte: t });
}

/** Team: Filter nach Rechtsgebiet und Beratungssprache (nur belegte Zuordnungen), drei Gruppen als Portraitraster, am Ende der externe Link der bisherigen Website. */
export default async function Team() {
  const q = await inhaltsquelle();
  const [k, s, t, personen, rechtsgebiete] = await Promise.all([q.getKanzlei(), q.getTeamSeite(), q.getTexte(), q.getPersonen(), q.getRechtsgebiete()]);
  const benutzt = new Set(personen.flatMap((p) => p.rechtsgebiete.map((r) => r.slug).filter((x): x is string => !!x)));
  const gebiete = rechtsgebiete.filter((r) => benutzt.has(r.slug)).map((r) => ({ slug: r.slug, titel: r.titel }));
  const sprachen = [...new Set(personen.flatMap((p) => p.sprachen.map((x) => x.name)))].sort((a, b) => a.localeCompare(b, "de"));
  const liste = personen.map((p) => ({
    slug: p.slug, name: `${p.vorname} ${p.nachname}`, rolle: p.rolle, pfad: pfade.person(p.slug), gruppe: p.gruppe,
    gebiete: [...new Set(p.rechtsgebiete.map((r) => r.slug).filter((x): x is string => !!x))], sprachen: p.sprachen.map((x) => x.name),
    bild: { alt: p.portraitQuadrat.alt, breite: p.portraitQuadrat.breite, hoehe: p.portraitQuadrat.hoehe, quellen: p.portraitQuadrat.quellen },
  }));
  const gruppen = (Object.keys(s.gruppen) as (keyof typeof s.gruppen)[]).map((g) => ({ kennung: g, titel: s.gruppen[g] }));
  return (
    <>
      <Seitenkopf etikett={k.kurzbeschreibung} titel={s.titel} kinder={<p className="vorspann">{s.einleitung}</p>} />
      <div className="behaelter abschnitt grid gap-12">
        <Teamfilter personen={liste} gruppen={gruppen} gebiete={gebiete} sprachen={sprachen} t={s.filter} />
        <section aria-labelledby="verlinkt-titel" className="trenner grid gap-3 pt-10" data-reveal>
          <h2 id="verlinkt-titel" className="titel-3">{s.verlinkt.titel}</h2>
          <p className="lauftext">{s.verlinkt.text}</p>
          <ul className="liste-schlicht">
            {s.verlinkt.links.map((l) => (
              <li key={l.ziel}>
                <SmartLink ziel={l.ziel} className="kontakt-link" neuesFensterText={t.ui.oeffnetNeuesFenster}>{l.name}</SmartLink>
                <span className="meta"> ({l.beschreibung})</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
