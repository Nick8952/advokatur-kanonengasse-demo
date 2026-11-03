# Bilder: Quellen, Rechte, Verarbeitung

## Grundsatz

Die Demo zeigt nur Bilder der bisherigen Website der Kanzlei: die Wortmarke, das Strassenfoto und die elf Portraits. Keine Stockfotos,
keine erzeugten Personen oder Räume, keine Kartenausschnitte, keine Fotos fremder Kanzleien. Herkunft, Prüfsummen und Nutzungsstatus
jeder Datei: `assets/originale/HERKUNFT.md`. Alternativtexte und Bildnachweise: `scripts/bilder-liste.json` (erzeugt `data/bilder.json`).

## Nutzungsstatus (offen)

| Bild | Rechteinhaber laut Quelle | Status |
| --- | --- | --- |
| Wortmarke | Kanzlei (Urheberrechtsvermerk der Datenschutzerklärung) | Nutzung in der Demo mit Zustimmung von Nick Holzbecher zum Download; Freigabe durch die Kanzlei offen |
| Strassenfoto | Fotografin oder Fotograf nicht genannt | wie oben; Ort der Aufnahme von der Kanzlei zu bestätigen (Bildlegende sagt nur «Im Zürcher Kreis 4») |
| 11 Portraits | Fotografin oder Fotograf nicht genannt; Persönlichkeitsrechte der abgebildeten Personen | wie oben; Einverständnis jeder Person für die neue Website einholen |

## Verarbeitung

- `npm run bilder` liest `scripts/bilder-liste.json`, erzeugt AVIF und WebP in mehreren Breiten nach `public/bilder/` und schreibt
  `data/bilder.json`. Es wird nie hochskaliert.
- Portraits gibt es zweimal: im Original-Seitenverhältnis (Profilseite, Breiten 480 bis 960 px) und als Quadrat aus der Bildmitte über die
  volle Höhe (Teamübersicht, 240 bis 720 px). Alle Portraits sind mittig aufgenommen; der Ausschnitt wurde per Kontaktbogen geprüft. Keine Retusche.
- Wortmarke: unverändert (schwarze Platte bleibt Teil des Bildes), 320 bis 1280 px.
- Strassenfoto: ganzes Bild (die bisherige Website zeigte einen Ausschnitt), 640 bis 2000 px.
- Vorschaubild `og` (1200 × 630): Strassenfoto mittig beschnitten, Wortmarke unten links eingesetzt. Montage aus zwei Originalen, kein Text.
- App-Icons (`app/icon.png`, `app/icon.svg`, `app/apple-icon.png`): schwarze Platte mit weissem «a». Platzhalter der Demo; die Kanzlei hat kein eigenes Icon.

## Was fehlt (für den Produktivbetrieb)

- Bestätigung der Rechte für alle Aufnahmen (siehe oben).
- Optional: Aufnahmen der Kanzleiräume (Empfang, Sitzungszimmer) und des Eingangs (1. Stock), falls die Kanzlei sie zeigen will. Die Demo
  behauptet nichts über die Räume und zeigt keine fremden Innenräume.
- Optional: ein eigenes Icon (Favicon) der Kanzlei.
