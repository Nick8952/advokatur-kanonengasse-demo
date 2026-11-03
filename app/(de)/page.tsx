import type { Metadata } from "next";
import Link from "next/link";
import { Abschnittskopf } from "@/components/Abschnittskopf";
import { Buehne } from "@/components/Buehne";
import { Erreichbarkeit } from "@/components/Erreichbarkeit";
import { Gebietskarte } from "@/components/Gebietskarte";
import { Laufband } from "@/components/Laufband";
import { Personenkachel } from "@/components/Personenkachel";
import { Pfeil } from "@/components/Pfeil";
import { Schiene } from "@/components/Schiene";
import { Sprachleiste } from "@/components/Sprachleiste";
import { Telefon } from "@/components/Telefon";
import { inhaltsquelle, pfade } from "@/lib/content";
import { seitenMetadaten, sprachAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const q = await inhaltsquelle();
  const [k, t, s] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getStartseite()]);
  return seitenMetadaten({ titel: s.seoTitel, beschreibung: s.seoBeschreibung, pfad: pfade.start, kanzlei: k, texte: t, istStart: true, alternates: sprachAlternates(t) });
}

/**
 * Startseite als Durchgang: Bühne in voller Höhe (Foto, Titel, Satz der Kanzlei, Anrufen, Kontakt, Fakten, Sprachen), Laufband mit den
 * Willkommensworten, 01 Kanzlei (klebender Titel, grosse Absätze, Erreichbarkeit als Karten), 02 Rechtsgebiete als Schiene, 03 Team als
 * Portraitraster, 04 Mitarbeit als zwei Tafeln. Jeder Abschnitt hat eine eigene Layoutfamilie.
 */
export default async function Startseite() {
  const q = await inhaltsquelle();
  const [k, t, s, personen, rechtsgebiete, team] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getStartseite(), q.getPersonen(), q.getRechtsgebiete(), q.getTeamSeite()]);
  const sprachen = t.sprachen.map((x) => ({ code: x.code, name: x.name, lang: x.lang, pfad: pfade.sprache(x.code), aktuell: x.code === "de" }));
  const gebieteSortiert = [...rechtsgebiete].sort((a, b) => Number(b.schwerpunkt) - Number(a.schwerpunkt) || a.reihenfolge - b.reihenfolge);
  const personenNachGebiet = (slug: string) => personen.filter((p) => p.rechtsgebiete.some((r) => r.slug === slug)).length;
  const erreichbarkeit = { telefonzeiten: t.ui.telefonzeiten, tage: k.telefonzeiten.tage, zeiten: k.telefonzeiten.zeiten, terminhinweis: k.telefonzeiten.terminhinweis, besuchsadresse: t.ui.besuchsadresse, postadresse: t.ui.postadresse, stockwerk: k.besuchsadresse.zusatz, telefon: t.ui.telefon, email: t.ui.email, anrufen: t.ui.anrufen };
  const gruppen = Object.keys(team.gruppen) as (keyof typeof team.gruppen)[];
  return (
    <>
      <Buehne
        foto={k.foto} etikett={k.name} titel={s.hero.titel} titelId="einstieg" vorspann={[s.hero.text]}
        knoepfe={<>
          <Telefon nummer={k.telefon} className="knopf knopf-primaer" label={t.ui.anrufen} />
          <Link href={pfade.kontakt} className="knopf knopf-sekundaer">{t.ui.kontaktAufnehmen}<Pfeil /></Link>
        </>}
        fakten={<>
          <span><strong>{t.ui.telefonzeiten}</strong> {k.telefonzeiten.tage}, {k.telefonzeiten.zeiten.join(" und ")}</span>
          <span><strong>{k.besuchsadresse.strasse}</strong> {k.besuchsadresse.plz} {k.besuchsadresse.ort}</span>
        </>}
        sprachen={<Sprachleiste sprachen={sprachen} titel={s.hero.sprachwahlTitel} aktuellLabel={t.kopf.aktuelleSprache} />}
      />
      <Laufband eintraege={t.sprachen} anhalten={t.ui.laufbandAnhalten} fortsetzen={t.ui.laufbandFortsetzen} />

      <section className="behaelter abschnitt" aria-labelledby="kanzlei-titel">
        <div className="zweispaltig">
          <div className="kleber">
            <Abschnittskopf nummer="01" id="kanzlei-titel" titel={s.kanzlei.titel} klasse="mb-0" />
          </div>
          <div className="absaetze-gross" data-reveal>
            {s.kanzlei.absaetze.map((a) => <p key={a}>{a}</p>)}
          </div>
        </div>
        <div className="mt-14 grid gap-5">
          <h3 className="titel-4" data-reveal>{s.erreichbarkeit.titel}</h3>
          <Erreichbarkeit kanzlei={k} t={erreichbarkeit} />
        </div>
      </section>

      <Schiene labelledBy="gebiete-titel" kopf={
        <div className="abschnitt-zeile">
          <Abschnittskopf nummer="02" id="gebiete-titel" titel={s.rechtsgebiete.titel} text={s.rechtsgebiete.text} klasse="mb-0" />
          <p data-reveal><Link href={s.rechtsgebiete.link.ziel} className="pfeillink">{s.rechtsgebiete.link.text}<Pfeil /></Link></p>
        </div>
      }>
        {gebieteSortiert.map((r, i) => {
          const n = personenNachGebiet(r.slug);
          return (
            <Gebietskarte
              key={r.slug} i={i} schwerpunkt={r.schwerpunkt} marke="Schwerpunkt"
              link={<Link href={pfade.rechtsgebiet(r.slug)} className="karte-link karte-titel">{r.titel}</Link>}
              text={r.zusatz ?? undefined} fuss={`${n} ${n === 1 ? "Person" : "Personen"}`}
            />
          );
        })}
      </Schiene>

      <section className="behaelter abschnitt" aria-labelledby="team-titel">
        <div className="abschnitt-zeile mb-10">
          <Abschnittskopf nummer="03" id="team-titel" titel={s.team.titel} text={s.team.text} klasse="mb-0" />
          <p data-reveal><Link href={s.team.link.ziel} className="pfeillink">{s.team.link.text}<Pfeil /></Link></p>
        </div>
        <div className="grid gap-10">
          {gruppen.map((g) => {
            const liste = personen.filter((p) => p.gruppe === g);
            return (
              <div key={g} className="grid gap-4">
                <h3 className="gruppe-titel" data-reveal>{team.gruppen[g]}<span className="zaehler zahl">{liste.length}</span></h3>
                <ul className="portraits">
                  {liste.map((p, i) => (
                    <Personenkachel key={p.slug} i={i} k={{ slug: p.slug, name: `${p.vorname} ${p.nachname}`, rolle: p.rolle, pfad: pfade.person(p.slug), bild: p.portraitQuadrat }} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="behaelter abschnitt trenner" aria-labelledby="mitarbeit-titel">
        <Abschnittskopf nummer="04" id="mitarbeit-titel" titel={s.mitarbeit.titel} />
        <ul className="tafeln">
          <li className="tafel tafel-akzent" data-reveal>
            <Link href={s.mitarbeit.partnerschaft.link.ziel} className="karte-link">{s.mitarbeit.partnerschaft.titel}</Link>
            <p className="tafel-text">{s.mitarbeit.partnerschaft.text}</p>
            <span className="tafel-fuss">{s.mitarbeit.partnerschaft.link.text}<Pfeil /></span>
          </li>
          <li className="tafel" data-reveal style={{ "--i": 1 } as React.CSSProperties}>
            <Link href={s.mitarbeit.stellen.link.ziel} className="karte-link">{s.mitarbeit.stellen.titel}</Link>
            <p className="tafel-text">{s.mitarbeit.stellen.text}</p>
            <span className="tafel-fuss">{s.mitarbeit.stellen.link.text}<Pfeil /></span>
          </li>
        </ul>
      </section>
    </>
  );
}
