import { belege, bildMitText, fliesstext, herkunft, verweis } from "./objekte";
import { beratungssprache, kanzlei, kontaktSeite, mitarbeitSeite, person, rechtSeite, rechtsgebiet, rechtsgebieteSeite, sprachseite, startseite, stelle, teamSeite, texte } from "./dokumente";

/** Dokumente, die es genau einmal gibt (feste Kennung, kein «Neu anlegen», kein Löschen). */
export const EINZELDOKUMENTE = ["kanzlei", "texte", "startseite", "rechtsgebieteSeite", "teamSeite", "mitarbeitSeite", "kontaktSeite", "rechtSeite"];

export const schemaTypes = [
  // Objekte
  verweis, bildMitText, herkunft, belege, fliesstext,
  // Dokumente
  kanzlei, beratungssprache, person, rechtsgebiet, stelle, sprachseite, startseite, rechtsgebieteSeite, teamSeite, mitarbeitSeite, kontaktSeite, rechtSeite, texte,
];
