import "server-only";
import kanzleiRoh from "@/data/kanzlei.json";
import texteRoh from "@/data/texte.json";
import startseiteRoh from "@/data/startseite.json";
import personenRoh from "@/data/personen.json";
import rechtsgebieteRoh from "@/data/rechtsgebiete.json";
import rechtsgebieteSeiteRoh from "@/data/seiten/rechtsgebiete.json";
import teamSeiteRoh from "@/data/seiten/team.json";
import mitarbeitRoh from "@/data/seiten/mitarbeit.json";
import kontaktSeiteRoh from "@/data/seiten/kontakt.json";
import impressumRoh from "@/data/seiten/impressum.json";
import datenschutzRoh from "@/data/seiten/datenschutz.json";
import enRoh from "@/data/sprachen/en.json";
import frRoh from "@/data/sprachen/fr.json";
import itRoh from "@/data/sprachen/it.json";
import esRoh from "@/data/sprachen/es.json";
import arRoh from "@/data/sprachen/ar.json";
import bilderRoh from "@/data/bilder.json";
import { z } from "zod";
import {
  kanzleiSchema, kontaktSeiteSchema, mitarbeitSeiteSchema, personSchema, pruefen, rechtSeiteSchema, rechtsgebietSchema, rechtsgebieteSeiteSchema,
  sprachseiteSchema, startseiteSchema, teamSeiteSchema, texteSchema,
  type Bild, type Inhaltsquelle, type Person, type Rechtsgebiet, type Sprachseite,
} from "./modell";
import { bloecke, type RohBlock } from "./text";

/**
 * Lokale Inhaltsquelle: liest data/*.json, löst Bildkennungen auf und prüft alles gegen das Domainmodell.
 * Das ist der Inhaltsbestand der GitHub-Pages-Demo. Dieselben Dateien sind die Vorlage für den Import nach Sanity (scripts/seed.mts).
 */
type BildEintrag = { id: string; breite: number; hoehe: number; alt: string; legende: string | null; nachweis: { urheber: string; titel?: string; quelle: string; lizenz: string; bearbeitung?: string }; quellen: Bild["quellen"] };
const bilder = bilderRoh as unknown as Record<string, BildEintrag>;

export function bild(id: string): Bild {
  const b = bilder[id];
  if (!b) throw new Error(`Bild «${id}» fehlt in data/bilder.json (npm run bilder ausführen oder Kennung korrigieren).`);
  return {
    id: b.id, alt: b.alt, breite: b.breite, hoehe: b.hoehe, quellen: b.quellen, legende: b.legende ?? undefined,
    nachweis: { urheber: b.nachweis.urheber, quelle: b.nachweis.quelle, lizenz: b.nachweis.lizenz, titel: b.nachweis.titel, bearbeitung: b.nachweis.bearbeitung },
  };
}

const kanzlei = pruefen(kanzleiSchema, { ...kanzleiRoh, logo: bild(kanzleiRoh.logo), foto: bild(kanzleiRoh.foto), seoBild: bild(kanzleiRoh.seoBild) }, "data/kanzlei.json");
const texte = pruefen(texteSchema, texteRoh, "data/texte.json");
const startseite = pruefen(startseiteSchema, startseiteRoh, "data/startseite.json");
const personen: Person[] = pruefen(z.array(personSchema), personenRoh.map((p) => ({ ...p, portrait: bild(p.portrait), portraitQuadrat: bild(p.portraitQuadrat) })), "data/personen.json").sort((a, b) => a.reihenfolge - b.reihenfolge);
const rechtsgebiete: Rechtsgebiet[] = pruefen(z.array(rechtsgebietSchema), rechtsgebieteRoh, "data/rechtsgebiete.json").sort((a, b) => a.reihenfolge - b.reihenfolge);
for (const [name, liste] of [["data/personen.json", personen], ["data/rechtsgebiete.json", rechtsgebiete]] as const) {
  const slugs = new Set<string>();
  for (const e of liste) {
    if (slugs.has(e.slug)) throw new Error(`${name}: Slug «${e.slug}» kommt doppelt vor.`);
    slugs.add(e.slug);
  }
}
const rechtsgebieteSeite = pruefen(rechtsgebieteSeiteSchema, rechtsgebieteSeiteRoh, "data/seiten/rechtsgebiete.json");
const teamSeite = pruefen(teamSeiteSchema, teamSeiteRoh, "data/seiten/team.json");
const mitarbeit = pruefen(mitarbeitSeiteSchema, mitarbeitRoh, "data/seiten/mitarbeit.json");
const kontaktSeite = pruefen(kontaktSeiteSchema, kontaktSeiteRoh, "data/seiten/kontakt.json");
const impressum = pruefen(rechtSeiteSchema, { ...impressumRoh, bloecke: bloecke(impressumRoh.bloecke as RohBlock[]) }, "data/seiten/impressum.json");
const datenschutz = pruefen(rechtSeiteSchema, { ...datenschutzRoh, bloecke: bloecke(datenschutzRoh.bloecke as RohBlock[]) }, "data/seiten/datenschutz.json");
const sprachseiten: Sprachseite[] = [
  pruefen(sprachseiteSchema, enRoh, "data/sprachen/en.json"),
  pruefen(sprachseiteSchema, frRoh, "data/sprachen/fr.json"),
  pruefen(sprachseiteSchema, arRoh, "data/sprachen/ar.json"),
  pruefen(sprachseiteSchema, itRoh, "data/sprachen/it.json"),
  pruefen(sprachseiteSchema, esRoh, "data/sprachen/es.json"),
];

export const lokaleQuelle: Inhaltsquelle = {
  getKanzlei: async () => kanzlei,
  getTexte: async () => texte,
  getStartseite: async () => startseite,
  getPersonen: async () => personen,
  getPerson: async (slug) => personen.find((p) => p.slug === slug) ?? null,
  getRechtsgebiete: async () => rechtsgebiete,
  getRechtsgebieteSeite: async () => rechtsgebieteSeite,
  getTeamSeite: async () => teamSeite,
  getMitarbeitSeite: async () => mitarbeit,
  getKontaktSeite: async () => kontaktSeite,
  getRechtSeite: async (slug) => (slug === "impressum" ? impressum : datenschutz),
  getSprachseiten: async () => sprachseiten,
  getSprachseite: async (code) => sprachseiten.find((s) => s.sprache === code) ?? null,
  getBildnachweise: async () => {
    const gesehen = new Set<string>();
    return Object.values(bilder)
      .filter((b) => (gesehen.has(b.nachweis.quelle) ? false : (gesehen.add(b.nachweis.quelle), true)))
      .map((b) => ({ titel: b.nachweis.titel ?? b.legende ?? b.alt, urheber: b.nachweis.urheber, quelle: b.nachweis.quelle, lizenz: b.nachweis.lizenz }));
  },
};
