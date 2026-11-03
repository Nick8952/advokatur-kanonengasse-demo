# Inhalte pflegen (Redaktionsanleitung)

Diese Anleitung gilt für die Kanzlei, sobald Sanity eingerichtet ist (`docs/SANITY-VERCEL-EINRICHTUNG.md`). Bis dahin pflegt Nick die
Inhalte in `data/*.json`; die Felder heissen dort gleich wie im Studio. Nach jeder Veröffentlichung im Studio baut die Website neu
(zwei bis drei Minuten). Ohne Veröffentlichen («Publish») ändert sich nichts.

## Grundregeln

- Nur schreiben, was stimmt und belegt ist. Keine Erfolgsversprechen, keine Honorare, keine Erreichbarkeitszusagen, keine Titel ohne Nachweis.
- Schweizer Schreibweise («ss», keine Gedankenstriche, Anführungszeichen «…»). Das Studio warnt bei «ß» und Gedankenstrichen.
- Jede Änderung an Personen, Adressen oder Rechtsgebieten in **einer** Quelle machen: Das Studio ist die einzige Wahrheit; die Website
  prüft beim Build Querbezüge (zum Beispiel, dass jede Person in eine Gruppe passt und jedes Rechtsgebiet jemanden hat).

## Team

**Person ändern:** «Team (Profile)» → Person öffnen → Felder anpassen → Publish. Rolle im Wortlaut (zum Beispiel «Rechtsanwältin, lic. iur.,
Partnerin»); «Zugelassen als» nur bei Eintrag im Anwaltsregister setzen. Die Reihenfolge-Zahl bestimmt die Position in der Übersicht.

**Person hinzufügen:** «Team (Profile)» → «Neu»: Vorname, Nachname, Adresse (aus dem Nachnamen erzeugen), Rolle, Gruppe, Funktion, Reihenfolge,
Sprachen (Anzeigezeile und Zuordnung zu Beratungssprachen), Rechtsgebiete (Bezeichnung im Wortlaut plus Zuordnung), Telefon, optional E-Mail,
Werdegang (ein Absatz je Eintrag), Mitgliedschaften, zwei Portraits (Querformat und Quadrat) mit Bildnachweis, Quellen, Beschreibung für
Suchmaschinen → Publish. Portraits nur mit Einverständnis der Person.

**Person entfernen:** Dokument öffnen → «Delete» → Publish-Status prüfen. Die alte Profiladresse führt danach auf die Fehlerseite; wenn
sie weiterhin verlinkt ist, Nick um eine Weiterleitung bitten (`data/weiterleitungen.json` und `vercel.json`).

**Rechtsgebiet hinzufügen:** «Rechtsgebiete» → «Neu»: Bezeichnung, Adresse, Zusatz, Schwerpunkt (nur die vier bestätigten), Reihenfolge,
Bezeichnungen in den Profilen, Hintergrund, fünf Übersetzungen (Status «Entwurf», bis sie geprüft sind) → Publish. Dann bei den Personen
zuordnen. Ein Gebiet ohne Person bricht den Build ab (es würde eine leere Seite ergeben).

**Beratungssprache hinzufügen:** «Beratungssprachen» → «Neu» (deutscher Name) → bei den Personen zuordnen. Die Filter der Teamseite
zeigen nur Sprachen und Gebiete, die mindestens eine Person nennt.

## Sprachen der Website

Die Website hat sechs Sprachen. Die fünf Sprachfassungen (EN, FR, IT, ES, AR) sind je ein Dokument unter «Sprachfassungen»: Einführung
(Wortlaut der Kanzlei), Beschriftungen, Formulartexte, Hinweis zu Anfragen. Änderungen am Hinweis zu Anfragen in einer Sprache bitte auch
in den anderen nachführen. Übersetzungen, die noch nicht geprüft sind, als «Entwurf» markieren; die Website zeigt dann eine kleine Marke
«Entwurf» beim Hinweis.

Eine siebte Sprache ist nicht vorgesehen (die Sprachliste und das Raster sind auf sechs ausgelegt). Falls gewünscht, Nick anfragen.

## Kontakt, Telefonzeiten, Adressen

«Kanzlei, Adressen, Telefonzeiten»: Besuchsadresse (Strasse, PLZ 8004, Stockwerk), Postadresse (Postfach, PLZ 8021), Telefon, E-Mail,
Telefonzeiten (Tage, Zeitfenster, Terminregelung), Anfahrt, Kartenlinks. Diese Angaben erscheinen auf allen Seiten und in der Fusszeile.
Die fremdsprachigen Zeitangaben stehen in den Sprachfassungen (Feld «Zeitfenster») und müssen bei Änderungen nachgeführt werden; der Build
prüft, dass die Anzahl der Fenster übereinstimmt.

Der Hinweis zu Anfragen (24 Stunden) und der Zusatz zur Mandatsannahme stehen unter «Kontakt und Anfahrt».

## Offene Stellen und Partnerschaft

**Stelle ausschreiben:** «Offene Stellen» → «Neu»: Titel, Adresse, Status «Entwurf», Text, Bewerbung (Text, E-Mail, Ansprechperson),
«Stand der Angaben» (zum Beispiel «Ausschreibung vom 1. März 2027»). Prüfen, dann Status auf «Veröffentlicht» → Publish. Optional
«Sichtbar ab» und «Sichtbar bis» setzen; die Website vergleicht beim Build mit dem Datum. Weil die Website statisch ist, muss nach
dem Ablaufdatum ein Build laufen (automatisch bei jedem Publish, sonst Deploy-Hook).

**Stelle beenden:** Status «Archiviert» → Publish. Die Stelle verschwindet, bleibt aber dokumentiert. Nicht löschen, wenn man den Text
später wiederverwenden will. Ohne sichtbare Stelle zeigt die Seite den Text «Derzeit ist keine Stelle ausgeschrieben».

**Partnerschaft:** «Mitarbeit und Partnerschaft (Seite)» → Abschnitt «Partnerschaft»: Status, Text, Auskunftspersonen, «Stand der Angaben».
Datierte Aussagen («ab Januar 2026») nicht stehen lassen, wenn sie nicht mehr gelten; Status «Archiviert» blendet den Abschnitt aus.

## Startseite, Rechtsgebiete-Seite, Rechtsseiten

Texte der Startseite («Startseite»), der Übersichtsseiten («Rechtsgebiete (Übersichtsseite)», «Team (Übersichtsseite)») und die Rechtstexte
(«Impressum», «Datenschutzerklärung») sind Einzeldokumente. Das Impressum braucht für den Produktivbetrieb die Angaben der Kanzlei als
Betreiberin; die Datenschutzerklärung beschreibt die Technik (Vercel statt GitHub Pages) und muss bei technischen Änderungen angepasst werden.

## Bilder

Bilder im Studio hochladen (JPEG oder PNG, möglichst 2000 px breit); Alternativtext, Bildnachweis und Nutzungsrecht sind Pflichtfelder. Die
Website erzeugt beim Build die passenden Grössen. Keine Stockfotos, keine erzeugten Personen, keine Bilder ohne geklärte Rechte.

## Was nicht im CMS liegt

Navigation und Reihenfolge der Sprachen («Navigation, Fusszeile, Formular, Sprachen»), Farben, Schriften, Weiterleitungen alter Adressen,
Sicherheitsregeln und die Freigabe für Suchmaschinen (`INDEXIERUNG`) sind Technik und werden mit Nick geändert.
