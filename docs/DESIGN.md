# Gestaltung «Durchgang»

Zweite Gestaltung der Demo (3.11.2026). Die erste («Fensterfront»: gleich grosse Zellen mit 1-px-Fugen, Register in einer Zeile, kein
fixierter Kopf, keine Scroll-Bewegung) wurde auf Wunsch des Auftraggebers durch eine andere, bewegtere Struktur ersetzt. Inhalte, Daten,
Mehrsprachigkeit, Formular, Prüfungen und die Farbwelt sind geblieben; Aufbau, Komponenten und Bewegung sind neu.

## Lesart (Design Read)

Bürogemeinschaft von Anwältinnen und Anwälten im Zürcher Kreis 4, die sich für Menschen mit wenig Ressourcen und mit Migrationshintergrund
einsetzt. Leserschaft: Rat suchende Menschen in sechs Sprachen, oft auf dem Handy, oft unter Druck; dazu Stellensuchende und mögliche
Partnerinnen und Partner. Aufgabe der Startseite: in Sekunden sagen, wofür die Kanzlei da ist, wie und wann man sie erreicht, wer dort
arbeitet und wo die eigene Sprache ist. Ton: kompetent und menschlich, nicht Luxuskanzlei.

Stellwerte nach `design-taste-frontend` (v2): Preset «Redesign» plus «trust-first / accessibility-critical», jetzt mit **Varianz 4,
Bewegung 4, Dichte 3.** Bewegung ohne Bibliothek (kein GSAP, kein Lenis, kein framer-motion): CSS-Keyframes, scroll-getriebene Animationen
des Browsers (`animation-timeline`), ein IntersectionObserver. Jede Bewegung endet unter `prefers-reduced-motion: reduce` vollständig;
ohne JavaScript ist alles sichtbar und bedienbar.

## Woher die Gestaltung kommt

Die Kanonengasse ist eine Gasse im Kreis 4; die Website ist ein **Durchgang**, den man abschreitet: Der Kopf schwebt über dem Strassenfoto
und setzt sich beim Scrollen fest, das Foto füllt den ersten Bildschirm und scrollt langsamer als der Text, ein Laufband trägt die sechs
Willkommensworte der bisherigen Startseite («Willkommen · welcome · bienvenue · مرحبا · benvenuti · bienvenidos»), die Rechtsgebiete
fahren als Karten vorbei (gross: horizontal gepinnt; sonst gestapelt), jeder Abschnitt trägt eine Nummer und einen orangenen Strich, der sich
beim Erscheinen aufzieht. Die Wortmarke bleibt als schwarze Platte, die Farben bleiben die der alten Website.

| Rolle | Token | Wert | Herkunft |
| --- | --- | --- | --- |
| Putz (Seitengrund) | `--color-putz` | #e9e9e7 | heller Grund der alten Seite (#e6e6e6), leicht wärmer |
| Putz 2 (Zweittext auf Marineblau) | `--color-putz-2` | #b4b6c4 | abgeleitet, 7.5:1 auf Marineblau |
| Fenster (Karten, Felder, Seitenköpfe) | `--color-fenster` | #fbfbfa | weisse Zellen der alten Seite, nicht reinweiss |
| Fenster 2 (Hover, Bildgrund) | `--color-fenster-2` | #f1f1ef | |
| Rahmen (Text, Linien, dunkle Bänder) | `--color-rahmen` | #182153 | Marineblau der alten Texte (24, 33, 83) |
| Rahmen 2 (Zweittext, Nummern) | `--color-rahmen-2` | #4b5070 | abgeleitet |
| Grau (Meta, Hilfe) | `--color-grau` | #5f6380 | abgeleitet, 4.8:1 auf Putz |
| Fuge (Hairlines, Kartenränder) | `--color-fuge` | #cfd0d6 | |
| Fuge stark (Feldränder, Chips) | `--color-fuge-stark` | #7f839c | 3.6:1 auf Fenster |
| Akzent (Handlung, Strich, Marke) | `--color-akzent` | #eb910c | Orange des Knopfs «Partner:in bei uns werden?» (235, 145, 12) |
| Akzent tief (Hover) | `--color-akzent-tief` | #d27f05 | |
| Platte | `--color-platte` | #000000 | nur innerhalb der Wortmarke (Bilddatei) |

Orange ist auf Hell nie Schriftfarbe (2:1), sondern Fläche mit marineblauer Schrift (6.2:1): Telefonknopf, aktive Sprachpille, Tafel
«Partner:in bei uns werden?», Marke «Schwerpunkt», Sprunglink. Auf Marineblau darf Orange Linie und Schrift sein (6.2:1): Strich, aktueller
Menüeintrag, Lesebalken, Fortschritt der Schiene. Die dunklen Bänder (Bühne, Fusszeile, Menü, Schwerpunktkarten) tragen Putz als Schrift
(12.5:1) und Putz 2 als Zweittext (7.5:1). 20 Farbpaare rechnet `node werkzeuge/qa/kontrast.mjs` bei jedem `npm run pruefen`.

Radius: 0.75 rem für Karten, Tafeln, Felder (0.5 rem) und Bilder; Pillen (999 px) für Knöpfe, Sprachen, Chips und Filter. Bewusste Abkehr vom
Radius 0 der ersten Gestaltung: weicher, näher an den Menschen, die die Kanzlei anspricht.

## Schrift

Eine Familie mit arabischer Schwester, lokal ausgeliefert (SIL Open Font License, Dateien in `assets/schriften`, Regeln mit `unicode-range`
in `app/globals.css`): **IBM Plex Sans** (variabel, Latin und Latin Extended, aufrecht und kursiv) und **IBM Plex Sans Arabic** (400, 500, 600),
die nur auf `html[lang="ar"]` geladen wird. Die alte Website nutzte Barlow und Helvetica Neue Light; die Wortmarke bleibt als Bild erhalten.

Rollen: `.titel-riesig` (Bühne, Seitenköpfe) bis 5.75 rem mit Laufweite −0.035 em und Zeilenhöhe 0.98; `.titel-1` (Profilname) bis 4.25 rem;
`.titel-2` (Abschnitte) bis 2.9 rem; `.titel-3`, `.titel-4`; Abschnittsnummern und Kartennummern in Gewicht 300 (`.index`, `.karte-index`);
Lauftext 17 px / 1.6, grosse Absätze der Kanzlei bis 1.5 rem / 1.45; Zweittext 15 px; Bedienung 600. Etiketten (`.etikett`) sind kleine Wörter
mit orangenem Quadrat, keine Versalien. Zahlen tabellarisch. Arabisch ohne negative Laufweite und mit Zeilenhöhe 1.3 (Titel) bzw. 1.75 (Text).

## Aufbau

- **Kopf** (`.kopf`, `position: sticky`): Wortmarke links (144 bis 256 px), ab 64 rem die fünf Hauptseiten inline (`.hauptnav`, aktuelle
  Seite mit orangener Linie und `aria-current`) und rechts die Sprachwahl (`<details>`, sechs ausgeschriebene Sprachen, keine Flaggen).
  Unter 64 rem: Wortmarke und ein Knopf «Menü», der ein natives `<dialog>` bildschirmfüllend über `showModal()` öffnet (Hauptseiten gross
  mit Pfeil, Sprachen als Pillen, Telefon und E-Mail; Escape, Knopf und Linkklick schliessen; Fokus kehrt zum Knopf zurück). Über der Bühne
  ist der Kopf durchsichtig mit heller Schrift; nach zehn rem Scrollweg ist er zu 90 % deckend mit Weichzeichner und dunkler Schrift
  (scroll-getriebene Animation `kopf-fest`; ohne Unterstützung oder mit reduzierter Bewegung immer deckend).
- **Bühne** (`.buehne`, Start und Sprachseiten): volle Fensterhöhe, das Strassenfoto als `<picture>` mit AVIF/WebP und hoher Ladepriorität
  (LCP), darüber ein marineblauer Verlauf; unten Etikett, Titel, Satz der Kanzlei, Knöpfe (Telefon orange, Kontakt), Fakten (Telefonzeiten,
  Adresse) und die sechs Sprachen als Pillen. Elemente tauchen beim Laden gestaffelt auf (Keyframes). Ab 48 rem Parallaxe: das Bild wächst
  und wandert über die erste Fensterhöhe um 6 % nach unten (`animation-timeline: scroll(root)`). Rechts unten eine feine Linie mit
  rieselndem Lichtpunkt als Scroll-Hinweis (nur gross, nur mit Bewegung).
- **Laufband** (`.laufband`, `components/Laufband.tsx`): die sechs Willkommensworte mit orangenen Punkten, 44 s je Umlauf, in Arabisch nach
  rechts; die Wörter sind dekorativ (`aria-hidden`), weil die Sprachen daneben als Links stehen. Es hält bei Mausberührung, ausserhalb des
  Fensters und über den Knopf «Laufband anhalten» / «Laufband fortsetzen» an (in allen sechs Sprachen). Bei reduzierter Bewegung steht es,
  bricht um, und der Knopf entfällt.
- **Abschnitte mit Nummer:** `01 Die Kanzlei` (klebender Titel links, grosse Absätze rechts, darunter die Erreichbarkeit als drei Karten),
  `02 Rechtsgebiete` (Schiene), `03 Team` (Portraitraster 2/3/4 Spalten mit Bildzoom im Hover, drei Gruppen mit Zähler), `04 Mitarbeit und
  Partnerschaft` (zwei Tafeln, eine orange, mit Hover-Lift). Jeder Abschnittskopf trägt den Strich, der sich beim Erscheinen aufzieht.
- **Schiene** (`.schiene`, `components/Schiene.tsx`): Grundversion gestapelte Karten, die beim Scrollen nacheinander oben kleben
  (`position: sticky` mit wachsendem Versatz, reines CSS); ab 64 rem ohne Fahrt drei Spalten. Erweiterung ab 64 rem mit erlaubter Bewegung,
  Skript, `view-timeline`-Unterstützung und Leserichtung links nach rechts: der Abschnitt wird so hoch wie die Spur breit ist, der innere
  Bereich klebt eine Fensterhöhe lang, die Spur fährt horizontal; ein Balken zeigt den Fortschritt. Das Skript misst nur den Überhang
  (`--ueberhang`) und scrollt bei Tastaturfokus auf eine Karte das Fenster, bis sie sichtbar ist; die Fahrt selbst rechnet der Browser über
  eine registrierte `@property --p` (`animation-range: contain 0% contain 100%`, `view-timeline-inset: 0`, weil die Timeline sonst das
  `scroll-padding` der Seite übernimmt). Hüllen getrennt: Höhe und Timeline › sticky (animiert nur `--p`) › Clip › Transform. Karten:
  Nummer, Marke «Schwerpunkt», Titel als Link (ganze Karte klickbar), Zusatz, Personenzahl, Pfeil; Schwerpunkte marineblau.
- **Seitenkopf der Unterseiten** (`.seitenkopf`): weisses Band mit Etikett (Kurzbeschreibung der Kanzlei oder Gruppe), sehr grossem Titel,
  Strich (zieht sich beim Laden auf), Vorspann und einer Zeile für Sprungmarken oder Knöpfe.
- **Rechtsgebiete:** links ein klebender Index mit Scrollspy (`components/Scrollspy.tsx`: Messlinie bei einem Viertel der Fensterhöhe,
  `aria-current="true"` auf genau einem Eintrag, Personenzahl je Gebiet), unter 64 rem als klebende Chip-Reihe, die den aktuellen Chip
  nachführt; rechts je Gebiet eine Zeile mit Ansprechpersonen, Bezeichnungen der Profile und Hintergrund aus den Lebensläufen.
- **Team:** Filter als Pillen (nur belegte Zuordnungen) und das Portraitraster; **Profil:** linke Spalte klebend (Portrait, Sprachen, Telefon,
  E-Mail), rechts Gruppe, Name, Rolle, Rechtsgebiete, Werdegang, Mitgliedschaften; oben ein 3-px-Lesebalken (scroll-getrieben).
- **Mitarbeit:** Sprungmarken im Seitenkopf, zwei Abschnitte mit klebendem Titel links; **Kontakt:** Erreichbarkeit als drei Karten, Anfahrt
  mit externen Kartenlinks, Formular «E-Mail vorbereiten» neben dem klebenden Hinweis der Kanzlei zu Anfragen.
- **Sprachseiten:** dieselbe Struktur wie die Startseite (Bühne mit Einführung im Wortlaut, Laufband, 01 Rechtsgebiete als Schiene mit
  übersetzten Namen und «nur auf Deutsch», 02 Team als Karten mit Namen, Rollen, Sprachen, Telefon, 03 Kontakt). Arabisch spiegelt alles
  (`dir="rtl"`, logische Eigenschaften, Pfeile gespiegelt, Laufband nach rechts, Schiene ohne Fahrt); Telefonnummern, E-Mail-Adressen,
  Adressen, Namen und deutsche Rollen in `<bdi dir="ltr">`.
- **Fusszeile:** marineblaues Band: Telefonnummer sehr gross, E-Mail, Telefonzeiten, Besuchs- und Postadresse getrennt; darunter Seiten,
  Sprachen, Rechtliches; zuletzt Copyright und Entwurfshinweis.

Umschaltpunkte: 40 rem (Team 3 Spalten, Formular zweispaltig, Fusszeile zweispaltig), 48 rem (Erreichbarkeit dreispaltig, Tafeln, Parallaxe),
56 rem (Zweispaltig mit klebender Spalte, Profil, Gebietszeilen, Fusszeile oben zweispaltig), 64 rem (Hauptnavigation inline, Index als
Spalte, Team 4 Spalten, Schiene gepinnt oder dreispaltig).

## Bewegung und Zustände

| Bewegung | Technik | Ohne Bewegung (`prefers-reduced-motion: reduce`) | Ohne JavaScript |
| --- | --- | --- | --- |
| Kopf setzt sich fest | `animation-timeline: scroll(root)`, 0 bis 10 rem; Farbe und Linie interpoliert, Weichzeichner in einem Schritt am Ende (`steps(1, end)`) | immer deckend | läuft (CSS) |
| Auftauchen in Bühne und Seitenkopf | Keyframes, gestaffelt 100 ms | keine Animation, sofort sichtbar | läuft (CSS) |
| Parallaxe des Fotos | `scroll(root)`, 0 bis 100 vh, ab 48 rem | steht | läuft (CSS) |
| Laufband | Keyframes 44 s; Pause bei Hover, ausserhalb des Fensters und per Knopf «Laufband anhalten» (WCAG 2.2.2) | steht, bricht um, ohne Doppel, ohne Knopf | läuft (CSS), Knopf ohne Wirkung |
| Enthüllung beim Scrollen (`[data-reveal]`) | IntersectionObserver; `html.bewegung-bereit` erst nach Start; Elemente im Fenster sofort sichtbar | nichts versteckt, keine Übergänge | nichts versteckt |
| Strich zieht sich auf | Übergang 1 s, 200 ms verzögert | sofort voll | sofort voll |
| Schiene: Fahrt | `view-timeline` + `@property --p`, Überhang per ResizeObserver | gestapelte Karten (klein) / drei Spalten (gross) | gestapelte Karten / drei Spalten |
| Schiene: Karten kleben gestapelt | `position: sticky` mit `--i`-Versatz | statisch | läuft (CSS) |
| Lesebalken (Profil) | `scroll(root)`, `scaleX` | unsichtbar | läuft (CSS) |
| Scrollspy | IntersectionObserver, `aria-current` | läuft (keine Bewegung) | gewöhnliche Sprungmarken |
| Menü | `showModal()`, Keyframe 320 ms | ohne Animation | kein Menü (Hauptseiten in der Fusszeile) |
| Hover: Bildzoom, Lift, Pfeil, Unterstreichung | Übergänge 200 bis 900 ms | aus | – |

Fokus: 3 px Marineblau mit Abstand (auch um die marineblauen Schwerpunktkarten, weil der Ring auf dem hellen Grund liegt), auf dunklen
Flächen (Bühne, Menü, Fusszeile) Putz; bei Karten und Kacheln liegt der Ring um die ganze Karte. Zustände: aktuell
(orangene Linie im Kopf, orange Pille, orangener Menüeintrag, gedrückter Filter in Marineblau, Index-Eintrag mit orangener Kante), Fehler (rote
Meldung am Feld mit `role="alert"`), leer (Hinweis statt leerer Fläche im Filter), Hinweis (linke orangene 3-px-Linie). Touch-Ziele mindestens
44 px (Audit misst alle Links und Knöpfe in fünf Breiten, zusätzlich Menü, Pillen, Chips, Kacheln).

Druck: Kopf, Menü, Laufband, Lesebalken und Index entfallen; Enthüllungen und Striche sind voll sichtbar; eine gepinnte Schiene wird zum
zweispaltigen Raster.

## Was bewusst nicht gemacht wurde

- Keine Bewegungsbibliothek, kein Smooth-Scroll-Hijacking, keine Cursor-Effekte, keine Zähler, keine Kennzahlen, keine Countdowns, keine Pop-ups.
- Keine Richterhämmer, Waagen, Händedrücke, Siegel; keine KI-Bilder, keine Stockfotos; Icons nur als Pfeil, Menü, Schliessen (Inline-SVG).
- Keine Fahrt in Arabisch (vertikale Grundversion, bis die horizontale Bewegung für RTL eigens geprüft ist), keine Parallaxe unter 48 rem,
  kein Lesebalken auf kurzen Seiten, kein Scrollspy bei zwei Abschnitten (Mitarbeit hat Sprungmarken im Seitenkopf).
- Kein dunkles Theme (`color-scheme: light`), keine Karteneinbettung, keine Schriften von fremden Servern, keine Cookies, kein Inline-Skript
  (`@media (scripting: enabled)` wurde geprüft und verworfen: Grundzustand sichtbar ist robuster).

## Abgrenzung zu früheren Demos

Technischer Ausgangspunkt war `../rechtsanwalt-bessler-demo` (Unterpfad-Logik, Export-Prüfung, Vorschau-Server, QA-Gerüst, Einwilligung,
Sanity-Muster «statisch + Rebuild bei Publish»). Gestaltung, Aufbau und Komponenten sind neu: dort ein Leporello aus senkrechten Streifen mit
Serife, Papier und Grün für einen einzelnen Anwalt; hier ein Durchgang in Marineblau und Orange für eine Bürogemeinschaft mit sechs Sprachen:
schwebender Kopf, Bühne mit Parallaxe, Laufband, Schiene, nummerierte Abschnitte, Scrollspy, Portraitraster, Filter, Sprachseiten mit RTL.
