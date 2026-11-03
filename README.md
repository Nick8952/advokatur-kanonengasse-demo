# advokatur kanonengasse Demo

Verkaufs-Demo einer neuen Website für die advokatur kanonengasse, Zürich (Bürogemeinschaft von Anwältinnen und Anwälten). **Nicht die
offizielle Website der Kanzlei.** Betreiber der Demo: Nick Holzbecher.

- Live-Demo (GitHub Pages, noindex): <https://nick8952.github.io/advokatur-kanonengasse-demo/>
- Live-Demo (Vercel, ohne Unterpfad, noindex; Kundenlink): <https://advokatur-kanonengasse-demo.vercel.app/>
- Sechs Sprachen: Deutsch (Wurzel), [English](https://nick8952.github.io/advokatur-kanonengasse-demo/en/), [Français](https://nick8952.github.io/advokatur-kanonengasse-demo/fr/),
  [Italiano](https://nick8952.github.io/advokatur-kanonengasse-demo/it/), [Español](https://nick8952.github.io/advokatur-kanonengasse-demo/es/), [العربية](https://nick8952.github.io/advokatur-kanonengasse-demo/ar/)
- Technik: Next.js 16, TypeScript, Tailwind v4, statischer Export; Sanity (CMS) und Vercel (Hosting) vorbereitet, nicht eingerichtet.

## Schnellstart

```bash
npm install
npm run dev            # http://localhost:3000/advokatur-kanonengasse-demo/
npm run pruefen        # Inhalte, Lint, Typen, Kontraste
npm run build          # statischer Export nach out/ (mit Prüfungen)
npm run vorschau:pages # out/ wie auf GitHub Pages ansehen
npm run qa             # Browser-Prüfungen gegen die Vorschau
```

## Dokumentation

| Datei | Inhalt |
| --- | --- |
| `CLAUDE.md` | Architektur, Regeln, Befehle (für Claude Code, Codex und Menschen) |
| `docs/INHALTSMATRIX.md` | Bestandsaufnahme der bisherigen Website, Quellen, Korrekturen, Zuordnung alter und neuer Adressen |
| `docs/DESIGN.md` | Gestaltung «Durchgang»: Tokens, Schrift, Aufbau, Bewegung und Rückfälle |
| `docs/ENTSCHEIDUNGEN.md` | Begründete Entscheidungen zu Inhalt und Technik |
| `docs/BILDER.md`, `assets/originale/HERKUNFT.md` | Bildquellen, Rechte, Verarbeitung |
| `docs/SANITY-VERCEL-EINRICHTUNG.md` | Einrichtung von Sanity und Vercel, Import, Builds, Go-Live |
| `docs/INHALTE-PFLEGEN.md` | Redaktionsanleitung (Team, Sprachen, Kontakt, Stellen) |
| `docs/UEBERGABE.md` | Offene Angaben und Freigaben für den Produktivbetrieb |
| `docs/PRUEFBERICHT.md` | Prüfungen (Browser, Lighthouse, Codex) mit Testumgebung |
| `docs/PRAESENTATION.md` | Präsentationshilfe für das Kundengespräch |
| `SKILL-ANWENDUNG.md` | Geprüfte und angewendete Skills, Konflikte |

Lizenzen: Schriften IBM Plex Sans und IBM Plex Sans Arabic unter SIL Open Font License (`assets/schriften/`). Inhalte und Bilder: Rechte bei der
advokatur kanonengasse, Nutzung in der Demo vorbehaltlich Freigabe.
