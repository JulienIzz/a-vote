import type { Legislature, PoliticalGroup } from '#data/model/types.ts';
import { type RawOrganeFile, toInt } from '#scripts/assemblee/raw-types.ts';
import { readZipJson } from '#scripts/assemblee/zip.ts';

/** Extrait les groupes politiques (codeType GP) des législatures demandées. */
export function parseGroups(zipPath: string, legislatures: readonly Legislature[]): PoliticalGroup[] {
  const wanted = new Set<number>(legislatures);
  const groups: PoliticalGroup[] = [];
  const entries = readZipJson<RawOrganeFile>(zipPath, (name) => name.includes('/organe/') && name.endsWith('.json'));
  for (const { data } of entries) {
    const o = data.organe;
    if (o?.codeType !== 'GP') continue;
    const legislature = toInt(o.legislature);
    if (!wanted.has(legislature)) continue;
    groups.push({
      ref: o.uid,
      legislature: legislature as Legislature,
      abbrev: o.libelleAbrev ?? o.libelleAbrege ?? o.uid,
      shortLabel: o.libelleAbrege ?? o.libelleAbrev ?? o.uid,
      name: o.libelle ?? o.uid,
      start: o.viMoDe?.dateDebut ?? null,
      end: o.viMoDe?.dateFin ?? null,
      color: o.couleurAssociee ?? null,
    });
  }
  return groups.sort(
    (a, b) =>
      a.legislature - b.legislature || (a.start ?? '').localeCompare(b.start ?? '') || a.abbrev.localeCompare(b.abbrev),
  );
}
