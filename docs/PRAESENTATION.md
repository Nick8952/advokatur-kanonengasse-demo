# Präsentationshilfe für das Kundengespräch

Kurz, ehrlich, ohne Versprechen zu Rankings, Umsatz oder Mandaten. Alles unten ist umgesetzt und geprüft (Belege in `docs/PRUEFBERICHT.md`).

## In einem Satz

Eine neue Website der advokatur kanonengasse, die dieselben Inhalte wie heute in klarer Ordnung zeigt, auf dem Handy in einer Zeile
navigierbar ist, in sechs Sprachen funktioniert (Arabisch von rechts nach links) und ohne Cookies, Tracker oder fremde Dienste auskommt.

## Was anders ist als heute (und warum es den Besucherinnen und Besuchern hilft)

1. **Telefonzeiten und Terminregel stehen auf jeder Seite** (Einstieg, Erreichbarkeit, Fusszeile), mit Telefon und E-Mail als direktem Link.
   Heute stehen sie nur auf Start- und Kontaktseite, auf der Startseite ohne Wochentage.
2. **Besuchsadresse und Postadresse sind getrennt** (Militärstrasse 76, 8004 Zürich, 1. Stock; Postfach 1012, 8021 Zürich). Heute steht
   beides vermischt unter 8021.
3. **Sechs Sprachen mit ausgeschriebenen Namen** in der Kopfzeile, im Menü und als Pillen im Einstieg (dazu die Willkommensworte als Laufband), wie das bisherige Raster, aber
   mit Deutsch-Namen und ohne Flaggen. Die arabische Seite läuft komplett von rechts nach links, mit arabischer Schrift und korrekt
   lesbaren Telefonnummern. Jede Sprachseite enthält Einführung, Erreichbarkeit, Rechtsgebiete, Team und das Kontaktformular.
4. **Rechtsgebiete als eigene Seite**: neun Gebiete, davon vier Schwerpunkte, je mit Ansprechpersonen, den Bezeichnungen aus den Profilen
   und dem belegten Hintergrund aus den Lebensläufen. Heute sind die Gebiete nur in den einzelnen Profilen zu finden.
5. **Team mit Filter** nach Rechtsgebiet und Beratungssprache (nur Zuordnungen aus den Profilen), drei Gruppen wie heute, Portraits in
   gleich grossen Fenstern; Profile mit Werdegang, Mitgliedschaften, direkter Nummer und, wo belegt, E-Mail.
6. **Mitarbeit und Partnerschaft** auf einer Seite mit sichtbarem Stand der Angaben; im CMS später mit Status (Entwurf, veröffentlicht,
   archiviert) und Datumsfenster.
7. **Kontaktformular ohne Server**: Es bereitet eine E-Mail im Programm der Besucherin vor; nichts wird gespeichert oder an Dritte gesendet.
   Der bisherige Hinweis zu Anfragen (24 Stunden) steht neben dem Formular, nicht als Bestätigung.
8. **Kein Cookie-Banner, weil es nichts zu bannern gibt**: keine Cookies, keine Analyse, keine eingebettete Karte (Karten als externe Links),
   Schriften und Bilder vom eigenen Server. Die Datenschutzerklärung beschreibt genau das. Eine Einwilligungslösung ist vorbereitet, falls
   später ein Dienst dazukommt.
9. **Bedienbar für alle**: Hauptnavigation im Kopf, unterwegs ein Menü mit grossen Einträgen, Touch-Ziele mindestens 44 px, Kontraste gemessen (Text 12:1, Akzent 6:1),
   sichtbarer Tastaturfokus, Sprunglink, Formular mit Beschriftungen und verständlichen Fehlermeldungen, Bewegung nur als Rückmeldung
   (abschaltbar über die Systemeinstellung).
10. **Schnell und leicht**: statische Seiten, Bilder vorgerendert (AVIF/WebP, alle Varianten zusammen rund 2.2 MB), kein Baukasten-Code,
    keine Anfragen an fremde Server. Lighthouse-Werte der Live-Demo: siehe `docs/PRUEFBERICHT.md` (Testumgebung dort genannt).
11. **Alte Adressen bleiben erreichbar**: 18 Weiterleitungen (Profile, Sprachseiten, Stellen, Partnerschaft), die übrigen Adressen sind gleich geblieben.
12. **Erscheinungsbild weitergeführt, nicht ersetzt**: Wortmarke, Strassenfoto, Portraits, Marineblau und Orange der heutigen Seite;
    neu dazu eine bewegte Struktur («Durchgang»): Foto in voller Höhe, das beim Scrollen langsamer läuft, ein Kopf, der sich festsetzt,
    die sechs Willkommensworte der alten Startseite als Laufband, Rechtsgebiete als Karten, die vorbeifahren, Abschnitte, die auftauchen.
    Alles auch ohne Bewegung (Systemeinstellung) und ohne JavaScript vollständig lesbar. Kein Richterhammer, keine Justitia, keine Siegel, keine Kennzahlen.
13. **Pflege ohne Agentur**: Sanity-CMS vorbereitet (Studio mit deutschen Feldern, Validierung, Vorschauen), Redaktionsanleitung für Team,
    Sprachen, Kontakt und Stellen. Veröffentlichen löst automatisch einen neuen Build aus. Hosting auf Vercel vorbereitet.

## Was die Kanzlei beiträgt

- Freigabe der Texte und Übersetzungen, Bestätigung der Bildrechte, Angaben fürs Impressum (Liste: `docs/UEBERGABE.md`).
- Entscheidung über Domainwechsel und Zeitpunkt; die bisherige Website bleibt bis dahin unverändert.

## Was nicht versprochen wird

- Keine Aussagen zu Google-Positionen, Besucherzahlen, Anfragen oder Umsatz.
- Keine Garantie für Rechtssicherheit der Rechtstexte: Impressum und Datenschutzerklärung sind Entwürfe, die die Kanzlei prüft.

## Demo-Adresse

GitHub Pages: siehe README (noindex, als Entwurf gekennzeichnet). Später Vercel und Kanzleidomain.
