import type { Metadata } from "next";
import { Anfrageformular } from "@/components/Anfrageformular";
import { Erreichbarkeit } from "@/components/Erreichbarkeit";
import { Kapazitaetshinweis } from "@/components/Kapazitaetshinweis";
import { SmartLink } from "@/components/SmartLink";
import { inhaltsquelle, pfade } from "@/lib/content";
import { seitenMetadaten } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const q = await inhaltsquelle();
  const [k, t, s] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getKontaktSeite()]);
  return seitenMetadaten({ titel: s.seoTitel, beschreibung: s.seoBeschreibung, pfad: pfade.kontakt, kanzlei: k, texte: t });
}

/** Kontakt und Anfahrt: Erreichbarkeit zuerst, dann Lage und externe Karten, der Hinweis der Kanzlei zu Anfragen und das mailto-Formular. */
export default async function Kontakt() {
  const q = await inhaltsquelle();
  const [k, t, s] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getKontaktSeite()]);
  const erreichbarkeit = { telefonzeiten: t.ui.telefonzeiten, tage: k.telefonzeiten.tage, zeiten: k.telefonzeiten.zeiten, terminhinweis: k.telefonzeiten.terminhinweis, besuchsadresse: t.ui.besuchsadresse, postadresse: t.ui.postadresse, stockwerk: k.besuchsadresse.zusatz, telefon: t.ui.telefon, email: t.ui.email, anrufen: t.ui.anrufen };
  const formular = { ...t.formular, datenschutzLinkText: t.formular.datenschutzLink.text, datenschutzLinkZiel: t.formular.datenschutzLink.ziel };
  return (
    <div className="behaelter abschnitt grid gap-12">
      <header className="grid gap-4">
        <h1 className="titel-1">{s.titel}</h1>
        <p className="vorspann">{s.einleitung}</p>
      </header>
      <section aria-labelledby="erreichbarkeit-titel" className="grid gap-5">
        <h2 id="erreichbarkeit-titel" className="nur-sr">{s.erreichbarkeitTitel}</h2>
        <Erreichbarkeit kanzlei={k} t={erreichbarkeit} gross />
      </section>
      <section aria-labelledby="anfahrt-titel" className="trenner grid gap-4 pt-10">
        <h2 id="anfahrt-titel" className="titel-2">{s.anfahrtTitel}</h2>
        <ul className="liste-punkte lauftext">
          <li>{k.besuchsadresse.strasse}, {k.besuchsadresse.plz} {k.besuchsadresse.ort}: {k.besuchsadresse.zusatz}.</li>
          {k.anfahrt.map((a) => <li key={a}>{a}</li>)}
        </ul>
        <p className="klein text-rahmen-2">{s.kartenHinweis}</p>
        <ul className="flex flex-wrap gap-3">
          {k.karten.map((m) => <li key={m.ziel}><SmartLink ziel={m.ziel} className="knopf knopf-sekundaer knopf-klein" neuesFensterText={t.ui.oeffnetNeuesFenster}>{m.text}</SmartLink></li>)}
        </ul>
      </section>
      <section aria-labelledby="formular-titel" className="trenner grid gap-8 pt-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
        <div>
          <h2 id="formular-titel" className="nur-sr">{s.formularTitel}</h2>
          <Anfrageformular texte={formular} empfaenger={k.email} />
        </div>
        <Kapazitaetshinweis titel={s.hinweis.titel} text={s.hinweis.text} zusatz={s.hinweis.zusatz} />
      </section>
    </div>
  );
}
