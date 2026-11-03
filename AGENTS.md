# advokatur kanonengasse Demo: Anweisungen für Codex

Die verbindlichen Regeln stehen in `CLAUDE.md` (Architektur, Inhalte, Mehrsprachigkeit, Sicherheit, Gestaltung, Befehle) und gelten für
Codex gleichermassen. Übergeordnet gelten `../AGENTS.md` und `../CLAUDE.md` (Workspace, Obsidian-Brain).

Kurzfassung:
- Nichts erfinden: nur Angaben der bisherigen Website www.kanonengasse.ch oder amtliche Quellen; offene Punkte in `docs/UEBERGABE.md`.
- Immer statischer Export; keine Serverfunktionen; keine Anfragen an Dritte; mailto-Formular ohne Versandbestätigung; kein Cookie-Banner ohne Dienste.
- Sechs Sprachen (Deutsch an der Wurzel, fünf Sprachseiten, Arabisch rtl); `hreflang` nur zwischen Startseite und Sprachseiten.
- Vor jedem Commit `npm run pruefen && npm run build`; Browser-Prüfungen `npm run vorschau:pages` + `npm run qa`.
- Reviews lesend (`--sandbox read-only`), keine Rückdelegation an Claude; Ergebnisse in `docs/PRUEFBERICHT.md`.
