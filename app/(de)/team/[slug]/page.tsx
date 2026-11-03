import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bild } from "@/components/Bild";
import { EMail, Telefon } from "@/components/Telefon";
import { inhaltsquelle, pfade } from "@/lib/content";
import { indexierungErlaubt, jsonLdSicher, personJsonLd, seitenMetadaten } from "@/lib/seo";

// Alle Profile beim Build erzeugen; unbekannte Adressen führen zur Fehlerseite (statischer Export).
export const dynamicParams = false;
export async function generateStaticParams() {
  const q = await inhaltsquelle();
  return (await q.getPersonen()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const q = await inhaltsquelle();
  const [k, t, p] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getPerson(slug)]);
  if (!p) return {};
  return seitenMetadaten({ titel: `${p.vorname} ${p.nachname}`, beschreibung: p.seoBeschreibung, pfad: pfade.person(p.slug), bild: p.portrait, kanzlei: k, texte: t, profil: true });
}

/**
 * Profil: Portrait im Original-Seitenverhältnis, daneben die Angaben der Quelle (Rolle, Sprachen, Rechtsgebiete mit Fussnote,
 * Telefon, E-Mail falls belegt), darunter Werdegang und Mitgliedschaften im Wortlaut. Ich-Form bleibt, wo die Quelle sie verwendet.
 */
export default async function Profil({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const q = await inhaltsquelle();
  const [k, s, p, rechtsgebiete] = await Promise.all([q.getKanzlei(), q.getTeamSeite(), q.getPerson(slug), q.getRechtsgebiete()]);
  if (!p) notFound();
  const name = `${p.vorname} ${p.nachname}`;
  const gebietTitel = (gs: string | null) => rechtsgebiete.find((r) => r.slug === gs)?.titel;
  return (
    <article className="behaelter abschnitt">
      <p className="mb-4"><Link href={pfade.team} className="textlink textlink-block">{s.profil.zurueck}</Link></p>
      <div className="profil">
        <div className="profil-bild">
          <Bild bild={p.portrait} sizes="(min-width: 56rem) 40vw, 100vw" prio className="block h-auto w-full" />
        </div>
        <div className="grid gap-8">
          <header className="grid gap-2">
            <h1 className="titel-1">{name}</h1>
            <p className="vorspann">{p.rolle}</p>
          </header>
          <dl className="fakten">
            <div>
              <dt>{s.profil.sprachen}</dt>
              <dd>{p.sprachenOriginal}</dd>
            </div>
            <div>
              <dt>{p.rechtsgebieteTitel ?? "Rechtsgebiete"}</dt>
              <dd>
                {p.rechtsgebiete.length ? (
                  <ul className="liste-schlicht">
                    {p.rechtsgebiete.map((r, i) => (
                      <li key={`${r.text}-${i}`}>
                        {r.slug ? <Link href={pfade.rechtsgebiet(r.slug)} className="textlink textlink-block" title={gebietTitel(r.slug)}>{r.text}</Link> : <span className="textlink-block">{r.text}</span>}
                        {r.fussnote ? <sup className="ms-1"><a href={`#fussnote-${r.fussnote}`} className="textlink" aria-label={`${s.profil.fussnotenTitel} ${r.fussnote}`}>{r.fussnote}</a></sup> : null}
                      </li>
                    ))}
                  </ul>
                ) : <span className="meta">{s.profil.keineRechtsgebiete}</span>}
              </dd>
            </div>
            <div>
              <dt>{p.telefonBezeichnung}</dt>
              <dd><Telefon nummer={p.telefon} label={`${name} anrufen`} /></dd>
            </div>
            {p.email ? (
              <div>
                <dt>{s.profil.email}</dt>
                <dd><EMail adresse={p.email} /></dd>
              </div>
            ) : (
              <div>
                <dt>{s.profil.emailKanzlei}</dt>
                <dd><EMail adresse={k.email} /></dd>
              </div>
            )}
          </dl>
          <section aria-labelledby="werdegang" className="grid gap-3">
            <h2 id="werdegang" className="titel-3">{s.profil.werdegang}</h2>
            {p.werdegang.map((a) => <p key={a} className="lauftext">{a}</p>)}
          </section>
          {p.mitgliedschaften.length ? (
            <section aria-labelledby="mitgliedschaften" className="grid gap-3">
              <h2 id="mitgliedschaften" className="titel-3">{p.mitgliedschaftenTitel ?? "Mitgliedschaften"}</h2>
              <ul className="liste-punkte">{p.mitgliedschaften.map((m) => <li key={m}>{m}</li>)}</ul>
            </section>
          ) : null}
          {p.fussnoten.length ? (
            <section aria-labelledby="fussnoten" className="grid gap-2">
              <h2 id="fussnoten" className="titel-4">{s.profil.fussnotenTitel}</h2>
              <ol className="klein grid gap-1 list-decimal ps-5">{p.fussnoten.map((f, i) => <li key={f} id={`fussnote-${i + 1}`}>{f}</li>)}</ol>
            </section>
          ) : null}
        </div>
      </div>
      {indexierungErlaubt ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSicher(personJsonLd(p, k)) }} /> : null}
    </article>
  );
}
