/**
 * Chargement de tout ce dont les commandes de fiches ont besoin : sélection, scrutins normalisés,
 * familles, thèmes, et le ciblage --only / --limit / législatures. Les fiches elles-mêmes sont lues ici aussi.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildGroupFamilyIndex, type FamiliesMapping, validateMapping } from '#data/model/families.ts';
import type { PoliticalGroup, Scrutin } from '#data/model/types.ts';
import { type ParsedFiche, parseFiche } from '#scripts/content/fiche.ts';
import { readSelection, type SelectionEntry } from '#scripts/content/selection.ts';
import type { ThemesFile } from '#scripts/content/themes.ts';
import { exists, IMPORT_HINT, readJson } from '#scripts/fs.ts';
import { FAMILIES_FILE, FICHES_DIR, GROUPS_FILE, LEGISLATURES, scrutinsFile, THEMES_FILE } from '#scripts/paths.ts';
import type { ScopedOptions } from '#scripts/steps/options.ts';

export interface Workspace {
  selection: SelectionEntry[];
  scrutins: Map<string, Scrutin>;
  /** organeRef → identifiant de famille. */
  index: Map<string, string>;
  mapping: FamiliesMapping;
  themesFile: ThemesFile;
  knownThemes: Set<string>;
}

export async function loadWorkspace(): Promise<Workspace> {
  const selection = (await readSelection()).selected;
  const groups = await readJson<PoliticalGroup[]>(GROUPS_FILE, IMPORT_HINT);
  const mapping = await readJson<FamiliesMapping>(FAMILIES_FILE);
  const errors = validateMapping(mapping);
  if (errors.length > 0) throw new Error(`Mapping des familles invalide :\n- ${errors.join('\n- ')}`);
  const { index } = buildGroupFamilyIndex(groups, mapping);
  const themesFile = await readJson<ThemesFile>(THEMES_FILE);
  const scrutins = new Map<string, Scrutin>();
  for (const legislature of LEGISLATURES) {
    for (const s of await readJson<Scrutin[]>(scrutinsFile(legislature), IMPORT_HINT)) scrutins.set(s.uid, s);
  }
  return { selection, scrutins, index, mapping, themesFile, knownThemes: new Set(themesFile.themes.map((t) => t.id)) };
}

export interface Target {
  entry: SelectionEntry;
  scrutin: Scrutin;
}

/** Textes sélectionnés à traiter, après filtres --only, --limit et législatures. Signale les uids inconnus. */
export function targets(ws: Workspace, options: ScopedOptions): Target[] {
  const only = options.only ? new Set(options.only) : null;
  const wanted = new Set<number>(options.legislatures);
  const missing = ws.selection.filter((e) => !ws.scrutins.has(e.uid)).map((e) => e.uid);
  if (missing.length > 0) console.warn(`⚠ sélectionnés mais absents des données normalisées : ${missing.join(', ')}`);
  if (only) {
    const unknown = [...only].filter((uid) => !ws.selection.some((e) => e.uid === uid));
    if (unknown.length > 0)
      console.warn(`⚠ hors sélection (data/content/selection.json), ignorés : ${unknown.join(', ')}`);
  }
  const list = ws.selection.flatMap((entry) => {
    if (only && !only.has(entry.uid)) return [];
    const scrutin = ws.scrutins.get(entry.uid);
    return scrutin && wanted.has(scrutin.legislature) ? [{ entry, scrutin }] : [];
  });
  return options.limit === null ? list : list.slice(0, options.limit);
}

export interface LoadedFiche {
  file: string;
  parsed: ParsedFiche;
}

/** Toutes les fiches de data/content/fiches/, par nom de fichier. */
export async function loadFiches(): Promise<LoadedFiche[]> {
  if (!(await exists(FICHES_DIR))) return [];
  const names = (await readdir(FICHES_DIR)).filter((n) => n.endsWith('.md')).sort();
  const out: LoadedFiche[] = [];
  for (const name of names)
    out.push({ file: name, parsed: parseFiche(await readFile(path.join(FICHES_DIR, name), 'utf8')) });
  return out;
}
