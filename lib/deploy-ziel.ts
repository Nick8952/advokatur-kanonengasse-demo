// Einzige Stelle, an der Betriebsart, Unterpfad und öffentliche URL festgelegt werden.
// Wird von next.config.ts (Build) und von der Anwendung gelesen.
//
// Die Website ist in beiden Betriebsarten ein statischer Export. Der Unterschied ist nur der Unterpfad:
// - "pages"  (Standard, JETZT):  GitHub Pages unter nick8952.github.io/advokatur-kanonengasse-demo/. Baut ohne jede Env-Variable.
// - "vercel" (SPÄTER):           Vercel oder die Kanzleidomain, ohne Unterpfad (DEPLOY_TARGET=vercel).
// Unbekannte Werte brechen den Build ab: kein stilles Raten.
export type DeployZiel = "pages" | "vercel";

export const REPO_NAME = "advokatur-kanonengasse-demo";
const GITHUB_KONTO = "nick8952";

const roh = (process.env.DEPLOY_TARGET ?? "").trim();
if (roh && roh !== "pages" && roh !== "vercel") {
  throw new Error(`DEPLOY_TARGET=«${roh}» ist unbekannt. Erlaubt: leer/«pages» (GitHub Pages) oder «vercel».`);
}
export const deployZiel: DeployZiel = roh === "vercel" ? "vercel" : "pages";

// BASE_PATH nicht gesetzt → Repository-Unterpfad; ausdrücklich leer ("") → Export an einer Domain-Wurzel.
export const basePath: string =
  deployZiel === "vercel" ? "" : (process.env.BASE_PATH ?? `/${REPO_NAME}`).trim().replace(/\/$/, "");

if (basePath && !/^\/[A-Za-z0-9._~-]+(\/[A-Za-z0-9._~-]+)*$/.test(basePath)) {
  throw new Error(`BASE_PATH=«${basePath}» muss mit «/» beginnen, ohne Schluss-Schrägstrich (oder leer sein).`);
}
// Leere oder fehlende SITE_URL ist erlaubt (dann gilt der Standard). Ein gesetzter Wert muss eine reine http(s)-Adresse ohne Pfad
// sein und lässt sich nicht mit einem Unterpfad kombinieren: So kann in der GitHub-Pages-Demo nie die Kanzleidomain im
// Canonical oder in Open Graph landen.
const siteUrlEnv = process.env.SITE_URL?.trim().replace(/\/$/, "");
let siteUrlHost = "";
if (siteUrlEnv) {
  let u: URL;
  try {
    u = new URL(siteUrlEnv);
  } catch {
    throw new Error(`SITE_URL=«${siteUrlEnv}» ist keine gültige http(s)-URL.`);
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error(`SITE_URL=«${siteUrlEnv}» ist keine gültige http(s)-URL.`);
  if (u.pathname !== "/" || u.search || u.hash || u.username || u.password) throw new Error(`SITE_URL=«${siteUrlEnv}» darf nur aus Protokoll und Domain bestehen (kein Pfad, keine Parameter).`);
  if (basePath) throw new Error(`SITE_URL lässt sich nicht mit dem Unterpfad «${basePath}» kombinieren. Für eine eigene Domain DEPLOY_TARGET=vercel setzen (oder BASE_PATH="" für einen Export an der Domain-Wurzel).`);
  siteUrlHost = u.hostname.toLowerCase();
}
export const siteUrl: string =
  siteUrlEnv && siteUrlEnv.length > 0
    ? siteUrlEnv
    : deployZiel === "vercel"
      ? `https://${REPO_NAME}.vercel.app`
      : `https://${GITHUB_KONTO}.github.io${basePath}`;

/**
 * Indexierung nur, wenn ausdrücklich freigegeben (nach Go-Live auf der Kanzleidomain). Eine Variable allein genügt nicht:
 * INDEXIERUNG=1 verlangt zusätzlich eine ausdrückliche SITE_URL, und Vorschau-Adressen (github.io, vercel.app, localhost)
 * sind ausgeschlossen. Damit bleibt die Demo auch dann noindex, wenn jemand INDEXIERUNG=1 versehentlich setzt: Der Build bricht ab.
 */
const VORSCHAU_HOSTS = /(^|\.)github\.io$|(^|\.)vercel\.app$|(^|\.)netlify\.app$|(^|\.)pages\.dev$|^localhost$|^127\.0\.0\.1$/;
/** Reservierte Testdomains (RFC 2606/6761): Hier kann nie eine echte Website liegen. */
const TEST_HOSTS = /(^|\.)example\.(com|org|net)$|\.(test|example|invalid)$/;
const indexierungGewuenscht = process.env.INDEXIERUNG === "1";
if (indexierungGewuenscht && !siteUrlEnv) {
  throw new Error("INDEXIERUNG=1 verlangt eine ausdrückliche SITE_URL (die Kanzleidomain, zum Beispiel https://www.kanonengasse.ch). Ohne sie bleibt die Website noindex: INDEXIERUNG weglassen.");
}
if (indexierungGewuenscht && siteUrlEnv && !siteUrlEnv.startsWith("https://")) {
  throw new Error(`INDEXIERUNG=1 verlangt eine https-Adresse als SITE_URL (nicht «${siteUrlEnv}»): Canonical, Open Graph und strukturierte Daten dürfen nie auf http zeigen.`);
}
if (indexierungGewuenscht && VORSCHAU_HOSTS.test(siteUrlHost)) {
  throw new Error(`INDEXIERUNG=1 ist für die Vorschau-Adresse «${siteUrlHost}» nicht erlaubt. Indexiert wird nur die Kanzleidomain.`);
}
export const indexierungErlaubt = indexierungGewuenscht;
/**
 * Probe-Build für eine reservierte Testdomain (https://www.example.com, *.test): Sitemap, strukturierte Daten und fehlendes
 * noindex lassen sich so prüfen, ohne dass die Inhalte schon vom Anwalt freigegeben sind. Für jede echte Domain gilt die
 * Freigabeprüfung (lib/content/freigabe.ts) und bricht den Build ab, solange etwas nicht freigegeben ist.
 */
export const indexierungProbe = indexierungGewuenscht && TEST_HOSTS.test(siteUrlHost);
