/** Kleine Inline-Symbole (keine Icon-Bibliothek nötig): Pfeil, Menü, Schliessen. Immer dekorativ (aria-hidden); der Text steht daneben. */
export function Pfeil({ groesse = 18 }: { groesse?: number }) {
  return (
    <svg width={groesse} height={groesse} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3.5 10h13M11 4.5 16.5 10 11 15.5" />
    </svg>
  );
}

export function MenueSymbol() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M3 5.5h14M3 10h14M3 14.5h14" />
    </svg>
  );
}

export function SchliessenSymbol() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
  );
}

export function PauseSymbol() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="2" y="1.5" width="3" height="9" rx="0.5" /><rect x="7" y="1.5" width="3" height="9" rx="0.5" />
    </svg>
  );
}

export function PlaySymbol() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M3 1.5v9l7-4.5z" />
    </svg>
  );
}
