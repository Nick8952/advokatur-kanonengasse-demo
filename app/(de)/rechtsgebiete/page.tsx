import type { Metadata } from "next";
import Link from "next/link";
import { inhaltsquelle, pfade } from "@/lib/content";
import { seitenMetadaten } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const q = await inhaltsquelle();
  const [k, t, s] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getRechtsgebieteSeite()]);
  return seitenMetadaten({ titel: s.seoTitel, beschreibung: s.seoBeschreibung, pfad: pfade.rechtsgebiete, kanzlei: k, texte: t });
}

/** Rechtsgebiete: Schwerpunkte zuerst, je Gebiet die Bezeichnungen der Profile, belegte Hintergründe und die Ansprechpersonen. */
export default async function Rechtsgebiete() {
  const q = await inhaltsquelle();
  const [s, rechtsgebiete, personen] = await Promise.all([q.getRechtsgebieteSeite(), q.getRechtsgebiete(), q.getPersonen()]);
  const schwerpunkte = rechtsgebiete.filter((r) => r.schwerpunkt);
  const weitere = rechtsgebiete.filter((r) => !r.schwerpunkt);
  const personenZu = (slug: string) => personen.filter((p) => p.rechtsgebiete.some((r) => r.slug === slug));
  const Gebiet = ({ r }: { r: (typeof rechtsgebiete)[number] }) => (
    <article id={r.slug} className="gebiet" aria-labelledby={`${r.slug}-titel`}>
      <div className="grid gap-2 content-start">
        <h3 id={`${r.slug}-titel`} className="titel-3">{r.titel}</h3>
        {r.zusatz ? <p className="meta">{r.zusatz}</p> : null}
      </div>
      <div className="grid gap-5">
        <div className="grid gap-2">
          <h4 className="titel-4">{s.personenTitel}</h4>
          <ul className="personen-liste">
            {personenZu(r.slug).map((p) => <li key={p.slug}><Link href={pfade.person(p.slug)} className="textlink">{p.vorname} {p.nachname}</Link></li>)}
          </ul>
        </div>
        {r.begriffe.length > 1 || (r.begriffe.length === 1 && r.begriffe[0] !== r.titel) ? (
          <div className="grid gap-2">
            <h4 className="titel-4">{s.begriffeTitel}</h4>
            <ul className="liste-punkte klein">{r.begriffe.map((b) => <li key={b}>{b}</li>)}</ul>
          </div>
        ) : null}
        {r.hintergrund.length ? (
          <div className="grid gap-2">
            <h4 className="titel-4">{s.hintergrundTitel}</h4>
            <ul className="liste-punkte klein">{r.hintergrund.map((h) => <li key={h}>{h}</li>)}</ul>
          </div>
        ) : null}
      </div>
    </article>
  );
  return (
    <div className="behaelter abschnitt grid gap-10">
      <header className="grid gap-4">
        <h1 className="titel-1">{s.titel}</h1>
        {s.einleitung.map((a) => <p key={a} className="vorspann">{a}</p>)}
      </header>
      <section aria-labelledby="schwerpunkte-titel" className="grid">
        <h2 id="schwerpunkte-titel" className="nur-sr">Schwerpunkte</h2>
        {schwerpunkte.map((r) => <Gebiet key={r.slug} r={r} />)}
      </section>
      <section aria-labelledby="weitere-titel" className="grid gap-4">
        <h2 id="weitere-titel" className="titel-2">{s.weitereTitel}</h2>
        <div className="grid">{weitere.map((r) => <Gebiet key={r.slug} r={r} />)}</div>
      </section>
      <p className="hinweis">{s.hinweis}</p>
    </div>
  );
}
