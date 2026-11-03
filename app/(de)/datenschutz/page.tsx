import type { Metadata } from "next";
import { RechtSeite } from "@/components/RechtSeite";
import { inhaltsquelle, pfade } from "@/lib/content";
import { seitenMetadaten } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const q = await inhaltsquelle();
  const [k, t, s] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getRechtSeite("datenschutz")]);
  return seitenMetadaten({ titel: s.seoTitel, beschreibung: s.seoBeschreibung, pfad: pfade.datenschutz, kanzlei: k, texte: t });
}

export default async function Datenschutz() {
  const q = await inhaltsquelle();
  const [k, s, t] = await Promise.all([q.getKanzlei(), q.getRechtSeite("datenschutz"), q.getTexte()]);
  return <RechtSeite seite={s} etikett={k.kurzbeschreibung} standLabel={t.ui.stand} />;
}
