/**
 * Commande `collect` : rassemble le contexte documentaire de chaque texte sélectionné
 * (page du scrutin, dossier, texte déposé, exposé des motifs) dans data/cache/context/.
 */
import { collectContext, type ScrutinContext } from '#scripts/assemblee/context.ts';
import { rel } from '#scripts/fs.ts';
import { CONTEXT_DIR } from '#scripts/paths.ts';
import type { ScopedOptions } from '#scripts/steps/options.ts';
import { loadWorkspace, targets } from '#scripts/steps/workspace.ts';

type Status = 'complet' | 'partiel' | 'erreur';

function contextStatus(ctx: ScrutinContext): Status {
  if (!ctx.dossier && !ctx.text) return 'erreur';
  return ctx.exposeDesMotifs && ctx.articles ? 'complet' : 'partiel';
}

export async function runCollect(options: ScopedOptions): Promise<void> {
  const ws = await loadWorkspace();
  const list = targets(ws, options);
  console.log(`${list.length} texte(s) à collecter (législatures ${options.legislatures.join(', ')})`);
  const counts: Record<Status, number> = { complet: 0, partiel: 0, erreur: 0 };
  const toReview: string[] = [];
  for (const { entry, scrutin } of list) {
    const ctx = await collectContext(scrutin, { force: options.force });
    const status = contextStatus(ctx);
    counts[status] += 1;
    if (status !== 'complet') toReview.push(`${entry.uid} : ${ctx.warnings.join(' ; ') || status}`);
    console.log(
      `  ${entry.uid}  ${scrutin.date}  exposé ${String(ctx.exposeDesMotifs?.length ?? 0).padStart(6)}  articles ${String(ctx.articles?.length ?? 0).padStart(6)}  avert. ${ctx.warnings.length}  ${status}`,
    );
  }
  console.log(
    `\nContextes : ${counts.complet} complets, ${counts.partiel} partiels, ${counts.erreur} en erreur → ${rel(CONTEXT_DIR)}/`,
  );
  if (toReview.length > 0) console.log(`À vérifier :\n  ${toReview.join('\n  ')}`);
}
