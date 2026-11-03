import type { Block, Inhaltsquelle } from "./modell";
import { blockText } from "./text";

/**
 * Was vor dem Go-Live noch offen ist, gelesen aus der Inhaltsquelle, die der Build tatsächlich verwendet (lokal oder Sanity):
 *  - Kanzleiangaben, Seitenbelege, Personen, Rechtsgebiete und Sprachfassungen, die die Kanzlei noch nicht freigegeben hat (`freigabe` ist nicht «live»)
 *  - Übersetzungen mit Status «entwurf»
 *  - Rechtstexte, die noch die Demo beschreiben
 * Die Liste benutzt `npm run inhalt:pruefen -- --live`, und der Build bricht mit ihr ab, sobald INDEXIERUNG=1 für eine echte
 * Domain gesetzt ist: Eine indexierbare Website mit unbestätigten Angaben kann so nicht entstehen.
 */
export async function offeneFreigaben(q: Inhaltsquelle): Promise<string[]> {
  const [k, start, personen, rechtsgebiete, rgSeite, team, mitarbeit, kontakt, impressum, datenschutz, sprachseiten] = await Promise.all([
    q.getKanzlei(), q.getStartseite(), q.getPersonen(), q.getRechtsgebiete(), q.getRechtsgebieteSeite(), q.getTeamSeite(), q.getMitarbeitSeite(), q.getKontaktSeite(),
    q.getRechtSeite("impressum"), q.getRechtSeite("datenschutz"), q.getSprachseiten(),
  ]);
  const offen: string[] = [];
  const pruefe = (wo: string, titel: string, freigabe: string) => { if (freigabe !== "live") offen.push(`Noch nicht von der Kanzlei freigegeben: ${wo}, «${titel}»`); };
  pruefe("Kanzleiangaben", "Adressen, Telefon, E-Mail, Telefonzeiten, Anfahrt", k.freigabe);
  pruefe("Startseite", "Einstieg und Abschnitte", start.belege.freigabe);
  for (const p of personen) pruefe("Profil", `${p.vorname} ${p.nachname} (Text, Portrait, Zuordnungen)`, p.freigabe);
  for (const r of rechtsgebiete) {
    pruefe("Rechtsgebiete", r.titel, r.freigabe);
    for (const [code, u] of Object.entries(r.uebersetzungen)) if (u.status !== "freigegeben") offen.push(`Übersetzung noch Entwurf: Rechtsgebiet «${r.titel}» (${code}: «${u.titel}»)`);
  }
  pruefe("Rechtsgebiete", "Übersichtsseite", rgSeite.belege.freigabe);
  pruefe("Team", "Übersichtsseite, Gruppen, externer Link", team.belege.freigabe);
  pruefe("Mitarbeit und Partnerschaft", "Stellen und Partnerschaftstext (Aktualität der Daten)", mitarbeit.belege.freigabe);
  pruefe("Kontakt und Anfahrt", "Lage, Anfahrt, Hinweis zu Anfragen und Mandatsannahme", kontakt.belege.freigabe);
  pruefe("Impressum", "Betreiberangaben und Texte", impressum.belege.freigabe);
  pruefe("Datenschutzerklärung", "Verantwortliche und Texte", datenschutz.belege.freigabe);
  for (const s of sprachseiten) {
    pruefe(`Sprachfassung ${s.nameDeutsch}`, "Texte der Oberfläche und Hinweise", s.belege.freigabe);
    if (s.kapazitaetshinweis.status !== "quelle") offen.push(`Übersetzung noch Entwurf: Hinweis zu Anfragen (${s.sprache})`);
  }
  // Heuristik, keine Garantie: Merkmale der Demo-Fassung (Zweck, Betreiber, Hosting). Die produktiven Rechtstexte schreibt die Kanzlei neu
  // und gibt sie frei; erst dann darf «freigabe» auf «live» stehen (docs/UEBERGABE.md).
  const DEMO_MERKMALE = /\bDemo\b|Verkaufs-Demo|GitHub Pages|GitHub, Inc|Nick Holzbecher|holzbechernick|ohne Auftrag/i;
  const demoText = (seite: { einleitung?: string; bloecke: Block[] }) => [seite.einleitung ?? "", ...seite.bloecke.map(blockText)].find((t) => DEMO_MERKMALE.test(t));
  const im = demoText(impressum); if (im) offen.push(`Das Impressum beschreibt noch die Demo («${im.match(DEMO_MERKMALE)?.[0]}»): für den Produktivbetrieb neu schreiben (Betreiber, Zweck, Hosting).`);
  const ds = demoText(datenschutz); if (ds) offen.push(`Die Datenschutzerklärung beschreibt noch die Demo («${ds.match(DEMO_MERKMALE)?.[0]}»): an Verantwortliche und produktives Hosting anpassen.`);
  return offen;
}
