/**
 * Commande `scaffold` : crée les gabarits de fiches manquants dans data/content/fiches/.
 * Une fiche rédigée n'est jamais écrasée ; --force ne réécrit que les gabarits encore vides.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Scrutin } from '#data/model/types.ts';
import { collectContext, type ScrutinContext } from '#scripts/assemblee/context.ts';
import { PLACEHOLDER, parseFiche } from '#scripts/content/fiche.ts';
import { ficheFileName, renderScaffold } from '#scripts/content/template.ts';
import { classify, compileThemes } from '#scripts/content/themes.ts';
import { familyLines } from '#scripts/content/votes.ts';
import { exists, rel } from '#scripts/fs.ts';
import { FICHES_DIR, scrutinsSource } from '#scripts/paths.ts';
import type { ScopedOptions } from '#scripts/steps/options.ts';
import { loadWorkspace, targets } from '#scripts/steps/workspace.ts';

/** Toutes les URL d'où vient une fiche : archive open data, page du scrutin, puis chaque page consultée avec succès. */
export function sourceUrls(scrutin: Scrutin, context: ScrutinContext): string[] {
  const urls = [scrutinsSource(scrutin.legislature).url, scrutin.sourceUrl];
  if (context.dossier) urls.push(context.dossier.url);
  if (context.text) urls.push(context.text.url);
  for (const source of context.sources) if (source.status === 'ok') urls.push(source.url);
  return [...new Set(urls)];
}

export async function runScaffold(options: ScopedOptions): Promise<void> {
  const ws = await loadWorkspace();
  const list = targets(ws, options);
  const compiled = compileThemes(ws.themesFile.themes);
  await mkdir(FICHES_DIR, { recursive: true });
  let created = 0;
  for (const { entry, scrutin } of list) {
    const file = path.join(FICHES_DIR, ficheFileName(entry.uid));
    if (await exists(file)) {
      const untouched = parseFiche(await readFile(file, 'utf8')).front.get('question') === PLACEHOLDER;
      if (!options.force || !untouched) {
        console.log(
          `  ${untouched ? 'existante' : 'rédigée  '}  ${entry.uid}  conservée${!untouched && options.force ? ' (une fiche rédigée n’est jamais écrasée)' : ''}`,
        );
        continue;
      }
    }
    const context = await collectContext(scrutin);
    const themes = [
      ...new Set(classify(`${scrutin.title} ${scrutin.dossierTitle ?? ''}`, compiled).map((m) => m.themeId)),
    ];
    const toCheck = [
      ...context.warnings.map((w) => `Collecte : ${w}`),
      ...(entry.note ? [`Consigne de sélection : ${entry.note}`] : []),
    ];
    await writeFile(
      file,
      renderScaffold({
        scrutin,
        context,
        families: familyLines(scrutin, ws.index, ws.mapping),
        themes,
        toCheck,
        sources: sourceUrls(scrutin, context),
      }),
    );
    created += 1;
    console.log(`  créée      ${entry.uid}  ${rel(file)}`);
  }
  console.log(
    `\n${created} gabarit(s) créé(s). Rédiger les champs « ${PLACEHOLDER} » en suivant data/content/REDACTION.md, puis « pnpm data check ».`,
  );
}
