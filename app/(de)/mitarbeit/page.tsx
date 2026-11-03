import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@/components/RichText";
import { Seitenkopf } from "@/components/Seitenkopf";
import { EMail, Telefon } from "@/components/Telefon";
import { inhaltsquelle, pfade } from "@/lib/content";
import { seitenMetadaten } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const q = await inhaltsquelle();
  const [k, t, s] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getMitarbeitSeite()]);
  return seitenMetadaten({ titel: s.seoTitel, beschreibung: s.seoBeschreibung, pfad: pfade.mitarbeit, kanzlei: k, texte: t });
}

/**
 * Mitarbeit und Partnerschaft: die Stellenausschreibung(en) mit Status «veroeffentlicht» und der Partnerschaftstext, beide mit sichtbarem
 * Stand der Angaben (datierte Aussagen stammen aus der Quelle und werden nicht fortgeschrieben). Archivierte oder Entwürfe erscheinen nicht.
 */
export default async function Mitarbeit() {
  const q = await inhaltsquelle();
  const [k, s, personen, t] = await Promise.all([q.getKanzlei(), q.getMitarbeitSeite(), q.getPersonen(), q.getTexte()]);
  // Kalendertag in Zürich (nicht UTC): massgebend für «sichtbar ab» und «sichtbar bis»
  const heute = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Zurich" }).format(new Date());
  const sichtbar = s.stellen.filter((st) => st.status === "veroeffentlicht" && (!st.veroeffentlichtAb || st.veroeffentlichtAb <= heute) && (!st.archiviertAb || st.archiviertAb > heute));
  const person = (slug: string) => personen.find((p) => p.slug === slug);
  const pa = s.partnerschaft;
  return (
    <>
      <Seitenkopf
        etikett={k.kurzbeschreibung} titel={s.titel} kinder={<p className="vorspann">{s.einleitung}</p>}
        zeile={<ul className="pillen"><li><a href="#offene-stellen" className="pille">{s.stellenTitel}</a></li>{pa.status === "veroeffentlicht" ? <li><a href="#partnerschaft" className="pille">{pa.titel}</a></li> : null}</ul>}
      />
      <div className="behaelter abschnitt grid gap-14">
        <section id="offene-stellen" aria-labelledby="stellen-titel" className="zweispaltig scroll-mt-24">
          <div className="kleber grid gap-4" data-reveal>
            <h2 id="stellen-titel" className="titel-2">{s.stellenTitel}</h2>
            <span className="strich" aria-hidden="true" />
          </div>
          <div className="grid gap-10">
            {sichtbar.length === 0 ? <p className="hinweis">{s.keineStellen}</p> : null}
            {sichtbar.map((st) => {
              const kontakt = person(st.bewerbung.person);
              return (
                <article key={st.slug} id={st.slug} className="grid gap-5 scroll-mt-24" data-reveal>
                  <h3 className="titel-3">{st.titel}</h3>
                  <RichText bloecke={st.bloecke} titelStufe={3} />
                  <div className="hinweis grid gap-2">
                    <h4 className="titel-4">{s.bewerbungTitel}</h4>
                    <p>{st.bewerbung.text}</p>
                    <p>
                      <EMail adresse={st.bewerbung.email} />
                      {kontakt ? <span className="meta block">{kontakt.vorname} {kontakt.nachname}, {kontakt.rolle} (<Link href={pfade.person(kontakt.slug)} className="textlink">Profil</Link>)</span> : null}
                    </p>
                  </div>
                  {st.stand ? <p className="meta">{s.standLabel}: {st.stand}</p> : null}
                </article>
              );
            })}
          </div>
        </section>

        {pa.status === "veroeffentlicht" ? (
          <section id="partnerschaft" aria-labelledby="partnerschaft-titel" className="zweispaltig trenner pt-12 scroll-mt-24">
            <div className="kleber grid gap-4" data-reveal>
              <h2 id="partnerschaft-titel" className="titel-2">{pa.titel}</h2>
              <span className="strich" aria-hidden="true" />
            </div>
            <div className="grid gap-8" data-reveal>
              <RichText bloecke={pa.bloecke} titelStufe={3} />
              <div className="grid gap-3">
                <h3 className="titel-4">{pa.kontakteTitel}</h3>
                <ul className="karten-3 sm:grid-cols-2">
                  {pa.kontakte.map((kk) => {
                    const p = person(kk.person);
                    return (
                      <li key={kk.person} className="karte-info gap-1">
                        <span className="font-semibold">{p ? <Link href={pfade.person(p.slug)} className="textlink textlink-block">{p.vorname} {p.nachname}</Link> : kk.person}</span>
                        {p ? <span className="meta">{p.rolle}</span> : null}
                        <span><EMail adresse={kk.email} /></span>
                        <span><Telefon nummer={kk.telefon} label={t.ui.anrufen} /></span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {pa.stand ? <p className="meta">{s.standLabel}: {pa.stand}</p> : null}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
