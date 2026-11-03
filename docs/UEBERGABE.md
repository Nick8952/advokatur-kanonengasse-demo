# Übergabe: offene Angaben und Freigaben für den Produktivbetrieb

Die Demo zeigt nur, was die bisherige Website www.kanonengasse.ch (abgerufen 2. November 2026) oder amtliche Quellen belegen. Vor dem
Produktivbetrieb klärt die Kanzlei die folgenden Punkte; `npm run inhalt:pruefen -- --live` listet die technischen Freigaben, der Build mit
`INDEXIERUNG=1` bricht ab, solange etwas offen ist.

## A. Freigaben durch die Kanzlei (Pflicht vor Go-Live)

| Nr. | Punkt | Wo in der Demo | Was zu tun ist |
| --- | --- | --- | --- |
| 1 | **Bildrechte**: Wortmarke, Strassenfoto, 11 Portraits. Fotografin oder Fotograf unbekannt; Einverständnis jeder abgebildeten Person für die neue Website | alle Seiten | Rechte bestätigen oder Bilder ersetzen (`docs/BILDER.md`, `assets/originale/HERKUNFT.md`) |
| 2 | **Impressum der Kanzlei**: Betreiberin, Rechtsform (Bürogemeinschaft; die Datenschutzerklärung nennt «einfache Gesellschaft»; Zefix führt eine «Kanonengasse Kanzlei GmbH», CHE-493.028.695, als Dienstleistungspartnerin), UID, Aufsichtsbehörde, Berufsverbände | `/impressum/` | Angaben liefern; die Demo nennt nichts davon, weil nicht belegt |
| 3 | **Datenschutzerklärung**: Verantwortliche und Rechtsform (die bisherige Erklärung nennt die Kanzlei «einfache Gesellschaft»; die Demo lässt diese Bezeichnung weg, bis die Kanzlei sie bestätigt), Dienstleister (Kanonengasse Kanzlei GmbH, Care4IT GmbH, All Consulting AG mit Abacus und Plato) noch aktuell?, Hinweis zur unverschlüsselten E-Mail, Abschnitt Website nach Umzug auf Vercel anpassen | `/datenschutz/` | Text prüfen und freigeben; nach Go-Live Hosting-Abschnitt auf Vercel umschreiben |
| 4 | **Hinweis zu Anfragen (24 Stunden)**: Platzierung neben dem Formular und Wortlaut; Zusatz «Eine Anfrage begründet noch kein Mandat …» ist ein Vorschlag der Demo | `/kontakt/`, Sprachseiten | Platzierung und Wortlaut bestätigen; Zusatz freigeben oder streichen |
| 5 | **Übersetzungen**: Beschriftungen und Formulartexte in EN, FR, IT, ES, AR; Namen der Rechtsgebiete in fünf Sprachen; Hinweis zu Anfragen in FR, IT, ES, AR (EN stammt von der Quelle); arabische Einführung mit korrigierten Schreibfehlern | `/en/` … `/ar/` | von Muttersprachlern prüfen; Status in `data/rechtsgebiete.json` (`uebersetzungen.*.status`) und `data/sprachen/*.json` (`kapazitaetshinweis.status`) auf «freigegeben» bzw. «quelle» setzen |
| 6 | **Spanische Einführung**: «encontrando la solución más eficaz a su problema» ist ein Versprechen der Quelle | `/es/` | bestätigen oder entschärfen |
| 7 | **Rechtsgebiete**: Taxonomie mit neun Gebieten, vier Schwerpunkte (Partnerschaftsseite), Gruppierung «Grund- und Menschenrechte», «Gutachten zur islamischen und arabischen Rechtsordnung» als Tätigkeitsgebiet | `/rechtsgebiete/`, Filter | Zuordnung je Person bestätigen (`docs/INHALTSMATRIX.md`, Abschnitt 3) |
| 8 | **Team**: Gruppenbezeichnung «Partnerinnen und Partner, Rechtsanwältinnen und Rechtsanwälte» (Wortlaut der alten Seite), Einleitung «Sieben Rechtsanwältinnen und Rechtsanwälte, ein Partner mit Lizentiat und LL. M.», Hinweis zum Anwaltsregister bei Tarig Hassan (Wortlaut des Profils), vollständiges Geburtsdatum bei Christian Müller | `/team/`, Profile | bestätigen; Geburtsdatum kürzen? |
| 9 | **Bernhard Jüsi**: Auf der alten Teamseite als Zelle mit externem Link (juesi.ch). Gehört er zur Bürogemeinschaft? | `/team/` («Ebenfalls verlinkt») | bestätigen; dann Profil oder Link entfernen |
| 10 | **Partnerschaft**: «ab Januar 2026», «ab Januar 2026 ein ganzes Büro frei» | `/mitarbeit/#partnerschaft` | Aktualität bestätigen; sonst Text oder Status «archiviert» |
| 11 | **Offene Stelle** «Anwaltspraktikum / Substitut»: ohne Datum in der Quelle | `/mitarbeit/#offene-stellen` | Aktualität und Datum bestätigen |

## B. Angaben, die die Demo bewusst nicht enthält (nur mit Bestätigung ergänzen)

| Nr. | Angabe | Stand |
| --- | --- | --- |
| 12 | Telefonzeiten am Freitag; Erreichbarkeit per E-Mail ausserhalb der Zeiten | Quelle nennt nur Montag bis Donnerstag (Kontaktseite); die Startseite nennt keine Tage |
| 13 | Postleitzahl des Büros | amtlich 8004 (geo.admin.ch); die alte Website schrieb überall 8021 (Postfach). Bitte bestätigen |
| 14 | Direkte E-Mail-Adressen aller Personen | belegt nur ebnoether@, schiller@, zuesli@, berdin@ und kanzlei@; auf «Offene Stellen» zusätzlich patricia.berdin@ (nicht übernommen) |
| 15 | Telefon Leonie Röthlisberger +41 44 244 51 60 | liegt ausserhalb der Kanzleinummern 043 322 12 xx; übernommen wie in der Quelle, bitte prüfen |
| 16 | Barrierefreiheit, Lift, Parkplätze | nicht belegt, nicht behauptet; «1. Stock, oben an der Treppe» stammt von der Quelle |
| 17 | Aufnahmen der Kanzleiräume, eigenes Icon (Favicon) | fehlen; Demo nutzt die schwarze Platte mit «a» als Platzhalter |
| 18 | Analyse- oder Statistikdienste, eingebettete Karten | nicht eingebaut. Falls gewünscht: Einwilligungskategorie eintragen (`texte.einwilligung.kategorien`), Datenschutzerklärung anpassen, Dienst erst nach `erlaubt(kennung)` laden |
| 19 | Ort des Strassenfotos | Bildlegende sagt nur «Im Zürcher Kreis 4»; die alte Website zeigte das Foto ohne Legende |

## C. Betreiber der Demo

| Nr. | Punkt | Stand |
| --- | --- | --- |
| 20 | Postanschrift von Nick Holzbecher im Demo-Impressum | wie in den bisherigen Demos «auf Anfrage» (Entscheidung Nick, 3.11.2026) |
| 21 | Demo an die Kanzlei senden | offen; Adressen kanzlei@kanonengasse.ch bzw. die Partnerinnen und Partner |

## D. Technische Schritte für den Produktivbetrieb

1. Sanity-Projekt, Import, Vercel-Projekt, Deploy-Hook: `docs/SANITY-VERCEL-EINRICHTUNG.md`.
2. Freigaben setzen (`freigabe: live`, Übersetzungen «freigegeben»), Rechtstexte durch die Kanzlei neu geschrieben.
3. `INDEXIERUNG=1` und `SITE_URL=https://www.kanonengasse.ch` erst für die Kanzleidomain; Probe mit `https://www.example.com`.
4. Weiterleitungen der alten Adressen (18 Einträge, `data/weiterleitungen.json`) nach dem Domainwechsel live prüfen (308).
5. Alte Wix-Website erst abschalten, wenn die neue unter der Domain läuft; GitHub Pages danach deaktivieren.
6. Google Search Console durch die Kanzlei; keine Rankingversprechen.

## E. Was bei der Übergabe mitgeliefert wird

`docs/INHALTSMATRIX.md` (Inhalte, Quellen, Korrekturen, URL-Zuordnung), `docs/DESIGN.md`, `docs/ENTSCHEIDUNGEN.md`, `docs/BILDER.md`,
`docs/SANITY-VERCEL-EINRICHTUNG.md`, `docs/INHALTE-PFLEGEN.md`, `docs/PRUEFBERICHT.md`, `docs/PRAESENTATION.md`, `SKILL-ANWENDUNG.md`, `CLAUDE.md`.
