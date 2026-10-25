/**
 * Commande `shortlist` : classe les scrutins candidats (calculs dans content/ranking.ts) et écrit
 * data/cache/shortlist/candidates.json et candidates.md, la liste à trier à la main.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildGroupFamilyIndex, type FamiliesMapping, validateMapping } from '#data/model/families.ts';
import type { Legislature, PoliticalGroup, Scrutin } from '#data/model/types.ts';
import {
  ALL_KINDS_MIN_VOTANTS,
  ASSEMBLY_SEATS,
  buildCandidate,
  type Candidate,
  compareCandidates,
  dedupeReadings,
  FULL_PARTICIPATION,
  isCandidate,
} from '#scripts/content/ranking.ts';
import { type NewCandidates, readSelection, splitNewCandidates } from '#scripts/content/selection.ts';
import { compileThemes, type ThemesFile } from '#scripts/content/themes.ts';
import { IMPORT_HINT, readJson } from '#scripts/fs.ts';
import { FAMILIES_FILE, GROUPS_FILE, SHORTLIST_DIR, scrutinsFile, THEMES_FILE } from '#scripts/paths.ts';

export interface ShortlistOptions {
  legislatures: Legislature[];
  top: number;
  themes: string[] | null;
  allKinds: boolean;
  /** Ne garder que les textes pas encore tranchés dans selection.json (--new). */
  onlyNew: boolean;
}

/** Longueur maximale des titres dans le Markdown. */
const TITLE_MAX_LENGTH = 110;

function truncate(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

/** Ce que --new ajoute au Markdown : la date d'examen et les nouvelles lectures de textes déjà tranchés. */
interface NewSection {
  reviewedThrough: string | null;
  newReadings: NewCandidates['newReadings'];
}

const escapeCell = (text: string): string => text.replace(/[|[\]]/g, '\\$&');
const signed = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;

export function renderMarkdown(
  candidates: readonly Candidate[],
  shortLabels: ReadonlyMap<string, string>,
  options: Pick<ShortlistOptions, 'allKinds' | 'themes'>,
  generatedAt: Date,
  newCandidates?: NewSection,
): string {
  const lines: string[] = [];
  lines.push('# Shortlist de scrutins candidats', '');
  lines.push(`Générée le ${generatedAt.toISOString()} — ${candidates.length} scrutins.`, '');
  lines.push('Méthode :', '');
  lines.push(
    `- Candidats : votes sur l'ensemble d'un texte ou scrutins solennels, hors motions, procédure et lois de règlement du budget${
      options.allKinds ? `, plus tout scrutin d'au moins ${ALL_KINDS_MIN_VOTANTS} votants (--all-kinds)` : ''
    }${options.themes ? ` ; limités aux thèmes ${options.themes.join(', ')}` : ''}.`,
  );
  lines.push(
    `- Score = discriminance (écart-type pondéré des scores nets des familles politiques, poids selon la participation de chaque famille) × participation globale (plafonnée à ${Math.round(FULL_PARTICIPATION * 100)} % des ${ASSEMBLY_SEATS} sièges) × type de texte × nature du vote × présence d'un thème.`,
  );
  lines.push('- Thèmes : mots-clés de content/themes.json cherchés dans le titre du scrutin et celui du dossier.');
  lines.push(
    '- Un seul scrutin par texte : quand un texte a été voté à plusieurs lectures, seule la mieux classée est listée, les autres sont rattachées dans candidates.json.',
  );
  if (newCandidates) {
    lines.push(
      `- Nouveaux seulement (--new) : textes dont aucune lecture n'est dans selection.json (retenue ou écartée)${
        newCandidates.reviewedThrough ? `, avec au moins un vote après le ${newCandidates.reviewedThrough}` : ''
      }.`,
    );
  }
  lines.push('');
  lines.push('| # | Score | Date | Lég. | Votants | Thèmes | Titre | Familles |');
  lines.push('|---:|---:|---|---|---:|---|---|---|');
  candidates.forEach((c, i) => {
    const readings =
      c.otherReadings.length > 0
        ? ` (+${c.otherReadings.length} autre${c.otherReadings.length > 1 ? 's' : ''} lecture${c.otherReadings.length > 1 ? 's' : ''})`
        : '';
    const title = `[${escapeCell(truncate(c.title, TITLE_MAX_LENGTH))}](${c.sourceUrl})${readings}`;
    const families = c.families
      .filter((f) => f.net !== null)
      .map((f) => `${shortLabels.get(f.familyId) ?? f.familyId} ${signed(f.net ?? 0)}${f.weight < 1 ? '\\*' : ''}`)
      .join(' · ');
    lines.push(
      `| ${i + 1} | ${c.score.toFixed(3)} | ${c.date} | ${c.legislature} | ${c.votants} | ${c.themes.join(', ')} | ${title} | ${families} |`,
    );
  });
  lines.push('', '\\* moins de 25 % des membres ont voté', '');
  if (newCandidates && newCandidates.newReadings.length > 0) {
    lines.push('## Nouvelles lectures de textes déjà tranchés', '');
    lines.push("Décider s'il faut remplacer le scrutin retenu, ajouter la nouvelle lecture ou l'écarter.", '');
    for (const { candidate, decided, uids } of newCandidates.newReadings) {
      const status = decided === 'selected' ? 'retenu' : 'écarté';
      lines.push(`- ${truncate(candidate.title, TITLE_MAX_LENGTH)} (texte ${status}) : ${uids.join(', ')}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export interface ShortlistContext {
  mapping: FamiliesMapping;
  themes: ThemesFile['themes'];
  /** Textes classés et dédoublonnés, sans limite de nombre. */
  candidates: Candidate[];
  /** Scrutins lus. */
  read: number;
  /** Candidats après filtre sur les thèmes, avant dédoublonnage. */
  filteredCount: number;
}

/** Calcule la shortlist complète en mémoire, sans rien écrire sur disque. */
export async function computeShortlist(
  options: Pick<ShortlistOptions, 'legislatures' | 'themes' | 'allKinds'>,
): Promise<ShortlistContext> {
  const groups = await readJson<PoliticalGroup[]>(GROUPS_FILE, IMPORT_HINT);
  const mapping = await readJson<FamiliesMapping>(FAMILIES_FILE);
  const errors = validateMapping(mapping);
  if (errors.length > 0) throw new Error(`Mapping des groupes invalide :\n- ${errors.join('\n- ')}`);
  const { index, unmapped } = buildGroupFamilyIndex(groups, mapping);
  if (unmapped.length > 0) {
    const list = unmapped.map((g) => `${g.abbrev} (L${g.legislature}, ${g.ref})`).join(', ');
    console.warn(`⚠ groupes sans famille, ignorés dans les calculs : ${list}`);
  }
  const familyOrder = mapping.families.map((f) => f.id);

  const themesFile = await readJson<ThemesFile>(THEMES_FILE);
  const compiled = compileThemes(themesFile.themes);
  if (options.themes) {
    const known = new Set(themesFile.themes.map((t) => t.id));
    const unknown = options.themes.filter((id) => !known.has(id));
    if (unknown.length > 0) {
      throw new Error(`Thèmes inconnus : ${unknown.join(', ')} (disponibles : ${[...known].join(', ')})`);
    }
  }

  const candidates: Candidate[] = [];
  let read = 0;
  for (const legislature of options.legislatures) {
    const scrutins = await readJson<Scrutin[]>(scrutinsFile(legislature), IMPORT_HINT);
    read += scrutins.length;
    const kept = scrutins.filter((s) => isCandidate(s, options.allKinds));
    console.log(`Législature ${legislature} : ${scrutins.length} scrutins lus, ${kept.length} candidats`);
    for (const s of kept) candidates.push(buildCandidate(s, index, familyOrder, compiled));
  }

  const wanted = options.themes ? new Set(options.themes) : null;
  const filtered = wanted ? candidates.filter((c) => c.themes.some((t) => wanted.has(t))) : candidates;
  filtered.sort(compareCandidates);
  return {
    mapping,
    themes: themesFile.themes,
    candidates: dedupeReadings(filtered),
    read,
    filteredCount: filtered.length,
  };
}

export async function runShortlist(options: ShortlistOptions): Promise<void> {
  if (!Number.isInteger(options.top) || options.top <= 0) {
    throw new Error(`Option --top invalide : ${options.top} (entier strictement positif attendu)`);
  }
  const ctx = await computeShortlist(options);
  const shortLabels = new Map(ctx.mapping.families.map((f) => [f.id, f.shortLabel]));
  const themeLabels = new Map(ctx.themes.map((t) => [t.id, t.label]));

  console.log(
    `\n${ctx.read} scrutins lus, ${ctx.filteredCount} candidats` +
      (options.themes ? ` après filtre sur les thèmes ${options.themes.join(', ')}` : ''),
  );
  console.log(
    `${ctx.filteredCount - ctx.candidates.length} lectures redondantes rattachées à leur texte, ${ctx.candidates.length} textes distincts`,
  );

  const byTheme = new Map<string, number>();
  let withoutTheme = 0;
  for (const c of ctx.candidates) {
    if (c.themes.length === 0) withoutTheme += 1;
    for (const t of c.themes) byTheme.set(t, (byTheme.get(t) ?? 0) + 1);
  }
  console.log('\nRépartition des textes par thème (un texte peut en avoir plusieurs) :');
  for (const [id, n] of [...byTheme.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${id} — ${themeLabels.get(id) ?? ''}`);
  }
  console.log(`  ${String(withoutTheme).padStart(4)}  (sans thème)`);

  let ranked = ctx.candidates;
  let newCandidates: NewSection | undefined;
  if (options.onlyNew) {
    const selection = await readSelection();
    const split = splitNewCandidates(ctx.candidates, selection);
    ranked = split.fresh;
    newCandidates = { reviewedThrough: selection.reviewedThrough ?? null, newReadings: split.newReadings };
    console.log(
      `\n--new : ${split.fresh.length} textes jamais examinés` +
        (selection.reviewedThrough ? ` votés après le ${selection.reviewedThrough}` : '') +
        `, ${split.newReadings.length} nouvelles lectures de textes déjà tranchés`,
    );
    for (const { candidate, uids } of split.newReadings) {
      console.log(`  ${uids.join(', ')}  ${truncate(candidate.title, 90)}`);
    }
  }

  const top = ranked.slice(0, options.top);
  await mkdir(SHORTLIST_DIR, { recursive: true });
  const jsonFile = path.join(SHORTLIST_DIR, 'candidates.json');
  const mdFile = path.join(SHORTLIST_DIR, 'candidates.md');
  await writeFile(jsonFile, `${JSON.stringify(top, null, 2)}\n`);
  await writeFile(mdFile, renderMarkdown(top, shortLabels, options, new Date(), newCandidates));
  console.log(`\n${top.length} candidats écrits (top ${options.top}) :`);
  console.log(`  ${path.relative(process.cwd(), jsonFile)}`);
  console.log(`  ${path.relative(process.cwd(), mdFile)}`);

  console.log('\nTop 10 :');
  top.slice(0, 10).forEach((c, i) => {
    console.log(
      `  ${String(i + 1).padStart(2)}. ${c.score.toFixed(3)}  ${c.date}  L${c.legislature}  ${truncate(c.title, 90)}`,
    );
  });
}
