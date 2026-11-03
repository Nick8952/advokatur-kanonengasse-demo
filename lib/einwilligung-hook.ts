"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { bekanntgeben, EREIGNIS, erzeugen, lesen, rohLesen, speichern } from "./einwilligung";

/**
 * React-Anbindung der Einwilligung über useSyncExternalStore: localStorage (bzw. der Rückfall) ist die externe Quelle;
 * das eigene Ereignis und «storage» (andere Tabs) lösen ein Neulesen aus. Der Server-Schnappschuss ist immer «nicht geladen»,
 * damit Server- und Client-HTML identisch bleiben (im statischen Export gibt es keinen Server, der die Entscheidung kennen könnte).
 */
function abonnieren(melden: () => void) {
  window.addEventListener(EREIGNIS, melden);
  window.addEventListener("storage", melden);
  return () => {
    window.removeEventListener(EREIGNIS, melden);
    window.removeEventListener("storage", melden);
  };
}

export function useEinwilligung(bekannt: readonly string[]) {
  const roh = useSyncExternalStore(abonnieren, rohLesen, () => null);
  const geladen = useSyncExternalStore(() => () => {}, () => true, () => false);
  const einwilligung = useMemo(() => lesen(roh, bekannt), [roh, bekannt]);

  const setzen = useCallback((kategorien: Record<string, boolean>) => {
    speichern(erzeugen(kategorien));
    bekanntgeben();
  }, []);
  const widerrufen = useCallback(() => {
    speichern(null);
    bekanntgeben();
  }, []);
  const erlaubt = useCallback((kategorie: string) => einwilligung?.kategorien[kategorie] === true, [einwilligung]);

  return { einwilligung, geladen, setzen, widerrufen, erlaubt };
}
