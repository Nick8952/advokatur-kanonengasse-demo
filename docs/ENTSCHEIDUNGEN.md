# Entscheidungen

Kurz begründete Entscheidungen, die man dem Code nicht ansieht. Datum 2. und 3. November 2026, sofern nicht anders genannt.

## Inhalt

1. **Nur Belegtes.** Jede Angabe stammt von www.kanonengasse.ch (abgerufen 2.11.2026) oder aus einer amtlichen Quelle (PLZ 8004:
   geo.admin.ch). Was fehlt, steht in `docs/UEBERGABE.md`, nicht auf der Website.
2. **Besuchs- und Postadresse getrennt.** Die alte Website schrieb «militaerstrasse 76, postfach 1012, 8021 zuerich». 8021 ist die
   Postfach-PLZ; das Büro liegt in 8004 (amtlich geprüft). Beide Adressen erscheinen getrennt mit der jeweiligen PLZ.
3. **Telefonzeiten Montag bis Donnerstag.** Die Kontaktseite nennt die Tage, die Startseite nicht. Übernommen wurde die präzisere Angabe;
   Freitag wird nirgends behauptet.
4. **Rollen im Wortlaut.** Tarig Hassan ist «lic. iur., LL. M., Partner» und laut Profil nicht im Schweizerischen Anwaltsregister;
   Christian Müller ist Associate; Substitutinnen und Sekretariat sind keine Anwältinnen und Anwälte. Das Modell trägt deshalb
   `berufsbezeichnung` nur, wo die Quelle sie nennt; die Team-Einleitung zählt sieben Rechtsanwältinnen und Rechtsanwälte und nennt den
   Partner ohne Zulassung gesondert. Die Gruppe heisst wie auf der alten Seite «Partnerinnen und Partner, Rechtsanwältinnen und Rechtsanwälte».
5. **Rechtsgebiete als Taxonomie mit Begriffen der Profile.** Neun Gebiete, davon vier Schwerpunkte (Partnerschaftsseite). Die Profile
   zeigen weiterhin ihre eigenen Bezeichnungen (zum Beispiel «Sozialhilfe» und «Sozialversicherungsrecht und Sozialhilferecht»), die
   Übersicht gruppiert sie. Die Zuordnung steht in `docs/INHALTSMATRIX.md`, Abschnitt 3.
6. **Keine Beschreibungen der Rechtsgebiete erfunden.** Die Übersichtsseite zeigt je Gebiet die Ansprechpersonen, die Begriffe der Profile
   und belegte Hintergründe aus den Lebensläufen, dazu einen Hinweis, dass die Seite keine Leistungen im Einzelfall beschreibt.
7. **Bürogemeinschaft.** Die Website spricht von Bürogemeinschaft und wirtschaftlicher Selbständigkeit (Partnerschaftsseite). Die
   Datenschutzerklärung der Kanzlei nennt sich selbst «einfache Gesellschaft»; dieser Satz bleibt als Wortlaut der Kanzlei in der
   Datenschutzerklärung, wird aber nirgends sonst verwendet. Strukturierte Daten verknüpfen Personen nicht als Angestellte (kein
   `employee`, kein `worksFor`); «Kanonengasse Kanzlei GmbH» (Zefix) wird nicht als Betreiberin dargestellt.
8. **Hinweis zu Anfragen (24 Stunden).** Der Text der alten Website war die Antwortmeldung des Formulars. Er beschreibt, was ausbleibende
   Rückmeldung bedeutet, und ist keine Antwortzusage. Er steht neben dem Formular (nicht als Bestätigung nach dem Klick), mit einem Zusatz
   zur Mandatsannahme, den die Kanzlei freigibt. Übersetzungen in FR, IT, ES und AR sind Entwürfe (`status: entwurf`), EN stammt von der Quelle.
9. **Datierte Angaben nicht fortgeschrieben.** «Partnerschaft ab Januar 2026» und «ab Januar 2026 ein ganzes Büro frei» bleiben im Wortlaut,
   mit sichtbarem «Stand der Angaben». Die Stelle «Anwaltspraktikum / Substitut» trägt Status «veröffentlicht» ohne Datum (die Quelle nennt keines).
10. **Schreibfehler korrigiert, Fakten nicht.** Liste in `docs/INHALTSMATRIX.md`, Abschnitt 4.
11. **Bernhard Jüsi** erscheint nur als externer Link am Ende der Teamseite («Ebenfalls verlinkt»), wie auf der alten Teamseite verlinkt,
    ohne Profil und ohne Behauptung einer Zugehörigkeit.
12. **Datenschutzerklärung.** Abschnitte zur Geschäftstätigkeit im Wortlaut der Kanzlei (Fehler korrigiert), Abschnitt zur Website neu nach der
    Technik der Demo (GitHub Pages, keine Cookies, mailto-Formular, externe Karten). Gesetzesverweis auf Art. 25 DSG 2020 (Fedlex, Stand 7.7.2025).
    Der Wix-Cookie-Banner und die Google-Maps-Einbettung werden nicht mehr beschrieben, weil es sie nicht mehr gibt.

## Technik

13. **Immer statischer Export.** Heute GitHub Pages unter `/advokatur-kanonengasse-demo`, später Vercel ohne Unterpfad (`DEPLOY_TARGET=vercel`).
    Auch mit Sanity bleibt die Website statisch; Veröffentlichen löst einen Build aus (Deploy-Hook).
14. **Zwei Wurzel-Layouts.** `app/(de)` für Deutsch an der Wurzel (`lang="de-CH"`), `app/(sprachen)/[sprache]` für EN, FR, IT, ES, AR mit
    eigenem `lang` und `dir`. Darum gibt es keine gemeinsame `not-found.tsx`; die Fehlerseite ist `app/global-not-found.tsx`
    (`experimental.globalNotFound`), aus der Next `out/404.html` schreibt (GitHub Pages und Vercel liefern sie aus).
15. **Deutsch an der Wurzel, Sprachen als je eine Seite.** Die alte Website hatte je Sprache nur eine Einführungsseite; mehr Inhalt gibt es
    nicht. Die Sprachseiten enthalten alles, was belegt ist (Einführung, Erreichbarkeit, Rechtsgebiete mit übersetzten Namen, Team, Kontakt
    mit Formular) und sagen bei allem Weiteren, dass es Deutsch ist. `hreflang` nur zwischen Startseite und Sprachseiten.
16. **Schriften per @font-face mit unicode-range** statt `next/font` (das keine unicode-range je Datei kennt); Next kopiert die Dateien beim
    Build nach `_next/static/media` und setzt den Unterpfad selbst.
17. **Bilder vorgerendert mit sharp** (AVIF und WebP, feste Masse), nicht `next/image` (im Export ohne Optimierer). Portraits zusätzlich
    als Quadrat aus der Bildmitte; Originale unverändert in `assets/originale`.
18. **Alte Adressen.** Wix-Adressen ohne Endung → `public/<name>.html` mit Meta-Refresh (GitHub Pages liefert `name.html` für `/name`) und
    308-Weiterleitungen in `vercel.json`; `/offene-stellen` und `/partnerschaft` führen mit Sprungmarke auf `/mitarbeit/`.
19. **Teamfilter nur mit belegten Zuordnungen.** Rechtsgebiete und Sprachen kommen aus den Profilen; Zustände liegen im Speicher der Seite,
    nie in der Adresse oder im Browser-Speicher. Ohne JavaScript erscheinen alle Personen.
20. **Kein Cookie-Banner.** Die Website setzt keine Cookies, lädt nichts von Dritten (CSP `default-src 'self'` als Meta und Header) und bettet
    keine Karten ein. Die Einwilligungskomponente ist vorbereitet (`texte.einwilligung.kategorien`) und ruht; ein Banner ohne
    einwilligungspflichtige Dienste wäre irreführend.
21. **Formular = mailto.** Knopf «E-Mail vorbereiten», Hinweis statt Versandbestätigung, keine Uploads, keine Speicherung, Längenbegrenzung,
    Kopierfunktion als Rückfall. Ohne JavaScript bleibt der Knopf gesperrt und die Adresse wird genannt.
22. **Sanity-Modell.** Personen verweisen auf `rechtsgebiet`- und `beratungssprache`-Dokumente (saubere Verknüpfung), Stellen sind eigene
    Dokumente mit Status und Datumsfenster, Sprachfassungen eigene Dokumente, Übersetzungen der Gebietsnamen mit Status. Feldnamen in
    Sanity = Feldnamen im Modell (Ausnahme: Gruppentitel der Teamseite in camelCase, weil Sanity keine Bindestriche in Feldnamen erlaubt).
23. **Codex-Architekturprüfung (3.11.2026)** mit 24 Befunden, davon umgesetzt: keine `employee`/`worksFor`/`areaServed` in JSON-LD,
    Beratungssprachen aus den Profilen, Sitemap ohne Build-Datum, Eindeutigkeit der Sprachseiten, Gruppen- und Zähllogik des Teams,
    RTL-Isolation von Zeiten, Adressen, Namen und Rollen, Sprunglink logisch, CSP als Meta und Header, Vercel-Probe in der CI, absoluter
    Canonical der Weiterleitungen, schärfere Export- und Inhaltsprüfungen (lokale CSS-URLs, hreflang-Ziele, robots-Metas, Formular-Aktionen,
    Antwortzusagen in Übersetzungen, Rechtsform im Impressum). Nicht umgesetzt: Umbenennung der Teamgruppe (Beschriftung ist der Wortlaut der
    alten Website) und Umdeutung der «einfachen Gesellschaft» (bleibt Wortlaut der Kanzlei, Freigabe offen). Protokoll: `docs/PRUEFBERICHT.md`.
