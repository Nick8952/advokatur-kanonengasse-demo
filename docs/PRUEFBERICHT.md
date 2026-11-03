# Prüfbericht

Stand 3. November 2026. Alle Prüfungen sind reproduzierbar (Befehle in `CLAUDE.md`); Ergebnisdateien liegen in `pruefung/` (gitignored).

## 1. Testumgebung

- macOS (Apple Silicon), Node 26.8, npm 11.19, Next.js 16.4.4 (Turbopack), Chrome for Testing 156 (puppeteer-core 25.16).
- Lokal: statischer Export `out/`, ausgeliefert vom Vorschau-Server unter `http://localhost:4321/advokatur-kanonengasse-demo/` (ohne Kompression).
- Live: GitHub Pages `https://nick8952.github.io/advokatur-kanonengasse-demo/` (Workflow «GitHub Pages», Lauf 41555609722, 3.11.2026: Jobs build 6 min 30 s, vercel-probe 1 min 29 s, studio 50 s, deploy 12 s, alle grün).
- Lighthouse: `npx lighthouse@latest` gegen die Live-Adresse, Presets Desktop und Mobil (simulierte Drosselung), je Seite ein Lauf.

## 2. Build-Prüfungen (in jedem `npm run build`)

| Prüfung | Ergebnis |
| --- | --- |
| `scripts/weiterleitungen.mjs` | 18 Weiterleitungsseiten, `vercel.json` stimmt überein |
| `scripts/inhalt-pruefen.mts` | 807 deutsche und 432 fremdsprachige Texte, 22 Links, 11 Personen, 9 Rechtsgebiete, 5 Sprachfassungen, 25 Bilder, 33 Belege; Sperrliste mit Selbsttest (13 Treffer-, 10 Freigabebeispiele); 84 Punkte für den Produktivbetrieb noch nicht freigegeben (`--live`) |
| `scripts/sitemap-schreiben.mts` | Demo: keine Sitemap; Probe mit `INDEXIERUNG=1 SITE_URL=https://www.example.com`: 23 Adressen mit hreflang |
| `next build` | 29 Seiten statisch, `globalNotFound` aktiv |
| `scripts/export-nachbereiten.mjs` | `out/404.html` ist die gestaltete Fehlerseite (lang de-CH), `.nojekyll` |
| `scripts/export-pruefen.mjs` | 44 HTML-Dateien (18 Weiterleitungen), 1802 interne Verweise unter dem Unterpfad, noindex überall, keine Sitemap, kein JSON-LD, keine externen Ressourcen, CSP-Meta auf jeder Seite = Header in `vercel.json`, hreflang nur Startseite und Sprachseiten mit exakten Zielen, genau ein robots-Meta, JavaScript je Seite höchstens 584 KB unkomprimiert, alle Bildvarianten zusammen 2226 KB |
| `npm run lint`, `npm run typecheck` | ohne Befund |
| `node werkzeuge/qa/kontrast.mjs` | 15 Farbpaare, alle über dem Mindestwert (Text 4.8:1 bis 14.7:1, Akzentfläche 6.2:1, Feldränder 3.6:1) |
| `npm run seed -- --probe` | 43 Dokumente, 25 Bilder; jedes Dokument besteht das Modell und entspricht nach dem Zurücklesen den lokalen Inhalten |
| Studio | `tsc --noEmit` und `sanity schema validate`: 0 Fehler, 0 Warnungen |
| Vercel-Probe `npm run build:vercel` | Export ohne Unterpfad in Ordnung, Canonicals auf `advokatur-kanonengasse-demo.vercel.app` |
| Go-Live-Probe `INDEXIERUNG=1 SITE_URL=https://www.example.com npm run build:vercel` | kein noindex, Sitemap mit 23 Adressen, JSON-LD (LegalService + 11 Person) parsebar |

## 3. Browser-Prüfungen (lokal, Vorschau-Server)

- **Audit** (`werkzeuge/qa/audit.mjs`): 24 Seiten × 5 Breiten (360, 390, 768, 1024, 1440) = 120 Prüfungen, **0 Befunde**: kein horizontaler
  Überlauf, alle Links und Knöpfe ≥ 44 × 44 px, alle Bilder mit Alternativtext und Massen, genau eine h1, keine Überschriftensprünge, keine
  externen Anfragen, keine Konsolenfehler, kein Speicher, keine Cookies, Sprunglink und `main#inhalt`, kein Text unter 13 px, noindex, `lang`
  und `dir` je Seite (de-CH, en, fr, it, es, ar/rtl), Lauftext ≥ 16 px mit Zeilenhöhe ≥ 1.45, Fehlerseite liefert 404.
  Drei Runden nötig: (1) 120 Befunde (Fusszeilen-Links zu schmal, Profil-Links zu niedrig, Sprachfenster-Links zu niedrig, Lauftext-Messung
  griff die Telefonzeile, Fehlerseite ohne Sprunglink), (2) 51 Befunde (Wortmarken-Link 35 px hoch, Überschriftensprung auf der
  Rechtsgebieteseite), (3) 0.
- **Funktionen** (`werkzeuge/qa/funktionen.mjs`): **131 Prüfungen, 0 fehlgeschlagen**: Erstbesuch ohne Dienste Dritter, ohne Banner, ohne
  Speicher; Telefon- und E-Mail-Links, getrennte Adressen 8004/8021, keine Freitagszeiten, Karten nur extern; Sprunglink und Fokusreihenfolge
  (Sprunglink, Wortmarke, Sprachwahl, Register); Register mit fünf Einträgen in einer Zeile und `aria-current`; Sprachwahl mit sechs Sprachen,
  hreflang, Escape und Klick ausserhalb; fünf Sprachseiten mit lang/dir, vier Abschnitten, Formular, Links zu den deutschen Rechtsseiten;
  Arabisch mit LTR-Läufen für Telefon und E-Mail, arabischer Schrift, rechtsbündigem Titel, ohne Überlauf; Teamfilter (Mietrecht → 3 Personen,
  Mietrecht + Italienisch → Manuela Schiller, Kroatisch → Hinweis statt leerer Fläche, zurücksetzen, nichts in URL oder Speicher); Rollen
  (Hassan ohne «Rechtsanwalt», Müller Associate); Handy 360 px (Register, kein horizontales Scrollen auf 24 Seiten, Titel und Telefonknopf im
  ersten Bildschirm); mailto-Formular auf Deutsch und Arabisch (Felder mit Labels, drei Fehlermeldungen mit Fokus, kodierter Link mit %0A/%26/%23,
  Hinweis ohne Versandbehauptung, nichts gesendet); 18 Weiterleitungen; Fehlerseite 404 mit Telefon; Direktaufruf und Neuladen aller 24 Seiten;
  reduzierte Bewegung ohne Übergänge.
  Eine Runde mit einem Befund (SmartLink ohne `hrefLang` bei Sprungmarken-Zielen), danach 131/131.
- **Sichtprüfung** (`werkzeuge/qa/ganzseiten.mjs`, `ausschnitte.mjs`): Ganzseiten bei 390 und 1440 px für Start, Team, Profil, Rechtsgebiete,
  Kontakt, Mitarbeit, Arabisch, Englisch; Ausschnitte bei 360 und 768 px. Behoben: graue Leerspuren im Fensterraster, Register-Überlauf
  bei 360 px (3 px), zu grosse Wortmarke, Silbentrennung im Sprachraster.

## 4. Live-Prüfungen (GitHub Pages)

- Alle 13 Hauptadressen antworten mit 200; `/team` und `/kontakt` ohne Schrägstrich mit 301 auf die Schrägstrich-Fassung; die alten
  Wix-Adressen (`/urs-ebnoether`, `/advokatur-1`, `/offene-stellen`, `/partnerschaft` …) liefern die Weiterleitungsseite mit Meta-Refresh;
  unbekannte Adressen liefern 404 mit der gestalteten Fehlerseite («Seite nicht gefunden»). `<html lang="de-CH" dir="ltr">` bzw.
  `<html lang="ar" dir="rtl">`, robots noindex, CSP-Meta vorhanden.
- Funktionen und Audit gegen die Live-Adresse: siehe Abschnitt 6 (Nachtrag).

## 5. Lighthouse (live)

Siehe Abschnitt 6 (Nachtrag). SEO ist in der Demo absichtlich niedrig: Lighthouse wertet `noindex` als «nicht indexierbar».

## 6. Live-Prüfungen und Lighthouse (GitHub Pages)

Erster Deploy (Commit «Prüfbefunde: Wortmarken-Link 44 px hoch …», 3.11.2026):

- **Funktionen live** (`BASE=https://nick8952.github.io/advokatur-kanonengasse-demo node werkzeuge/qa/funktionen.mjs`): 131 Prüfungen, 0 fehlgeschlagen.
- **Audit live**: 24 Seiten × 5 Breiten = 120 Prüfungen, 0 Befunde.
- **Lighthouse live** (`npx lighthouse@latest`, Chrome headless, Presets Desktop und Mobil mit simulierter Drosselung, je ein Lauf):

| Seite | Desktop: Leistung / Barrierefreiheit / Best Practices / SEO | LCP | Mobil: Leistung / Barrierefreiheit / Best Practices / SEO | LCP | CLS |
| --- | --- | --- | --- | --- | --- |
| `/` | 100 / 100 / 100 / 66 | 0.5 s | 99 / 100 / 100 / 66 | 1.0 s | 0.064 |
| `/rechtsgebiete/` | 100 / 100 / 100 / 66 | 0.2 s | 100 / 100 / 100 / 66 | 1.0 s | 0.007 |
| `/team/urs-ebnoether/` | 100 / 100 / 100 / 66 | 0.4 s | 100 / 100 / 100 / 66 | 1.9 s | 0 |
| `/kontakt/` | 100 / 100 / 100 / 66 | 0.2 s | 100 / 100 / 100 / 66 | 0.9 s | 0 |
| `/ar/` | 100 / 100 / 100 / 66 | 0.3 s | 100 / 100 / 100 / 66 | 1.0 s | 0.007 |

SEO 66 auf allen Seiten, weil die Demo `noindex` trägt (Audit «is-crawlable»); mit `INDEXIERUNG=1` entfällt das. Der mobile LCP der
Profilseite (1.9 s) ist das Portrait im Querformat unter simulierter Drosselung; es wird mit `fetchPriority="high"` geladen.

Zweiter Deploy nach der Codex-Abschlussprüfung (Abschnitt 8): siehe Nachtrag am Ende dieses Abschnitts.

## 7. Codex-Architekturprüfung (3.11.2026, read-only, vor dem ersten Push)

25 markierte Befunde in neun Blöcken (`pruefung/codex/architektur.md`; die Abschlussprüfung zählt 25). Umgesetzt (20): CI mit Vercel-Probebau und korrigiertem Kommentar;
absoluter Canonical der Weiterleitungsseiten; Viewport und nur ein robots-Meta auf der Fehlerseite; Eindeutigkeit und Anzahl der
Sprachseiten; Gruppen- und Zähllogik des Teams (Partner ohne Anwaltsbezeichnung, «Sieben Rechtsanwältinnen und Rechtsanwälte, ein Partner
mit Lizentiat und LL. M.»); Live-Region des Filters nennt die aktiven Filter; RTL-Isolation von Zeiten, Adressen, Namen und Rollen;
Sprunglink mit logischer Eigenschaft; JSON-LD ohne `employee`, `worksFor`, `areaServed`, Beratungssprachen aus den Profilen; Sitemap ohne
Build-Datum als `lastmod`; CSP mit `default-src 'self'` als Meta und Header; Inhaltsprüfung mit Gruppen-/Rollenlogik, Antwortzusagen in fünf
Sprachen, Rechtsform im Impressum; Exportprüfung mit lokalen CSS-URLs, exakten hreflang-Zielen, robots-Zählung, Formular-Aktionen,
Meta-Refresh, `_not-found`.
Teilweise (4, mit Grund): internes Gruppenmodell des Teams (Beschriftung ist der Wortlaut der alten Website; Gruppen-, Rollen- und
Zähllogik neu geprüft); Antwortzusagen in Übersetzungen (regexbasiert, dazu Statusfelder); Netzwerk-APIs im ausgelieferten JavaScript
(CSP `connect-src 'self'` sperrt sie im Browser, Audit und Funktionen protokollieren jede fremde Anfrage); `_not-found` (Ressourcen und CSP
geprüft, lang/dir nicht, da Next-interne Seite ohne Layout). Nach der Abschlussprüfung umgesetzt (1): «einfache Gesellschaft» aus der
Datenschutzerklärung entfernt (`docs/UEBERGABE.md` Nr. 3).

## 8. Codex-Abschlussprüfung (3.11.2026, read-only, nach dem ersten Push)

9 Befunde (`pruefung/codex/abschluss.md`), alle umgesetzt:

| Schwere | Befund | Umsetzung |
| --- | --- | --- |
| hoch | Lange Nachrichten wurden automatisch in die Zwischenablage kopiert | kein automatisches Kopieren; E-Mail öffnet sich mit den Angaben, der ganze Text steht sichtbar bereit; Kopieren nur auf Klick (`components/Anfrageformular.tsx`, Texte in sechs Sprachen) |
| hoch (übertragen) | «einfache Gesellschaft» in der Datenschutzerklärung | Selbstbezeichnung entfernt, Rechtsform bestätigt die Kanzlei (`data/seiten/datenschutz.json`, `docs/UEBERGABE.md` Nr. 3) |
| mittel | Kanzlei-E-Mail im Profil wirkte wie persönliche Adresse | Beschriftung «E-Mail (Kanzlei)» (`data/seiten/team.json`, Modell, Studio) |
| mittel | Teamfilter ohne JavaScript sichtbar, aber funktionslos | Filter erscheint erst nach dem Laden; Liste bleibt serverseitig vollständig |
| mittel | Sprachseiten: Personenlisten ohne Gruppentitel, deutsche Sprachnamen ohne Isolation | übersetzte Gruppentitel (`ui.gruppen` in fünf Sprachen, Modell, Studio, Seed), Sprachnamen in `<bdi dir="ltr" lang="de">` |
| mittel | CSP-Meta stand hinter Stylesheets und Skripten | `export-nachbereiten.mjs` verschiebt das Meta an den Anfang von `<head>`; `export-pruefen.mjs` prüft Wert und Position auf jeder Seite |
| mittel | Prüfung der übersetzten Telefonzeiten zu schwach | beide Fenster vollständig geprüft (9 bis 12, 14 bis 16) |
| mittel | Stellenstatus mit UTC-Datum; keine Datumsreihenfolge | Zürcher Kalendertag (`Intl.DateTimeFormat`, `Europe/Zurich`), `archiviertAb` > `veroeffentlichtAb` in Modell und Studio |
| mittel / niedrig | `docs/PRUEFBERICHT.md` fehlte; Befundzählung 24 vs 25 | Bericht angelegt; Zählung vereinheitlicht (25 markierte Befunde) |

Nach den Korrekturen: `npm run pruefen`, `npm run build`, `npm run seed -- --probe`, Studio-Schema, Audit und Funktionen erneut ohne Befund
(siehe Abschnitt 6), zweiter Push und erneuter Pages-Lauf.

## 9. Nicht durchführbare Prüfungen

- Screenreader mit Sprachausgabe (VoiceOver, NVDA), echte Mobilgeräte, echte E-Mail-Programme: nicht automatisiert; Semantik, Labels,
  Fokus und `mailto`-Kodierung sind maschinell geprüft.
- Vercel-Deployment und seine Header (308-Weiterleitungen, CSP-Header): nur als Probebau geprüft, kein Vercel-Projekt angelegt (Auftrag).
- Sanity-Import gegen ein echtes Projekt: nur Trockenlauf.
- Lighthouse lokal: nicht aussagekräftig (Vorschau-Server ohne Kompression); gemessen wurde live.
