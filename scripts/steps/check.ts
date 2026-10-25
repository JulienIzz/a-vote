/** Commande `check` : contrôles de forme de toutes les fiches ; code de sortie 1 s'il reste un problème bloquant. */
import type { Statut } from '#data/model/types.ts';
import { checkFiche, parseStatut, remainingPlaceholders } from '#scripts/content/fiche.ts';
import { readSelection } from '#scripts/content/selection.ts';
import type { ThemesFile } from '#scripts/content/themes.ts';
import { readJson } from '#scripts/fs.ts';
import { THEMES_FILE } from '#scripts/paths.ts';
import { loadFiches } from '#scripts/steps/workspace.ts';

export async function runCheck(): Promise<void> {
  const fiches = await loadFiches();
  const themesFile = await readJson<ThemesFile>(THEMES_FILE);
  const knownThemes = new Set(themesFile.themes.map((t) => t.id));
  const selectedUids = new Set((await readSelection()).selected.map((e) => e.uid));
  let problems = 0;
  let complete = 0;
  const byStatut = new Map<Statut, number>();
  for (const { file, parsed } of fiches) {
    const result = checkFiche(parsed, { knownThemes, selectedUids, fileName: file });
    const statut = parseStatut(parsed);
    byStatut.set(statut, (byStatut.get(statut) ?? 0) + 1);
    const unfinished = remainingPlaceholders(parsed).length > 0;
    if (!unfinished) complete += 1;
    if (result.problems.length === 0 && result.warnings.length === 0) {
      console.log(`✓ ${file}  [${statut}]`);
      continue;
    }
    console.log(`\n${result.problems.length > 0 ? '✗' : '·'} ${file}  [${statut}${unfinished ? ', à rédiger' : ''}]`);
    for (const p of result.problems) console.log(`  ✗ ${p}`);
    for (const w of result.warnings) console.log(`  · ${w}`);
    problems += result.problems.length;
  }
  const statuts = [...byStatut.entries()].map(([s, n]) => `${n} ${s}`).join(', ');
  console.log(
    `\n${fiches.length} fiche(s) : ${statuts || 'aucune'} ; ${complete} entièrement rédigée(s) ; ${problems} problème(s) bloquant(s).`,
  );
  if (problems > 0) process.exitCode = 1;
}
