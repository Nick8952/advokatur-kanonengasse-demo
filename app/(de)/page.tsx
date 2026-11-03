import type { Metadata } from "next";
import Link from "next/link";
import { Erreichbarkeit } from "@/components/Erreichbarkeit";
import { Figur } from "@/components/Bild";
import { Personenkachel } from "@/components/Personenkachel";
import { Sprachfenster } from "@/components/Sprachfenster";
import { Telefon } from "@/components/Telefon";
import { inhaltsquelle, pfade } from "@/lib/content";
import { seitenMetadaten, sprachAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const q = await inhaltsquelle();
  const [k, t, s] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getStartseite()]);
  return seitenMetadaten({ titel: s.seoTitel, beschreibung: s.seoBeschreibung, pfad: pfade.start, kanzlei: k, texte: t, istStart: true, alternates: sprachAlternates(t) });
}

/**
 * Startseite: Einstieg (Telefonzeile, Titel, Satz der Kanzlei, zwei Handlungen) neben den sechs Sprachfenstern; dann das Strassenfoto,
 * die Erreichbarkeit in drei Spalten, die Rechtsgebiete als Fenster, das Team als Fenster mit Portraits, Mitarbeit und Partnerschaft.
 * Sechs Abschnitte, fünf Layoutfamilien; kein Abschnitt wiederholt den vorigen.
 */
export default async function Startseite() {
  const q = await inhaltsquelle();
  const [k, t, s, personen, rechtsgebiete, team] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getStartseite(), q.getPersonen(), q.getRechtsgebiete(), q.getTeamSeite()]);
  const sprachen = t.sprachen.map((x) => ({ code: x.code, name: x.name, nameDeutsch: x.nameDeutsch, gruss: x.gruss, lang: x.lang, pfad: pfade.sprache(x.code), aktuell: x.code === "de" }));
  const gebieteSortiert = [...rechtsgebiete].sort((a, b) => Number(b.schwerpunkt) - Number(a.schwerpunkt) || a.reihenfolge - b.reihenfolge);
  const personenNachGebiet = (slug: string) => personen.filter((p) => p.rechtsgebiete.some((r) => r.slug === slug)).length;
  const erreichbarkeit = { telefonzeiten: t.ui.telefonzeiten, tage: k.telefonzeiten.tage, zeiten: k.telefonzeiten.zeiten, terminhinweis: k.telefonzeiten.terminhinweis, besuchsadresse: t.ui.besuchsadresse, postadresse: t.ui.postadresse, stockwerk: k.besuchsadresse.zusatz, telefon: t.ui.telefon, email: t.ui.email, anrufen: t.ui.anrufen };
  return (
    <>
      <section className="behaelter abschnitt" aria-labelledby="einstieg">
        <div className="hero">
          <div className="grid gap-6">
            <p className="telefonzeile">
              <strong>{t.ui.telefonzeiten}</strong>
              <span>{k.telefonzeiten.tage}, {k.telefonzeiten.zeiten.join(" und ")}</span>
            </p>
            <h1 id="einstieg" className="titel-1">{s.hero.titel}</h1>
            <p className="vorspann">{s.hero.text}</p>
            <div className="flex flex-wrap gap-3">
              <Telefon nummer={k.telefon} className="knopf knopf-primaer" label={t.ui.anrufen} />
              <Link href={pfade.kontakt} className="knopf knopf-sekundaer">{t.ui.kontaktAufnehmen}</Link>
            </div>
          </div>
          <Sprachfenster sprachen={sprachen} titel={s.hero.sprachwahlTitel} aktuellLabel={t.kopf.aktuelleSprache} />
        </div>
      </section>

      <section className="behaelter" aria-label={s.foto.legende}>
        <Figur bild={k.foto} sizes="(min-width: 80rem) 1200px, 100vw" legende={s.foto.legende} prio />
      </section>

      <section className="behaelter abschnitt" aria-labelledby="kanzlei-titel">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
          <div className="grid gap-4 content-start">
            <h2 id="kanzlei-titel" className="titel-2">{s.kanzlei.titel}</h2>
            {s.kanzlei.absaetze.map((a) => <p key={a} className="lauftext">{a}</p>)}
          </div>
          <div className="grid gap-4 content-start">
            <h2 className="titel-3">{s.erreichbarkeit.titel}</h2>
            <Erreichbarkeit kanzlei={k} t={erreichbarkeit} />
          </div>
        </div>
      </section>

      <section className="behaelter abschnitt trenner" aria-labelledby="gebiete-titel">
        <div className="grid gap-6">
          <div className="grid gap-3">
            <h2 id="gebiete-titel" className="titel-2">{s.rechtsgebiete.titel}</h2>
            <p className="lauftext">{s.rechtsgebiete.text}</p>
          </div>
          <ul className="fenster-raster fenster-raster-gebiete">
            {gebieteSortiert.map((r) => {
              const n = personenNachGebiet(r.slug);
              return (
                <li key={r.slug} className={`fenster fenster-gebiet${r.schwerpunkt ? " schwerpunkt" : ""}`}>
                  <Link href={pfade.rechtsgebiet(r.slug)} className="fenster-link fenster-titel">{r.titel}</Link>
                  {r.zusatz ? <span className="fenster-text">{r.zusatz}</span> : null}
                  <span className="fenster-text mt-auto pt-2">{n} {n === 1 ? "Person" : "Personen"}</span>
                </li>
              );
            })}
          </ul>
          <p><Link href={s.rechtsgebiete.link.ziel} className="textlink textlink-block">{s.rechtsgebiete.link.text}</Link></p>
        </div>
      </section>

      <section className="behaelter abschnitt trenner" aria-labelledby="team-titel">
        <div className="grid gap-6">
          <div className="grid gap-3">
            <h2 id="team-titel" className="titel-2">{s.team.titel}</h2>
            <p className="lauftext">{s.team.text}</p>
          </div>
          {(Object.keys(team.gruppen) as (keyof typeof team.gruppen)[]).map((g) => (
            <div key={g} className="grid gap-3">
              <h3 className="titel-4">{team.gruppen[g]}</h3>
              <ul className="fenster-raster fenster-raster-team">
                {personen.filter((p) => p.gruppe === g).map((p) => (
                  <Personenkachel key={p.slug} k={{ slug: p.slug, name: `${p.vorname} ${p.nachname}`, rolle: p.rolle, pfad: pfade.person(p.slug), bild: p.portraitQuadrat }} />
                ))}
              </ul>
            </div>
          ))}
          <p><Link href={s.team.link.ziel} className="textlink textlink-block">{s.team.link.text}</Link></p>
        </div>
      </section>

      <section className="behaelter abschnitt trenner" aria-labelledby="mitarbeit-titel">
        <div className="grid gap-6">
          <h2 id="mitarbeit-titel" className="titel-2">{s.mitarbeit.titel}</h2>
          <ul className="fenster-raster sm:grid-cols-2">
            <li className="fenster fenster-akzent min-h-[10rem]">
              <Link href={s.mitarbeit.partnerschaft.link.ziel} className="fenster-link fenster-titel titel-3">{s.mitarbeit.partnerschaft.titel}</Link>
              <span className="fenster-text">{s.mitarbeit.partnerschaft.text}</span>
              <span className="fenster-text mt-auto pt-2 font-semibold">{s.mitarbeit.partnerschaft.link.text}</span>
            </li>
            <li className="fenster min-h-[10rem]">
              <Link href={s.mitarbeit.stellen.link.ziel} className="fenster-link fenster-titel titel-3">{s.mitarbeit.stellen.titel}</Link>
              <span className="fenster-text">{s.mitarbeit.stellen.text}</span>
              <span className="fenster-text mt-auto pt-2 font-semibold">{s.mitarbeit.stellen.link.text}</span>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
