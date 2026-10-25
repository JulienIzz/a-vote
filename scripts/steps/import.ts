import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { majorityPosition } from '#data/model/scoring.ts';
import {
  type Legislature,
  legislatureRoman,
  type PoliticalGroup,
  type Scrutin,
  type VoteKind,
} from '#data/model/types.ts';
import { downloadIfMissing } from '#scripts/assemblee/download.ts';
import { parseGroups } from '#scripts/assemblee/parse-organes.ts';
import { parseScrutin } from '#scripts/assemblee/parse-scrutin.ts';
import type { RawScrutinFile } from '#scripts/assemblee/raw-types.ts';
import { readZipJson } from '#scripts/assemblee/zip.ts';
import {
  GROUPS_FILE,
  LEGISLATURES,
  MANIFEST_FILE,
  NORMALIZED_DIR,
  ORGANES_SOURCE,
  scrutinsFile,
  scrutinsSource,
} from '#scripts/paths.ts';

export interface ImportOptions {
  legislatures: Legislature[];
  force: boolean;
}

const mb = (bytes: number): string => `${(bytes / 1_048_576).toFixed(1)} Mo`;

export interface ImportManifest {
  importedAt: string;
  archives: Array<{ url: string; bytes: number; modifiedAt: string }>;
}

export async function runDownload(options: ImportOptions): Promise<ImportManifest> {
  const sources = [ORGANES_SOURCE, ...options.legislatures.map(scrutinsSource)];
  const archives: ImportManifest['archives'] = [];
  for (const source of sources) {
    const result = await downloadIfMissing(source.url, source.path, { force: options.force });
    const status = result.downloaded ? 'téléchargé' : 'déjà en cache';
    console.log(`${status.padEnd(14)} ${mb(result.bytes).padStart(9)}  ${path.relative(process.cwd(), source.path)}`);
    archives.push({ url: source.url, bytes: result.bytes, modifiedAt: (await stat(source.path)).mtime.toISOString() });
  }
  return { importedAt: new Date().toISOString(), archives };
}

export async function runImport(options: ImportOptions): Promise<void> {
  const manifest = await runDownload(options);
  await mkdir(NORMALIZED_DIR, { recursive: true });
  await writeFile(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);

  // Les groupes de toutes les législatures viennent du même référentiel historique.
  const groups: PoliticalGroup[] = parseGroups(ORGANES_SOURCE.path, LEGISLATURES);
  await writeFile(GROUPS_FILE, JSON.stringify(groups, null, 2));
  console.log(`\n${groups.length} groupes politiques → ${path.relative(process.cwd(), GROUPS_FILE)}`);
  const knownRefs = new Set(groups.map((g) => g.ref));

  for (const legislature of options.legislatures) {
    const scrutins: Scrutin[] = [];
    const entries = readZipJson<RawScrutinFile>(scrutinsSource(legislature).path, (n) => n.endsWith('.json'));
    for (const { data } of entries) scrutins.push(parseScrutin(data, legislature));
    scrutins.sort((a, b) => a.numero - b.numero);
    await writeFile(scrutinsFile(legislature), JSON.stringify(scrutins));
    report(legislature, scrutins, knownRefs);
  }
}

function report(legislature: Legislature, scrutins: Scrutin[], knownRefs: Set<string>): void {
  const byKind = new Map<VoteKind, number>();
  const unknownRefs = new Map<string, number>();
  let solemn = 0;
  let groupVotes = 0;
  let majorityMismatches = 0;
  for (const s of scrutins) {
    byKind.set(s.kind, (byKind.get(s.kind) ?? 0) + 1);
    if (s.solemn) solemn += 1;
    for (const g of s.groups) {
      if (!knownRefs.has(g.groupRef)) unknownRefs.set(g.groupRef, (unknownRefs.get(g.groupRef) ?? 0) + 1);
      const recomputed = majorityPosition(g);
      if (recomputed !== null) {
        groupVotes += 1;
        if (g.officialMajority !== recomputed) majorityMismatches += 1;
      }
    }
  }
  const kinds = [...byKind.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k} ${n}`)
    .join(', ');
  console.log(
    `\n${legislatureRoman(legislature)} législature : ${scrutins.length} scrutins (${solemn} solennels) → ${path.relative(process.cwd(), scrutinsFile(legislature))}`,
  );
  console.log(`  par nature : ${kinds}`);
  console.log(
    `  position majoritaire officielle contredite par le décompte : ${majorityMismatches} vote(s) de groupe sur ${groupVotes} (${((100 * majorityMismatches) / Math.max(1, groupVotes)).toFixed(1)} %) — les scripts recalculent toujours depuis les décomptes`,
  );
  if (unknownRefs.size > 0) {
    const list = [...unknownRefs.entries()].map(([ref, n]) => `${ref} (${n})`).join(', ');
    console.log(`  ⚠ groupes absents du référentiel : ${list}`);
  }
}
