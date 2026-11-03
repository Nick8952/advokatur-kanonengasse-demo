# Gestaltung «Fensterfront»

## Lesart (Design Read)

Redesign einer bestehenden Website mit Bewahrung der Identität: Bürogemeinschaft von Anwältinnen und Anwälten im Zürcher Kreis 4, die sich für
Menschen mit wenig Ressourcen und mit Migrationshintergrund einsetzt. Leserschaft: Rat suchende Menschen in sechs Sprachen, oft auf dem
Handy, oft unter Druck; dazu Stellensuchende und mögliche Partnerinnen und Partner. Aufgabe der Startseite: in Sekunden sagen, wofür die Kanzlei
da ist, wie und wann man sie erreicht, wer dort arbeitet und wo die eigene Sprache ist. Ton: kompetent und menschlich, nicht Luxuskanzlei.

Stellwerte nach `design-taste-frontend` (v2): Preset «Redesign, bewahrend» plus «trust-first / accessibility-critical»:
**Varianz 3, Bewegung 2, Dichte 4.** Keine Scroll-Inszenierung, keine Bibliotheken für Bewegung, ein Akzent, ein Theme.

## Woher die Gestaltung kommt

Die bisherige Website legte weisse Zellen über das Foto eines Geschäftshauses mit strengem Fensterraster; die Sprachen waren sechs Zellen,
das Team Zellen mit Namen. Das ist die Identität, die bleibt: **das Fenster als einziges Strukturmotiv.** Gleich grosse Zellen mit 1-px-Fugen
tragen die Sprachwahl (3 × 2 wie bisher, jetzt mit ausgeschriebenen Sprachnamen), die Rechtsgebiete (3 × 3) und das Team (quadratische
Portraits). Alles andere ist ruhiger Textfluss mit viel Luft. Keine Karten in Karten, keine Schatten, Radius 0.

Farben sind aus der bisherigen Website abgeleitet (Wix-Theme und gemessene Werte):

| Rolle | Token | Wert | Herkunft |
| --- | --- | --- | --- |
| Putz (Seitengrund) | `--color-putz` | #e9e9e7 | heller Grund der alten Seite (#e6e6e6), leicht wärmer |
| Fenster (Zellen, Felder) | `--color-fenster` | #fbfbfa | weisse Zellen der alten Seite, nicht reinweiss |
| Fenster 2 (Hover, Hinweise) | `--color-fenster-2` | #f1f1ef | |
| Rahmen (Text, Linien, Fokus) | `--color-rahmen` | #182153 | Marineblau der alten Texte (24, 33, 83) |
| Rahmen 2 (Zweittext) | `--color-rahmen-2` | #4b5070 | abgeleitet |
| Grau (Meta, Hilfe) | `--color-grau` | #5f6380 | abgeleitet, 4.8:1 auf Putz |
| Fuge (Hairlines) | `--color-fuge` | #cfd0d6 | |
| Fuge stark (Feldränder) | `--color-fuge-stark` | #7f839c | 3.6:1 auf Fenster |
| Akzent (Handlung) | `--color-akzent` | #eb910c | Orange des Knopfs «Partner:in bei uns werden?» (235, 145, 12) |
| Akzent tief (Hover) | `--color-akzent-tief` | #d27f05 | |
| Platte | `--color-platte` | #000000 | nur innerhalb der Wortmarke (Bilddatei) |

Orange ist nie Schriftfarbe auf Hell (2:1), sondern immer Fläche mit marineblauer Schrift (6.2:1): Telefonknopf, aktive Sprachzelle,
Fenster «Partner:in bei uns werden?», Sprunglink. Das Rot der alten Seite («1. Stock oben an der Treppe», 2.6:1) entfällt. Kontraste rechnet
`node werkzeuge/qa/kontrast.mjs` bei jedem `npm run pruefen`.

## Schrift

Eine Familie mit arabischer Schwester, lokal ausgeliefert (SIL Open Font License, Dateien in `assets/schriften`, Regeln mit `unicode-range`
in `app/globals.css`): **IBM Plex Sans** (variabel, Latin und Latin Extended, aufrecht und kursiv) und **IBM Plex Sans Arabic** (400, 500, 600),
die nur auf `html[lang="ar"]` geladen wird. Gewählt, weil sie als eine der wenigen offenen Grotesken eine abgestimmte arabische
Schwester hat; die alte Website nutzte Barlow und Helvetica Neue Light, die Wortmarke bleibt als Bild erhalten.

Rollen: Titel 500 mit leicht negativer Laufweite (`.titel-1` bis `.titel-3`, `clamp()`), Lauftext 17 px / 1.6, Zweittext 15 px, Bedienung 600.
Zahlen tabellarisch (`font-variant-numeric`). Lesebreite höchstens 64 bis 68 Zeichen. Arabisch mit Zeilenhöhe 1.75 und ohne negative Laufweite.
Keine Serife, keine Versalien-Etiketten («Eyebrows»), keine Gedankenstriche (Prüfung in `inhalt:pruefen` und `export:pruefen`).

## Aufbau

- **Kopfzeile:** links die unveränderte Wortmarke (schwarze Platte, skaliert mit `clamp(10rem, 50vw, 25rem)`), rechts die Sprachwahl als
  `<details>` mit sechs ausgeschriebenen Sprachen (Name in der Sprache plus deutscher Name, keine Flaggen). Kein fixierter Kopf.
- **Register:** alle fünf Hauptseiten in einer Zeile auf jeder Breite, auch bei 360 px (unter 40 rem über die volle Breite, kleinere Schrift).
  Kein Menü-Dialog, kein Hamburger. Die aktuelle Seite trägt eine 3-px-Linie oben und `aria-current`. Auf den Sprachseiten stehen an
  derselben Stelle die vier Abschnitte der Seite.
- **Startseite:** Einstieg mit Telefonzeile, Titel, Satz der Kanzlei, zwei Handlungen (Telefon orange, Kontakt und Anfahrt) neben den sechs
  Sprachfenstern; Strassenfoto; «Die Kanzlei» neben der Erreichbarkeit in drei Spalten (Zeiten, Telefon und E-Mail, Besuchs- und
  Postadresse); Rechtsgebiete als 3 × 3 Fenster mit Personenzahl; Team als Portraitfenster in drei Gruppen; Mitarbeit und Partnerschaft als
  zwei Fenster (eines orange). Sechs Abschnitte, fünf Layoutfamilien, eine Überzeile (Telefonzeiten) auf der ganzen Seite.
- **Team:** Filter nach Rechtsgebiet und Beratungssprache (nur belegte Zuordnungen), drei Gruppen, am Ende der externe Link der bisherigen Website.
- **Profil:** Portrait im Original-Seitenverhältnis links, Angaben rechts als Definitionsliste, Werdegang und Mitgliedschaften im Wortlaut.
- **Rechtsgebiete:** je Gebiet eine Zeile mit Fuge: Titel links, rechts Ansprechpersonen, Bezeichnungen der Profile, Hintergrund aus den Lebensläufen.
- **Kontakt:** Erreichbarkeit gross, Anfahrt mit externen Kartenlinks, Formular «E-Mail vorbereiten» neben dem Hinweis der Kanzlei zu Anfragen.
- **Sprachseiten:** derselbe Einstieg mit Sprachfenstern, dann Rechtsgebiete (übersetzte Namen, Verweis auf Deutsch), Team (Namen, Rollen,
  Sprachen, Telefon), Kontakt mit Formular und Hinweis. Arabisch spiegelt das ganze Raster (`dir="rtl"`, logische CSS-Eigenschaften);
  Telefonnummern, E-Mail-Adressen, Adressen, Namen und deutsche Rollen stehen in `<bdi dir="ltr">`.
- **Fusszeile:** Kontakt mit Telefonzeiten, Seiten, Sprachen, Impressum/Datenschutz/Bildnachweis/Datenschutz-Einstellungen, Entwurfshinweis.

Umschaltpunkte: 30 rem (Sprachfenster 2 → 3 Spalten, Gebiete 1 → 2), 40 rem (Register, Fusszeile, Formular zweispaltig, Team 3 Spalten),
48 rem (Erreichbarkeit dreispaltig), 52 rem (Gebiete 3 Spalten), 56 rem (Profil zweispaltig, Gebietszeilen), 64 rem (Einstieg zweispaltig, Team 4 Spalten).

## Bewegung und Zustände

Bewegung nur als Rückmeldung: Hintergrund- und Farbwechsel 140 bis 180 ms mit eigener Kurve (`--ease-aus`), Klappen der Sprachwahl,
`:active` leicht verkleinert. Keine Einblendungen beim Scrollen, keine Scrollführung, keine Endlosschleifen. Unter `prefers-reduced-motion`
sind alle Übergänge aus und `scroll-behavior: auto`. Fokus: 3 px Marineblau mit Abstand, in Fenstern nach innen. Zustände: Hover (Fenster 2),
aktiv (Linie oben, orange Sprachzelle, gedrückter Filter in Marineblau), Fehler (rote Meldung am Feld mit `role="alert"`), leer (Hinweis statt
leerer Fläche im Filter), Hinweis (linke 3-px-Linie). Touch-Ziele mindestens 44 px (Audit misst alle Links und Knöpfe in fünf Breiten).

## Was bewusst nicht gemacht wurde

- Kein dunkles Theme (eine Seite, ein Theme; `color-scheme: light`, damit Formularfelder nicht vom Browser invertiert werden).
- Keine Icons ausser zwei Phosphor-Glyphen im Formular; keine Richterhämmer, Waagen, Händedrücke, Siegel, Kennzahlen.
- Keine Scroll-Effekte, keine Bento-Inszenierung, keine Versalien-Etiketten, keine Gedankenstriche, keine Emojis.
- Keine Karteneinbettung, keine Schriften von fremden Servern, keine Cookies.

## Abgrenzung zu früheren Demos

Technischer Ausgangspunkt war `../rechtsanwalt-bessler-demo` (Unterpfad-Logik, Export-Prüfung, Vorschau-Server, QA-Gerüst, Einwilligung,
Sanity-Muster «statisch + Rebuild bei Publish»). Gestaltung, Aufbau und Komponenten sind neu: dort ein Leporello aus senkrechten Streifen mit
Serife, Papier und Grün für einen einzelnen Anwalt; hier ein Fensterraster in Marineblau und Orange für eine Bürogemeinschaft mit sechs
Sprachen, Register in einer Zeile, Sprachfenster, Portraitraster, Filter, Sprachseiten mit RTL.
