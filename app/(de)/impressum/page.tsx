import type { Metadata } from "next";
import { RechtSeite } from "@/components/RechtSeite";
import { inhaltsquelle, pfade } from "@/lib/content";
import { seitenMetadaten } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const q = await inhaltsquelle();
  const [k, t, s] = await Promise.all([q.getKanzlei(), q.getTexte(), q.getRechtSeite("impressum")]);
  return seitenMetadaten({ titel: s.seoTitel, beschreibung: s.seoBeschreibung, pfad: pfade.impressum, kanzlei: k, texte: t });
}

export default async function Impressum() {
  const q = await inhaltsquelle();
  const [k, s, t, nachweise] = await Promise.all([q.getKanzlei(), q.getRechtSeite("impressum"), q.getTexte(), q.getBildnachweise()]);
  return <RechtSeite seite={s} etikett={k.kurzbeschreibung} standLabel={t.ui.stand} bildnachweise={nachweise} bildnachweisTitel={t.footer.bildnachweis.text} />;
}
