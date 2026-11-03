// Import der lokalen Inhalte (data/*.json, public/bilder) nach Sanity.
//
//   npm run seed -- --probe     Trockenlauf ohne Zugang: baut alle Dokumente, prüft sie gegen das Domainmodell und vergleicht sie
//                               mit den lokalen Inhalten (Parität). Schreibt nichts, braucht kein Sanity-Projekt.
//   npm run seed                legt fehlende Dokumente an (bestehende bleiben unangetastet)
//   npm run seed -- --force     überschreibt bestehende Dokumente mit dem lokalen Stand
//
// Der echte Lauf braucht SANITY_PROJECT_ID, SANITY_DATASET und SANITY_API_WRITE_TOKEN (Token mit Schreibrecht, nur lokal in
// .env.local, nie im Repository). Die Dokumente entstehen als veröffentlichte Dokumente. Anleitung: docs/SANITY-VERCEL-EINRICHTUNG.md
import { createReadStream, readFileSync } from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { createClient } from "@sanity/client";
import { lokaleQuelle } from "../lib/content/local";
import {
  kanzleiSchema, kontaktSeiteSchema, mitarbeitSeiteSchema, personSchema, pruefen, rechtSeiteSchema, rechtsgebietSchema, rechtsgebieteSeiteSchema,
  sprachseiteSchema, startseiteSchema, teamSeiteSchema, texteSchema, type Block, type Inline,
} from "../lib/content/modell";
import { normalisieren, portableTextZuBloecken } from "../lib/content/sanity";
import { anker, bloecke as rohZuBloecken, type RohBlock } from "../lib/content/text";

const probe = process.argv.includes("--probe");
const force = process.argv.includes("--force");
const lesen = (datei: string) => JSON.parse(readFileSync(path.join("data", datei), "utf8"));
type Doc = { _id: string; _type: string } & Record<string, unknown>;
type Roh = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- frei geformte JSON-Dateien

const bilder = lesen("bilder.json") as Record<string, { breite: number; hoehe: number; alt: string; legende: string | null; nachweis: { urheber: string; titel?: string; quelle: string; lizenz: string; bearbeitung?: string }; quellen: { webp: { breite: number; url: string }[] } }>;
const assetIds = new Map<string, string>();

let zaehler = 0;
const key = (praefix: string) => `${praefix}${(zaehler++).toString(36)}`;
const liste = <T extends Roh>(eintraege: T[] | undefined, typ: string) => (eintraege ?? []).map((e) => ({ _type: typ, _key: e.kennung ?? e.wert ?? e.code ?? e._key ?? key(typ.slice(0, 3)), ...e }));
const verweis = (l: Roh | undefined) => (l ? { _type: "verweis", text: l.text, ziel: l.ziel } : undefined);
const ohneLeer = (o: Roh) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null));
const herkunft = (h: Roh[]) => liste(h, "herkunft");
const belege = (b: Roh) => ({ _type: "belege", herkunft: herkunft(b.herkunft), freigabe: b.freigabe });
const slug = (current: string) => ({ _type: "slug", current });
const ref = (id: string) => ({ _type: "reference", _ref: id });
function bildFeld(id: string | undefined | null) {
  if (!id) return undefined;
  const b = bilder[id];
  if (!b) throw new Error(`Bild «${id}» fehlt in data/bilder.json.`);
  const r = assetIds.get(id) ?? `image-probe${id.replace(/[^a-z0-9]/g, "")}-${b.breite}x${b.hoehe}-webp`;
  return { _type: "bildMitText", asset: ref(r), alt: b.alt, ...(b.legende ? { legende: b.legende } : {}), nachweis: ohneLeer({ urheber: b.nachweis.urheber, titel: b.nachweis.titel, quelle: b.nachweis.quelle, lizenz: b.nachweis.lizenz, bearbeitung: b.nachweis.bearbeitung }) };
}

/** Blöcke des Domainmodells → Portable Text (Absätze, Zwischentitel h2 bis h4, Hinweise, Aufzählungen). */
function portableText(bloecke: Block[]) {
  const span = (t: string | { text: string; fett?: boolean; kursiv?: boolean; link?: string }, markDefs: Roh[]) => {
    if (typeof t === "string") return { _type: "span", _key: key("s"), text: t, marks: [] as string[] };
    const marks: string[] = [];
    if (t.fett) marks.push("strong");
    if (t.kursiv) marks.push("em");
    if (t.link) { const k = key("l"); markDefs.push({ _key: k, _type: "link", href: t.link }); marks.push(k); }
    return { _type: "span", _key: key("s"), text: t.text, marks };
  };
  const block = (style: string, inhalt: Inline[], extra: Roh = {}) => {
    const markDefs: Roh[] = [];
    const children = inhalt.map((t) => span(t, markDefs));
    return { _type: "block", _key: key("b"), style, markDefs, children, ...extra };
  };
  return bloecke.flatMap((b) => {
    if (b.art === "absatz") return [block("normal", b.inhalt)];
    if (b.art === "hinweis") return [block("hinweis", b.inhalt)];
    if (b.art === "liste") return b.punkte.map((p) => block("normal", p, { listItem: "bullet", level: 1 }));
    return [block(`h${b.stufe}`, [b.text])];
  });
}
const rohText = (roh: RohBlock[]) => portableText(rohZuBloecken(roh));
/** Inhalte, die bereits als Modell-Blöcke vorliegen (Mitarbeitseite). */
const modellText = (bl: Roh[]) => portableText(bl.map((b) => (b.art === "titel" ? { ...b, anker: b.anker || anker(b.text) } : b)) as Block[]);
const sprachSlug = (name: string) => anker(name);

function dokumenteBauen(): Doc[] {
  const k = lesen("kanzlei.json"), t = lesen("texte.json"), s = lesen("startseite.json");
  const personen = lesen("personen.json") as Roh[];
  const rg = lesen("seiten/rechtsgebiete.json"), team = lesen("seiten/team.json"), mit = lesen("seiten/mitarbeit.json"), ko = lesen("seiten/kontakt.json");
  const docs: Doc[] = [];
  docs.push(ohneLeer({ _id: "kanzlei", _type: "kanzlei", ...k, karten: liste(k.karten, "verweis"), logo: bildFeld(k.logo), foto: bildFeld(k.foto), seoBild: bildFeld(k.seoBild), herkunft: herkunft(k.herkunft) }) as Doc);
  docs.push({
    _id: "texte", _type: "texte", navigation: liste(t.navigation, "verweis"), sprachen: liste(t.sprachen, "sprachEintrag"), kopf: t.kopf,
    ui: { ...t.ui, nichtGefundenLink: verweis(t.ui.nichtGefundenLink) },
    footer: { ...t.footer, rechtliches: liste(t.footer.rechtliches, "verweis"), bildnachweis: verweis(t.footer.bildnachweis) },
    formular: { ...t.formular, betreffOptionen: liste(t.formular.betreffOptionen, "betreffOption"), datenschutzLink: verweis(t.formular.datenschutzLink) },
    einwilligung: { ...t.einwilligung, kategorien: liste(t.einwilligung.kategorien, "einwilligungKategorie") },
    seo: t.seo, demoHinweis: t.demoHinweis,
  });
  docs.push(ohneLeer({
    _id: "startseite", _type: "startseite", ...s,
    rechtsgebiete: { ...s.rechtsgebiete, link: verweis(s.rechtsgebiete.link) },
    team: { ...s.team, link: verweis(s.team.link) },
    mitarbeit: { titel: s.mitarbeit.titel, partnerschaft: { ...s.mitarbeit.partnerschaft, link: verweis(s.mitarbeit.partnerschaft.link) }, stellen: { ...s.mitarbeit.stellen, link: verweis(s.mitarbeit.stellen.link) } },
    belege: belege(s.belege),
  }) as Doc);
  // Beratungssprachen aus allen Profilen (deutscher Name = Kennung)
  const sprachNamen = [...new Set(personen.flatMap((p) => p.sprachen.map((x: Roh) => x.name as string)))].sort((a, b) => a.localeCompare(b, "de"));
  sprachNamen.forEach((name, i) => docs.push({ _id: `beratungssprache-${sprachSlug(name)}`, _type: "beratungssprache", name, slug: slug(sprachSlug(name)), reihenfolge: (i + 1) * 10 }));
  for (const r of lesen("rechtsgebiete.json") as Roh[]) {
    const { slug: s2, herkunft: h, zusatz, ...rest } = r;
    docs.push(ohneLeer({ _id: `rechtsgebiet-${s2}`, _type: "rechtsgebiet", ...rest, zusatz, slug: slug(s2), herkunft: herkunft(h) }) as Doc);
  }
  for (const p of personen) {
    const { slug: s2, herkunft: h, portrait, portraitQuadrat, sprachen, rechtsgebiete, berufsbezeichnung, rechtsgebieteTitel, email, mitgliedschaftenTitel, ...rest } = p;
    docs.push(ohneLeer({
      _id: `person-${s2}`, _type: "person", ...rest, slug: slug(s2), berufsbezeichnung, rechtsgebieteTitel, email, mitgliedschaftenTitel,
      sprachen: sprachen.map((x: Roh) => ohneLeer({ _type: "sprachzuordnung", _key: key("sp"), sprache: ref(`beratungssprache-${sprachSlug(x.name)}`), zusatz: x.zusatz })),
      rechtsgebiete: rechtsgebiete.map((x: Roh) => ohneLeer({ _type: "gebietszuordnung", _key: key("rg"), text: x.text, gebiet: x.slug ? ref(`rechtsgebiet-${x.slug}`) : undefined, fussnote: x.fussnote })),
      portrait: bildFeld(portrait), portraitQuadrat: bildFeld(portraitQuadrat), herkunft: herkunft(h),
    }) as Doc);
  }
  docs.push({ _id: "rechtsgebieteSeite", _type: "rechtsgebieteSeite", ...rg, belege: belege(rg.belege) });
  docs.push({
    _id: "teamSeite", _type: "teamSeite", ...team,
    gruppen: { anwaeltinnenUndAnwaelte: team.gruppen["anwaeltinnen-und-anwaelte"], substitutinnenUndSubstituten: team.gruppen["substitutinnen-und-substituten"], sekretariat: team.gruppen.sekretariat },
    verlinkt: { ...team.verlinkt, links: liste(team.verlinkt.links, "externerLink") },
    belege: belege(team.belege),
  });
  for (const st of mit.stellen as Roh[]) {
    const { slug: s2, bloecke, bewerbung, veroeffentlichtAb, archiviertAb, stand, ...rest } = st;
    docs.push(ohneLeer({ _id: `stelle-${s2}`, _type: "stelle", ...rest, slug: slug(s2), veroeffentlichtAb, archiviertAb, stand, inhalt: modellText(bloecke), bewerbung: { ...bewerbung, person: ref(`person-${bewerbung.person}`) } }) as Doc);
  }
  {
    const { stellen, partnerschaft, belege: b, ...rest } = mit;
    void stellen;
    const { slug: ps, bloecke, kontakte, stand, ...prest } = partnerschaft;
    docs.push(ohneLeer({ _id: "mitarbeitSeite", _type: "mitarbeitSeite", ...rest, partnerschaft: ohneLeer({ ...prest, slug: slug(ps), stand, inhalt: modellText(bloecke), kontakte: kontakte.map((x: Roh) => ({ _type: "auskunft", _key: key("ko"), person: ref(`person-${x.person}`), email: x.email, telefon: x.telefon })) }), belege: belege(b) }) as Doc);
  }
  docs.push({ _id: "kontaktSeite", _type: "kontaktSeite", ...ko, belege: belege(ko.belege) });
  for (const name of ["impressum", "datenschutz"]) {
    const { bloecke, slug: s2, belege: b, ...rest } = lesen(`seiten/${name}.json`);
    docs.push(ohneLeer({ _id: `rechtSeite-${name}`, _type: "rechtSeite", ...rest, slug: slug(s2), inhalt: rohText(bloecke), belege: belege(b) }) as Doc);
  }
  for (const code of ["en", "fr", "it", "es", "ar"]) {
    const sp = lesen(`sprachen/${code}.json`);
    docs.push({ _id: `sprachseite-${code}`, _type: "sprachseite", ...sp, ui: { ...sp.ui, navigation: liste(sp.ui.navigation, "abschnittLink"), karten: liste(sp.ui.karten, "verweis"), gruppen: { anwaeltinnenUndAnwaelte: sp.ui.gruppen["anwaeltinnen-und-anwaelte"], substitutinnenUndSubstituten: sp.ui.gruppen["substitutinnen-und-substituten"], sekretariat: sp.ui.gruppen.sekretariat } }, formular: { ...sp.formular, betreffOptionen: liste(sp.formular.betreffOptionen, "betreffOption") }, belege: belege(sp.belege) });
  }
  return docs;
}

// ── Trockenlauf: Dokumente so lesen, wie die Website sie aus Sanity bekäme, und mit dem lokalen Stand vergleichen ──
function projizieren(wert: unknown, docs: Map<string, Doc>): unknown {
  if (Array.isArray(wert)) return wert.map((v) => projizieren(v, docs));
  if (!wert || typeof wert !== "object") return wert;
  const o = wert as Roh;
  if (o._type === "slug") return o.current;
  if (o._type === "block") return o;
  if (o._type === "reference") {
    const ziel = docs.get(o._ref);
    if (!ziel) throw new Error(`Verweis auf ein Dokument, das nicht angelegt wird: ${o._ref}`);
    return projizieren(ziel, docs); // wie eine GROQ-Auflösung (->): das verwiesene Dokument selbst
  }
  if (o._type === "bildMitText") {
    const m = /-(\d+)x(\d+)-/.exec(o.asset._ref);
    return { assetId: o.asset._ref, url: `https://cdn.sanity.io/images/probe/production/${o.asset._ref}.webp`, breite: Number(m?.[1]), hoehe: Number(m?.[2]), alt: o.alt, legende: o.legende ?? null, nachweis: o.nachweis };
  }
  const aus: Roh = {};
  for (const [k, v] of Object.entries(o)) if (k !== "_type" && k !== "_id") aus[k] = projizieren(v, docs);
  return aus;
}
/** Für den Vergleich: Bilder (andere Adressen im CDN, andere Kennungen) ausblenden. */
function vergleichbar(wert: unknown): unknown {
  if (Array.isArray(wert)) return wert.map(vergleichbar);
  if (!wert || typeof wert !== "object") return wert;
  const o = wert as Roh;
  if ("quellen" in o && "breite" in o) return { alt: o.alt, legende: o.legende, nachweis: o.nachweis };
  const aus: Roh = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) aus[k] = vergleichbar(v);
  return aus;
}
const mitNull = (o: Roh, felder: string[]) => { const aus = { ...o }; for (const f of felder) if (!(f in aus)) aus[f] = null; return aus; };
async function trockenlauf(liste2: Doc[]) {
  const docs = new Map(liste2.map((d) => [d._id, d]));
  const proj = (id: string) => normalisieren(projizieren(docs.get(id), docs));
  const q = lokaleQuelle;
  const unterschiede: string[] = [];
  const abgleich = new Map<string, [unknown, unknown]>();
  const gleich = (name: string, ausSanity: unknown, lokal: unknown) => { abgleich.set(name, [ausSanity, lokal]); if (!isDeepStrictEqual(vergleichbar(ausSanity), vergleichbar(lokal))) unterschiede.push(name); };
  const mitBloecken = (roh: Roh): Roh => { const { inhalt, ...rest } = roh; return { ...rest, bloecke: portableTextZuBloecken(inhalt) }; };
  gleich("Kanzlei", pruefen(kanzleiSchema, proj("kanzlei"), "Import: Kanzlei"), await q.getKanzlei());
  gleich("Texte", pruefen(texteSchema, proj("texte"), "Import: Texte"), await q.getTexte());
  gleich("Startseite", pruefen(startseiteSchema, proj("startseite"), "Import: Startseite"), await q.getStartseite());
  // Personen: Verweise so auflösen, wie die GROQ-Abfrage es tut (Sprache → Name, Gebiet → Slug)
  const personen = liste2.filter((d) => d._type === "person").map((d) => {
    const p = proj(d._id) as Roh;
    const aufgeloest = { ...p, sprachen: p.sprachen.map((x: Roh) => ohneLeer({ name: x.sprache.name, zusatz: x.zusatz })), rechtsgebiete: p.rechtsgebiete.map((x: Roh) => ohneLeer({ text: x.text, slug: x.gebiet ? x.gebiet.slug : null, fussnote: x.fussnote })) };
    return mitNull(aufgeloest, ["berufsbezeichnung", "rechtsgebieteTitel", "email", "mitgliedschaftenTitel"]);
  }).sort((a, b) => a.reihenfolge - b.reihenfolge);
  gleich("Personen", pruefen(z.array(personSchema), personen, "Import: Personen"), await q.getPersonen());
  const rechtsgebiete = liste2.filter((d) => d._type === "rechtsgebiet").map((d) => mitNull(proj(d._id) as Roh, ["zusatz"])).sort((a, b) => a.reihenfolge - b.reihenfolge);
  gleich("Rechtsgebiete", pruefen(z.array(rechtsgebietSchema), rechtsgebiete, "Import: Rechtsgebiete"), await q.getRechtsgebiete());
  gleich("Seite Rechtsgebiete", pruefen(rechtsgebieteSeiteSchema, proj("rechtsgebieteSeite"), "Import: Seite Rechtsgebiete"), await q.getRechtsgebieteSeite());
  {
    const t = proj("teamSeite") as Roh;
    const team = { ...t, gruppen: { "anwaeltinnen-und-anwaelte": t.gruppen.anwaeltinnenUndAnwaelte, "substitutinnen-und-substituten": t.gruppen.substitutinnenUndSubstituten, sekretariat: t.gruppen.sekretariat } };
    gleich("Seite Team", pruefen(teamSeiteSchema, team, "Import: Seite Team"), await q.getTeamSeite());
  }
  {
    const m = proj("mitarbeitSeite") as Roh;
    const stellen = liste2.filter((d) => d._type === "stelle").map((d) => { const s = mitBloecken(proj(d._id) as Roh); return mitNull({ ...s, bewerbung: { ...s.bewerbung, person: s.bewerbung.person.slug } }, ["veroeffentlichtAb", "archiviertAb", "stand"]); });
    const partnerschaft = mitNull({ ...mitBloecken(m.partnerschaft), kontakte: m.partnerschaft.kontakte.map((x: Roh) => ({ person: x.person.slug, email: x.email, telefon: x.telefon })) }, ["stand"]);
    gleich("Seite Mitarbeit", pruefen(mitarbeitSeiteSchema, { ...m, stellen, partnerschaft }, "Import: Seite Mitarbeit"), await q.getMitarbeitSeite());
  }
  gleich("Seite Kontakt", pruefen(kontaktSeiteSchema, proj("kontaktSeite"), "Import: Seite Kontakt"), await q.getKontaktSeite());
  for (const name of ["impressum", "datenschutz"] as const) gleich(`Rechtsseite ${name}`, pruefen(rechtSeiteSchema, mitBloecken(proj(`rechtSeite-${name}`) as Roh), `Import: ${name}`), await q.getRechtSeite(name));
  for (const code of ["en", "fr", "it", "es", "ar"] as const) {
    const sp = proj(`sprachseite-${code}`) as Roh;
    const ui = { ...sp.ui, gruppen: { "anwaeltinnen-und-anwaelte": sp.ui.gruppen.anwaeltinnenUndAnwaelte, "substitutinnen-und-substituten": sp.ui.gruppen.substitutinnenUndSubstituten, sekretariat: sp.ui.gruppen.sekretariat } };
    gleich(`Sprachseite ${code}`, pruefen(sprachseiteSchema, { ...sp, ui }, `Import: Sprachseite ${code}`), await q.getSprachseite(code));
  }
  if (unterschiede.length) {
    for (const u of unterschiede) if (process.env.DEBUG) console.error(u, JSON.stringify(vergleichbar(abgleich.get(u)?.[0]), null, 1), JSON.stringify(vergleichbar(abgleich.get(u)?.[1]), null, 1));
    throw new Error(`Import weicht vom lokalen Stand ab: ${unterschiede.join(", ")}. scripts/seed.mts und lib/content/sanity.ts abgleichen (DEBUG=1 zeigt beide Stände).`);
  }
}

const docs = dokumenteBauen();
const zaehlung = docs.reduce<Record<string, number>>((z2, d) => ((z2[d._type] = (z2[d._type] ?? 0) + 1), z2), {});
const uebersicht = Object.entries(zaehlung).map(([t, n]) => `${n} × ${t}`).join(", ");

if (probe) {
  await trockenlauf(docs);
  console.log(`✓ Trockenlauf: ${docs.length} Dokumente gebaut (${uebersicht}), ${Object.keys(bilder).length} Bilder zugeordnet.`);
  console.log("  Jedes Dokument besteht das Domainmodell und entspricht nach dem Zurücklesen den lokalen Inhalten. Es wurde nichts geschrieben.");
} else {
  const projectId = (process.env.SANITY_PROJECT_ID ?? "").trim(), dataset = (process.env.SANITY_DATASET ?? "").trim(), token = (process.env.SANITY_API_WRITE_TOKEN ?? "").trim();
  if (!/^[a-z0-9]{8,}$/.test(projectId) || !dataset || !token) {
    console.error("✗ Für den Import fehlen SANITY_PROJECT_ID, SANITY_DATASET oder SANITY_API_WRITE_TOKEN (siehe .env.example).\n  Ohne Zugang lässt sich der Import mit «npm run seed -- --probe» prüfen.");
    process.exit(1);
  }
  const client = createClient({ projectId, dataset, token, apiVersion: "2025-02-19", useCdn: false });
  const vorhandene = new Set<string>(await client.fetch(`*[_id in $ids]._id`, { ids: docs.map((d) => d._id) }));
  if (!force && docs.every((d) => vorhandene.has(d._id))) {
    console.log(`✓ Alle ${docs.length} Dokumente sind bereits in Sanity vorhanden; nichts geschrieben, keine Bilder hochgeladen (zum Überschreiben: npm run seed -- --force).`);
    process.exit(0);
  }
  for (const [id, b] of Object.entries(bilder)) {
    const datei = path.join("public", b.quellen.webp[b.quellen.webp.length - 1].url);
    const bestehend = await client.fetch<string | null>(`*[_type == "sanity.imageAsset" && originalFilename == $name][0]._id`, { name: path.basename(datei) });
    if (bestehend) { assetIds.set(id, bestehend); console.log(`  Bild ${id} → ${bestehend} (vorhanden, nicht erneut hochgeladen)`); continue; }
    const asset = await client.assets.upload("image", createReadStream(datei), { filename: path.basename(datei) });
    assetIds.set(id, asset._id);
    console.log(`  Bild ${id} → ${asset._id}`);
  }
  zaehler = 0;
  const fertig = dokumenteBauen();
  let tx = client.transaction();
  for (const d of fertig) tx = force ? tx.createOrReplace(d) : tx.createIfNotExists(d);
  await tx.commit();
  console.log(`✓ ${fertig.length} Dokumente ${force ? "geschrieben (bestehende überschrieben)" : "angelegt (bestehende unverändert)"}: ${uebersicht}.`);
}
