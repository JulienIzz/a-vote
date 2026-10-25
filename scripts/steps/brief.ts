/** Commande `brief` : un dossier de lecture par texte sélectionné dans data/cache/briefs/. */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { collectContext } from '#scripts/assemblee/context.ts';
import { buildBrief } from '#scripts/content/brief.ts';
import { familyLines } from '#scripts/content/votes.ts';
import { rel } from '#scripts/fs.ts';
import { BRIEFS_DIR } from '#scripts/paths.ts';
import type { ScopedOptions } from '#scripts/steps/options.ts';
import { loadWorkspace, targets } from '#scripts/steps/workspace.ts';

export async function runBrief(options: ScopedOptions): Promise<void> {
  const ws = await loadWorkspace();
  const list = targets(ws, options);
  const themes = ws.themesFile.themes.map((t) => ({ id: t.id, label: t.label }));
  await mkdir(BRIEFS_DIR, { recursive: true });
  for (const { entry, scrutin } of list) {
    const context = await collectContext(scrutin, { force: options.force });
    const brief = buildBrief({
      scrutin,
      context,
      families: familyLines(scrutin, ws.index, ws.mapping),
      themes,
      editorialNote: entry.note ?? null,
    });
    const file = path.join(BRIEFS_DIR, `${entry.uid}.md`);
    await writeFile(file, brief);
    const state = context.exposeDesMotifs ? 'exposé des motifs' : 'sans exposé';
    console.log(`  ${entry.uid}  ${scrutin.date}  ${state.padEnd(18)} ${brief.length} caractères → ${rel(file)}`);
  }
  console.log(`\n${list.length} brief(s) dans ${rel(BRIEFS_DIR)}/`);
}
