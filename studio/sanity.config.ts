import { defineConfig } from "sanity";
import { structureTool, type StructureBuilder } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { deDELocale } from "@sanity/locale-de-de";
import { schemaTypes, EINZELDOKUMENTE } from "./schemas";
import { dataset, projectId } from "./env";

/**
 * Studio der Website der advokatur kanonengasse. Die Seitenleiste folgt dem, was am häufigsten gepflegt wird: Team, Stellen,
 * Kanzlei und Kontakt, Rechtsgebiete, Sprachfassungen, dann Seiten und Rechtstexte. Einzeldokumente lassen sich weder doppelt
 * anlegen noch löschen.
 */
const einzel = (S: StructureBuilder, typ: string, titel: string, id = typ) => S.listItem().title(titel).id(id).child(S.document().schemaType(typ).documentId(id).title(titel));

export default defineConfig({
  name: "advokatur-kanonengasse",
  title: "advokatur kanonengasse",
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Inhalte")
          .items([
            S.documentTypeListItem("person").title("Team (Profile)"),
            S.documentTypeListItem("stelle").title("Offene Stellen"),
            einzel(S, "mitarbeitSeite", "Mitarbeit und Partnerschaft (Seite)"),
            S.divider(),
            einzel(S, "kanzlei", "Kanzlei, Adressen, Telefonzeiten"),
            S.documentTypeListItem("rechtsgebiet").title("Rechtsgebiete"),
            S.documentTypeListItem("beratungssprache").title("Beratungssprachen"),
            S.documentTypeListItem("sprachseite").title("Sprachfassungen (EN, FR, IT, ES, AR)"),
            S.divider(),
            S.listItem().title("Seiten").child(
              S.list().title("Seiten").items([
                einzel(S, "startseite", "Startseite"),
                einzel(S, "rechtsgebieteSeite", "Rechtsgebiete (Übersichtsseite)"),
                einzel(S, "teamSeite", "Team (Übersichtsseite, Filter, Profilbeschriftungen)"),
                einzel(S, "kontaktSeite", "Kontakt und Anfahrt"),
                einzel(S, "rechtSeite", "Impressum", "rechtSeite-impressum"),
                einzel(S, "rechtSeite", "Datenschutzerklärung", "rechtSeite-datenschutz"),
              ]),
            ),
            S.divider(),
            einzel(S, "texte", "Navigation, Fusszeile, Formular, Sprachen"),
          ]),
    }),
    visionTool({ defaultApiVersion: "2025-02-19" }),
    deDELocale(),
  ],
  schema: {
    types: schemaTypes,
    templates: (vorlagen) => vorlagen.filter((v) => !EINZELDOKUMENTE.includes(v.schemaType)),
  },
  document: {
    actions: (aktionen, kontext) => (EINZELDOKUMENTE.includes(kontext.schemaType) ? aktionen.filter((a) => a.action && ["publish", "discardChanges", "restore"].includes(a.action)) : aktionen),
  },
});
