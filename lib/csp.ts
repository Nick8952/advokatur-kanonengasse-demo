/**
 * Content-Security-Policy der Website, an einer Stelle definiert:
 *  - als <meta http-equiv> in beiden Wurzel-Layouts und der Fehlerseite (wirkt auch auf GitHub Pages, das keine Header setzen kann);
 *  - als Header in vercel.json (dort zusätzlich frame-ancestors, das in einem Meta-Tag nicht erlaubt ist; scripts/export-pruefen.mjs
 *    vergleicht beide).
 * Die Website lädt alles von sich selbst; Next.js braucht für Hydration und Styles Inline-Skripte und -Styles ('unsafe-inline';
 * Nonces gibt es im statischen Export nicht). Fremde Hosts sind damit auch dann gesperrt, wenn jemand versehentlich einen Dienst Dritter einbaut.
 */
export const CSP_META = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";
export const CSP_HEADER = `${CSP_META}; frame-ancestors 'none'`;
