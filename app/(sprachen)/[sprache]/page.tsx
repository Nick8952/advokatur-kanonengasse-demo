import type { Metadata } from "next";
import { Anfrageformular } from "@/components/Anfrageformular";
import { Erreichbarkeit } from "@/components/Erreichbarkeit";
import { Figur } from "@/components/Bild";
import { Kapazitaetshinweis } from "@/components/Kapazitaetshinweis";
import { SmartLink } from "@/components/SmartLink";
import { Sprachfenster } from "@/components/Sprachfenster";
import { Telefon } from "@/components/Telefon";
import { inhaltsquelle, pfade } from "@/lib/content";
import { seitenMetadaten, sprachAlternates } from "@/lib/seo";

type Params = Promise<{ sprache: string }>;
type Code = "en" | "fr" | "it" | "es" | "ar";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sprache } = await params;
  const q = await inhaltsquelle();
  const [k, t, s] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getSprachseite(sprache as Code)]);
  if (!s) return {};
  return seitenMetadaten({ titel: s.seoTitel, beschreibung: s.seoBeschreibung, pfad: pfade.sprache(s.sprache), kanzlei: k, texte: t, istStart: true, sprache: s.sprache, alternates: sprachAlternates(t) });
}

/**
 * Eine Seite je Sprache mit vier Abschnitten (Kanzlei, Rechtsgebiete, Team, Kontakt). Die Einführung steht im Wortlaut der bisherigen
 * Website; Rechtsgebiete erscheinen mit übersetzten Namen (Entwürfe) und verweisen auf die deutsche Seite; das Team mit Namen und Rollen
 * im Original, die Profile sind Deutsch. Kontakt mit Erreichbarkeit, Formular und dem Hinweis zu Anfragen.
 */
export default async function Sprachseite({ params }: { params: Params }) {
  const { sprache } = await params;
  const q = await inhaltsquelle();
  const [k, t, s, personen, rechtsgebiete] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getSprachseite(sprache as Code), q.getPersonen(), q.getRechtsgebiete()]);
  if (!s) throw new Error(`Sprachseite «${sprache}» fehlt.`);
  const code = s.sprache;
  const sprachen = t.sprachen.map((x) => ({ code: x.code, name: x.name, nameDeutsch: x.nameDeutsch, gruss: x.gruss, lang: x.lang, pfad: pfade.sprache(x.code), aktuell: x.code === code }));
  const erreichbarkeit = { telefonzeiten: s.ui.telefonzeiten, tage: s.ui.tage, zeiten: s.ui.zeiten, terminhinweis: s.ui.terminhinweis, besuchsadresse: s.ui.besuchsadresse, postadresse: s.ui.postadresse, stockwerk: s.ui.stockwerk, telefon: s.ui.telefon, email: s.ui.email, anrufen: s.ui.anrufen };
  const formular = { ...s.formular, datenschutzLinkText: s.formular.datenschutzLink, datenschutzLinkZiel: pfade.datenschutz };
  const gebiete = [...rechtsgebiete].sort((a, b) => Number(b.schwerpunkt) - Number(a.schwerpunkt) || a.reihenfolge - b.reihenfolge);
  const gruppen = [...new Set(personen.map((p) => p.gruppe))];
  const entwurf = s.kapazitaetshinweis.status === "entwurf" ? t.ui.entwurf : undefined;
  return (
    <>
      <section id="kanzlei" className="behaelter abschnitt scroll-mt-4" aria-labelledby="einstieg">
        <div className="hero">
          <div className="grid gap-6">
            <p className="telefonzeile">
              <strong>{s.ui.telefonzeiten}</strong>
              <span>{s.ui.tage}, {s.ui.zeiten.join(", ")}</span>
            </p>
            <h1 id="einstieg" className="titel-1">{s.titel}</h1>
            {s.intro.map((a) => <p key={a} className="vorspann">{a}</p>)}
            <p className="font-semibold">{s.ui.terminhinweis}</p>
            <div className="flex flex-wrap gap-3">
              <Telefon nummer={k.telefon} className="knopf knopf-primaer" label={s.ui.anrufen} />
              <a href="#kontakt" className="knopf knopf-sekundaer">{s.ui.kontaktTitel}</a>
            </div>
          </div>
          <Sprachfenster sprachen={sprachen} titel={s.ui.spracheWaehlen} aktuellLabel={s.ui.sprache} />
        </div>
      </section>

      <section className="behaelter" aria-label={k.foto.alt}>
        <Figur bild={k.foto} sizes="(min-width: 80rem) 1200px, 100vw" legende={`${k.besuchsadresse.strasse}, ${k.besuchsadresse.plz} ${k.besuchsadresse.ort}`} prio />
      </section>

      <section id="rechtsgebiete" className="behaelter abschnitt scroll-mt-4" aria-labelledby="gebiete-titel">
        <div className="grid gap-6">
          <div className="grid gap-3">
            <h2 id="gebiete-titel" className="titel-2">{s.ui.rechtsgebieteTitel}</h2>
            <p className="lauftext">{s.ui.rechtsgebieteText}</p>
          </div>
          <ul className="fenster-raster fenster-raster-gebiete">
            {gebiete.map((r) => (
              <li key={r.slug} className={`fenster fenster-gebiet${r.schwerpunkt ? " schwerpunkt" : ""}`}>
                <SmartLink ziel={pfade.rechtsgebiet(r.slug)} className="fenster-link fenster-titel" hrefLang="de">{r.uebersetzungen[code].titel}</SmartLink>
                <span className="fenster-text"><bdi dir="ltr" lang="de">{r.titel}</bdi></span>
                <span className="fenster-text mt-auto pt-2">{s.ui.nurDeutsch}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="team" className="behaelter abschnitt trenner scroll-mt-4" aria-labelledby="team-titel">
        <div className="grid gap-6">
          <div className="grid gap-3">
            <h2 id="team-titel" className="titel-2">{s.ui.teamTitel}</h2>
            <p className="lauftext">{s.ui.teamText}</p>
          </div>
          {gruppen.map((g) => (
            <ul key={g} className="fenster-raster fenster-raster-gebiete">
              {personen.filter((p) => p.gruppe === g).map((p) => (
                <li key={p.slug} className="fenster">
                  <SmartLink ziel={pfade.person(p.slug)} className="fenster-link fenster-titel" hrefLang="de"><bdi dir="ltr">{p.vorname} {p.nachname}</bdi></SmartLink>
                  <span className="fenster-text"><bdi dir="ltr" lang="de">{p.rolle}</bdi></span>
                  <span className="fenster-text">{s.ui.gesprocheneSprachen}: {p.sprachen.map((x) => x.name).join(", ")}</span>
                  <span className="fenster-text mt-auto pt-2"><bdi dir="ltr">{p.telefon}</bdi></span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      <section id="kontakt" className="behaelter abschnitt trenner scroll-mt-4" aria-labelledby="kontakt-titel">
        <div className="grid gap-10">
          <h2 id="kontakt-titel" className="titel-2">{s.ui.kontaktTitel}</h2>
          <Erreichbarkeit kanzlei={k} t={erreichbarkeit} gross />
          <div className="grid gap-4">
            <h3 className="titel-3">{s.ui.anfahrt}</h3>
            <ul className="liste-punkte lauftext">
              <li><bdi dir="ltr">{k.besuchsadresse.strasse}, {k.besuchsadresse.plz} {k.besuchsadresse.ort}</bdi>: {s.ui.stockwerk}.</li>
              {s.ui.anfahrtPunkte.map((a) => <li key={a}>{a}</li>)}
            </ul>
            <ul className="flex flex-wrap gap-3">
              {s.ui.karten.map((m) => <li key={m.ziel}><SmartLink ziel={m.ziel} className="knopf knopf-sekundaer knopf-klein" neuesFensterText={s.ui.oeffnetNeuesFenster}>{m.text}</SmartLink></li>)}
            </ul>
          </div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
            <Anfrageformular texte={formular} empfaenger={k.email} ueberschriftStufe={3} />
            <Kapazitaetshinweis titel={s.ui.hinweisTitel} text={s.kapazitaetshinweis.text} entwurf={entwurf} />
          </div>
          <p className="klein text-rahmen-2 max-w-[70ch]">{s.ui.uebersetzungshinweis}</p>
        </div>
      </section>
    </>
  );
}
