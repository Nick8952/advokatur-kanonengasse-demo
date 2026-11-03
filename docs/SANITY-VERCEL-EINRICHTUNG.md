# Sanity und Vercel einrichten (erst bei Kundeninteresse)

Die Demo läuft ohne Sanity und Vercel. Dieses Dokument beschreibt, wie beides später eingerichtet wird. **Jetzt nichts anlegen.**
Grundmodell: Die Website bleibt ein statischer Export. Sanity liefert die Inhalte beim Build; Veröffentlichen im Studio ruft über einen
Webhook einen Vercel-Deploy-Hook auf, der neu baut. Keine Serverfunktionen, keine API-Routen, kein eingebettetes Studio, keine Anfragen an
Sanity beim Seitenaufruf (Bilder werden vor dem Build gespiegelt).

## 1. Sanity-Projekt anlegen

1. Auf sanity.io/manage ein neues Projekt anlegen (Name zum Beispiel «advokatur kanonengasse»), Dataset `production`, **privat**
   (Lesen nur mit Token; die Website braucht beim Build einen Lese-Token).
2. Projekt-ID notieren (nicht geheim).
3. Unter «API» → «Tokens» zwei Tokens erzeugen: einen mit **Viewer** (für Vercel, `SANITY_API_READ_TOKEN`) und einen mit **Editor**
   (nur für den einmaligen Import, `SANITY_API_WRITE_TOKEN`; danach löschen).
4. Unter «API» → «CORS origins» die Studio-Adresse eintragen (zum Beispiel `https://kanonengasse.sanity.studio`), mit Credentials.

## 2. Studio starten und veröffentlichen

```bash
cd studio
cp .env.example .env            # SANITY_STUDIO_PROJECT_ID eintragen
npm install
npm run typecheck && SANITY_STUDIO_PROJECT_ID=<id> npm run schema:pruefen
npm run dev                     # lokal unter http://localhost:3333
npm run deploy                  # hostet das Studio unter <name>.sanity.studio
```

Redaktionszugänge: im Sanity-Projekt unter «Members» die Kanzlei einladen (Rolle Editor). Jede Person meldet sich mit E-Mail an; kein
GitHub-Konto nötig.

## 3. Inhalte importieren

Im Projektstamm (nicht im Studio):

```bash
cp .env.example .env.local      # SANITY_PROJECT_ID, SANITY_DATASET=production, SANITY_API_WRITE_TOKEN eintragen
npm run seed -- --probe         # Trockenlauf ohne Zugang: 43 Dokumente, Parität mit den lokalen Inhalten
npm run seed                    # legt fehlende Dokumente an und lädt die 25 Bilder hoch (grösste WebP-Variante)
```

Danach `SANITY_API_WRITE_TOKEN` aus `.env.local` entfernen und das Token in Sanity löschen. Der Import schreibt veröffentlichte Dokumente:
Kanzlei, Texte, Startseite, 8 Beratungssprachen, 9 Rechtsgebiete, 11 Personen, Rechtsgebiete-Seite, Team-Seite, 1 Stelle, Mitarbeit-Seite,
Kontakt-Seite, Impressum, Datenschutz, 5 Sprachfassungen. `npm run seed -- --force` überschreibt bestehende Dokumente mit dem lokalen Stand.

## 4. Lokal mit Sanity bauen (Probe)

```bash
CONTENT_SOURCE=sanity SANITY_PROJECT_ID=<id> SANITY_DATASET=production SANITY_API_READ_TOKEN=<viewer-token> npm run build
```

Der Build spiegelt zuerst alle Bilder (`npm run sanity:bilder` → `public/bilder/cms/`, `data/cms-bilder.json`), liest dann die Dokumente,
prüft sie gegen dasselbe Modell wie die lokalen Inhalte und bricht bei fehlenden oder falschen Feldern mit klarer Meldung ab.

## 5. Vercel-Projekt anlegen

1. Repository `Nick8952/advokatur-kanonengasse-demo` in Vercel importieren (Framework Next.js). `vercel.json` setzt den Build-Befehl
   `npm run build:vercel` (ohne Unterpfad) und die Sicherheits-Header inklusive CSP und 308-Weiterleitungen der alten Adressen.
2. Environment Variables (Production):
   - `CONTENT_SOURCE=sanity`
   - `SANITY_PROJECT_ID=<id>`
   - `SANITY_DATASET=production`
   - `SANITY_API_READ_TOKEN=<viewer-token>` (geheim)
   - Für den Produktivbetrieb auf der Kanzleidomain zusätzlich `SITE_URL=https://www.kanonengasse.ch` und `INDEXIERUNG=1`
     (siehe Abschnitt 7). Für den Kundenlink `<projekt>.vercel.app` beides weglassen: dann bleibt alles noindex.
3. Deploy auslösen. Vercel liefert die Build-Ausgabe von Next aus (nicht `out/`): Alles, was gleich sein muss, entsteht deshalb vor
   `next build` (Sitemap in `public/`, Weiterleitungsseiten in `public/`).
4. Prüfen: `BASE=https://<projekt>.vercel.app node werkzeuge/qa/lighthouse.mjs` und Stichproben der Weiterleitungen (308).

## 6. Neue Builds bei Veröffentlichung

1. In Vercel unter «Settings» → «Git» → «Deploy Hooks» einen Hook für den Branch `main` anlegen; die Hook-URL ist geheim.
2. In Sanity unter «API» → «Webhooks» einen Webhook anlegen: URL = Deploy-Hook, Trigger on create, update, delete, Filter
   `_type in ["kanzlei","texte","startseite","person","beratungssprache","rechtsgebiet","rechtsgebieteSeite","teamSeite","stelle","mitarbeitSeite","kontaktSeite","rechtSeite","sprachseite"]`,
   Projection leer, HTTP POST, «Include drafts» aus.
3. Ab dann: Veröffentlichen im Studio → Build auf Vercel (zwei bis drei Minuten) → neue Website. Ein manueller Build ist jederzeit über
   den Deploy-Hook (`curl -X POST <hook-url>`) oder in Vercel («Redeploy») möglich.
4. GitHub Pages bleibt davon unberührt (es baut aus dem Repository, nicht aus Sanity) und wird nach dem Umzug auf Vercel abgeschaltet
   (Settings → Pages → «Unpublish»), damit es keine zwei Fassungen gibt.

## 7. Go-Live auf der Kanzleidomain

1. Alle Punkte in `docs/UEBERGABE.md` klären; Freigaben in Sanity setzen (`freigabe: live` je Dokument, Übersetzungen auf «freigegeben»,
   Rechtstexte durch die Kanzlei neu geschrieben und freigegeben).
2. `npm run inhalt:pruefen -- --live` muss ohne offene Punkte durchlaufen. Mit `INDEXIERUNG=1` bricht der Build sonst ab.
3. Probe mit reservierter Testdomain: `INDEXIERUNG=1 SITE_URL=https://www.example.com npm run build:vercel` (prüft Sitemap, JSON-LD, hreflang ohne noindex).
4. In Vercel `SITE_URL=https://www.kanonengasse.ch` und `INDEXIERUNG=1` setzen, Domain verbinden (DNS bei der Kanzlei), neu bauen.
5. Danach: Google Search Console einrichten (Kanzlei), alte Wix-Website erst abschalten, wenn die Weiterleitungen geprüft sind.

## Sicherheit

- Keine Tokens im Repository. `.env.example` enthält nur leere Werte. `.env.local` und `.env` sind gitignored.
- Der Viewer-Token darf nur lesen; der Editor-Token wird nach dem Import gelöscht.
- Keine Mandantendaten, Bewerbungsunterlagen oder vertraulichen Anfragen in Sanity speichern. Das CMS enthält nur Website-Inhalte.
