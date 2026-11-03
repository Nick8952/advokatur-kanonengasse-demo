import type { Metadata } from "next";
import { Abschnittskopf } from "@/components/Abschnittskopf";
import { Anfrageformular } from "@/components/Anfrageformular";
import { Buehne } from "@/components/Buehne";
import { Erreichbarkeit } from "@/components/Erreichbarkeit";
import { Gebietskarte } from "@/components/Gebietskarte";
import { Kapazitaetshinweis } from "@/components/Kapazitaetshinweis";
import { Laufband } from "@/components/Laufband";
import { Pfeil } from "@/components/Pfeil";
import { Schiene } from "@/components/Schiene";
import { SmartLink } from "@/components/SmartLink";
import { Sprachleiste } from "@/components/Sprachleiste";
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
 * Eine Seite je Sprache mit derselben Struktur wie die deutsche Startseite: Bühne (Einführung im Wortlaut der bisherigen Website), Laufband,
 * 01 Rechtsgebiete als Schiene (übersetzte Namen als Entwürfe, Verweis auf die deutsche Seite), 02 Team als Karten mit Namen und Rollen
 * im Original, 03 Kontakt mit Erreichbarkeit, Anfahrt, Formular und dem Hinweis zu Anfragen. Arabisch läuft von rechts nach links.
 */
export default async function Sprachseite({ params }: { params: Params }) {
  const { sprache } = await params;
  const q = await inhaltsquelle();
  const [k, t, s, personen, rechtsgebiete] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getSprachseite(sprache as Code), q.getPersonen(), q.getRechtsgebiete()]);
  if (!s) throw new Error(`Sprachseite «${sprache}» fehlt.`);
  const code = s.sprache;
  const sprachen = t.sprachen.map((x) => ({ code: x.code, name: x.name, lang: x.lang, pfad: pfade.sprache(x.code), aktuell: x.code === code }));
  const erreichbarkeit = { telefonzeiten: s.ui.telefonzeiten, tage: s.ui.tage, zeiten: s.ui.zeiten, terminhinweis: s.ui.terminhinweis, besuchsadresse: s.ui.besuchsadresse, postadresse: s.ui.postadresse, stockwerk: s.ui.stockwerk, telefon: s.ui.telefon, email: s.ui.email, anrufen: s.ui.anrufen };
  const formular = { ...s.formular, datenschutzLinkText: s.formular.datenschutzLink, datenschutzLinkZiel: pfade.datenschutz };
  const gebiete = [...rechtsgebiete].sort((a, b) => Number(b.schwerpunkt) - Number(a.schwerpunkt) || a.reihenfolge - b.reihenfolge);
  const gruppen = [...new Set(personen.map((p) => p.gruppe))];
  const entwurf = s.kapazitaetshinweis.status === "entwurf" ? t.ui.entwurf : undefined;
  return (
    <>
      <Buehne
        id="kanzlei" foto={k.foto} etikett={k.name} titel={s.titel} titelId="einstieg" vorspann={s.intro}
        knoepfe={<>
          <Telefon nummer={k.telefon} className="knopf knopf-primaer" label={s.ui.anrufen} />
          <a href="#kontakt" className="knopf knopf-sekundaer">{s.ui.kontaktTitel}<Pfeil /></a>
        </>}
        fakten={<>
          <span><strong>{s.ui.telefonzeiten}</strong> {s.ui.tage}, {s.ui.zeiten.map((z, i) => <span key={z}>{i ? ", " : ""}<bdi dir="auto">{z}</bdi></span>)}</span>
          <span><strong>{s.ui.terminhinweis}</strong></span>
          <span><bdi dir="ltr">{k.besuchsadresse.strasse}, {k.besuchsadresse.plz} {k.besuchsadresse.ort}</bdi></span>
        </>}
        sprachen={<Sprachleiste sprachen={sprachen} titel={s.ui.spracheWaehlen} aktuellLabel={s.ui.sprache} />}
      />
      <Laufband eintraege={t.sprachen} anhalten={s.ui.laufbandAnhalten} fortsetzen={s.ui.laufbandFortsetzen} />

      <Schiene id="rechtsgebiete" labelledBy="gebiete-titel" kopf={<Abschnittskopf nummer="01" id="gebiete-titel" titel={s.ui.rechtsgebieteTitel} text={s.ui.rechtsgebieteText} klasse="mb-0" />}>
        {gebiete.map((r, i) => (
          <Gebietskarte
            key={r.slug} i={i} schwerpunkt={r.schwerpunkt}
            link={<SmartLink ziel={pfade.rechtsgebiet(r.slug)} className="karte-link karte-titel" hrefLang="de">{r.uebersetzungen[code].titel}</SmartLink>}
            text={<bdi dir="ltr" lang="de">{r.titel}</bdi>} fuss={s.ui.nurDeutsch}
          />
        ))}
      </Schiene>

      <section id="team" className="behaelter abschnitt" aria-labelledby="team-titel">
        <Abschnittskopf nummer="02" id="team-titel" titel={s.ui.teamTitel} text={s.ui.teamText} />
        <div className="grid gap-10">
          {gruppen.map((g) => (
            <section key={g} aria-labelledby={`gruppe-${g}`} className="grid gap-4">
              <h3 id={`gruppe-${g}`} className="gruppe-titel" data-reveal>{s.ui.gruppen[g]}</h3>
              <ul className="personen-karten">
                {personen.filter((p) => p.gruppe === g).map((p, i) => (
                  <li key={p.slug} className="personen-karte" data-reveal style={{ "--i": i % 3 } as React.CSSProperties}>
                    <SmartLink ziel={pfade.person(p.slug)} className="karte-link titel-4" hrefLang="de"><bdi dir="ltr">{p.vorname} {p.nachname}</bdi></SmartLink>
                    <span className="karte-text"><bdi dir="ltr" lang="de">{p.rolle}</bdi></span>
                    <span className="karte-text">{s.ui.gesprocheneSprachen}: <bdi dir="ltr" lang="de">{p.sprachen.map((x) => x.name).join(", ")}</bdi></span>
                    <span className="karte-text mt-2 flex items-center justify-between gap-3"><bdi dir="ltr" className="zahl">{p.telefon}</bdi><span className="meta">{s.ui.nurDeutsch}</span></span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <section id="kontakt" className="behaelter abschnitt trenner" aria-labelledby="kontakt-titel">
        <Abschnittskopf nummer="03" id="kontakt-titel" titel={s.ui.kontaktTitel} />
        <div className="grid gap-12">
          <Erreichbarkeit kanzlei={k} t={erreichbarkeit} gross />
          <div className="zweispaltig">
            <div className="kleber grid gap-4" data-reveal>
              <h3 className="titel-3">{s.ui.anfahrt}</h3>
              <span className="strich" aria-hidden="true" />
            </div>
            <div className="grid gap-5" data-reveal>
              <ul className="liste-punkte lauftext">
                <li><bdi dir="ltr">{k.besuchsadresse.strasse}, {k.besuchsadresse.plz} {k.besuchsadresse.ort}</bdi>: {s.ui.stockwerk}.</li>
                {s.ui.anfahrtPunkte.map((a) => <li key={a}>{a}</li>)}
              </ul>
              <ul className="flex flex-wrap gap-3">
                {s.ui.karten.map((m) => <li key={m.ziel}><SmartLink ziel={m.ziel} className="knopf knopf-sekundaer knopf-klein" neuesFensterText={s.ui.oeffnetNeuesFenster}>{m.text}</SmartLink></li>)}
              </ul>
            </div>
          </div>
          <div className="grid gap-8 trenner pt-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
            <div data-reveal><Anfrageformular texte={formular} empfaenger={k.email} ueberschriftStufe={3} /></div>
            <div className="kleber" data-reveal><Kapazitaetshinweis titel={s.ui.hinweisTitel} text={s.kapazitaetshinweis.text} entwurf={entwurf} /></div>
          </div>
          <p className="klein text-rahmen-2 max-w-[70ch]">{s.ui.uebersetzungshinweis}</p>
        </div>
      </section>
    </>
  );
}
