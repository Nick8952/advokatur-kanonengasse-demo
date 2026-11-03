// Projektangaben des Studios. Es gibt noch kein Sanity-Projekt: Ohne Angaben startet das Studio nicht und sagt, was fehlt.
// Die Werte sind nicht geheim (sie stehen später in jeder Studio-Adresse). Anleitung: docs/SANITY-VERCEL-EINRICHTUNG.md
export const projectId = (process.env.SANITY_STUDIO_PROJECT_ID ?? "").trim();
export const dataset = (process.env.SANITY_STUDIO_DATASET ?? "production").trim();

export function pruefeEnv(): { projectId: string; dataset: string } {
  if (!/^[a-z0-9]{8,}$/.test(projectId)) {
    throw new Error("SANITY_STUDIO_PROJECT_ID fehlt oder ist ungültig. In studio/.env eintragen (siehe studio/.env.example und docs/SANITY-VERCEL-EINRICHTUNG.md).");
  }
  return { projectId, dataset };
}
