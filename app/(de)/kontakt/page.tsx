import type { Metadata } from "next";
import { Anfrageformular } from "@/components/Anfrageformular";
import { Erreichbarkeit } from "@/components/Erreichbarkeit";
import { Kapazitaetshinweis } from "@/components/Kapazitaetshinweis";
import { Seitenkopf } from "@/components/Seitenkopf";
import { SmartLink } from "@/components/SmartLink";
import { inhaltsquelle, pfade } from "@/lib/content";
import { seitenMetadaten } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const q = await inhaltsquelle();
  const [k, t, s] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getKontaktSeite()]);
  return seitenMetadaten({ titel: s.seoTitel, beschreibung: s.seoBeschreibung, pfad: pfade.kontakt, kanzlei: k, texte: t });
}

/** Kontakt und Anfahrt: Erreichbarkeit als drei Karten, dann Lage und externe Karten, zuletzt das mailto-Formular neben dem klebenden Hinweis der Kanzlei zu Anfragen. */
export default async function Kontakt() {
  const q = await inhaltsquelle();
  const [k, t, s] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getKontaktSeite()]);
  const erreichbarkeit = { telefonzeiten: t.ui.telefonzeiten, tage: k.telefonzeiten.tage, zeiten: k.telefonzeiten.zeiten, terminhinweis: k.telefonzeiten.terminhinweis, besuchsadresse: t.ui.besuchsadresse, postadresse: t.ui.postadresse, stockwerk: k.besuchsadresse.zusatz, telefon: t.ui.telefon, email: t.ui.email, anrufen: t.ui.anrufen };
  const formular = { ...t.formular, datenschutzLinkText: t.formular.datenschutzLink.text, datenschutzLinkZiel: t.formular.datenschutzLink.ziel };
  return (
    <>
      <Seitenkopf etikett={k.kurzbeschreibung} titel={s.titel} kinder={<p className="vorspann">{s.einleitung}</p>} />
      <div className="behaelter abschnitt grid gap-14">
        <section aria-labelledby="erreichbarkeit-titel" className="grid gap-5">
          <h2 id="erreichbarkeit-titel" className="nur-sr">{s.erreichbarkeitTitel}</h2>
          <Erreichbarkeit kanzlei={k} t={erreichbarkeit} gross />
        </section>
        <section aria-labelledby="anfahrt-titel" className="zweispaltig trenner pt-12">
          <div className="kleber grid gap-4" data-reveal>
            <h2 id="anfahrt-titel" className="titel-2">{s.anfahrtTitel}</h2>
            <span className="strich" aria-hidden="true" />
          </div>
          <div className="grid gap-5" data-reveal>
            <ul className="liste-punkte lauftext">
              <li>{k.besuchsadresse.strasse}, {k.besuchsadresse.plz} {k.besuchsadresse.ort}: {k.besuchsadresse.zusatz}.</li>
              {k.anfahrt.map((a) => <li key={a}>{a}</li>)}
            </ul>
            <p className="klein text-rahmen-2">{s.kartenHinweis}</p>
            <ul className="flex flex-wrap gap-3">
              {k.karten.map((m) => <li key={m.ziel}><SmartLink ziel={m.ziel} className="knopf knopf-sekundaer knopf-klein" neuesFensterText={t.ui.oeffnetNeuesFenster}>{m.text}</SmartLink></li>)}
            </ul>
          </div>
        </section>
        <section aria-labelledby="formular-titel" className="trenner grid gap-8 pt-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
          <div data-reveal>
            <h2 id="formular-titel" className="nur-sr">{s.formularTitel}</h2>
            <Anfrageformular texte={formular} empfaenger={k.email} />
          </div>
          <div className="kleber" data-reveal>
            <Kapazitaetshinweis titel={s.hinweis.titel} text={s.hinweis.text} zusatz={s.hinweis.zusatz} />
          </div>
        </section>
      </div>
    </>
  );
}
