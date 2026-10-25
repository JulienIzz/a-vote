/**
 * Présentation des votes par famille politique : lignes de décompte et tableaux Markdown,
 * pour le brief (position nette) et la fiche (participation).
 */
import { aggregateByFamily, type FamiliesMapping, type FamilyCounts } from '#data/model/families.ts';
import { netScore } from '#data/model/scoring.ts';
import type { Scrutin } from '#data/model/types.ts';

export interface FamilyLine extends Pick<FamilyCounts, 'pour' | 'contre' | 'abstention' | 'members'> {
  id: string;
  label: string;
  /** Score net dans [-1, 1], null si personne n'a voté. */
  net: number | null;
}

/** Décomptes par famille, dans l'ordre d'affichage du mapping. */
export function familyLines(
  scrutin: Scrutin,
  index: ReadonlyMap<string, string>,
  mapping: FamiliesMapping,
): FamilyLine[] {
  const counts = new Map(aggregateByFamily(scrutin, index).map((c) => [c.familyId, c]));
  return mapping.families.flatMap((family) => {
    const c = counts.get(family.id);
    if (!c) return [];
    return [
      {
        id: family.id,
        label: family.label,
        pour: c.pour,
        contre: c.contre,
        abstention: c.abstention,
        members: c.members,
        net: netScore(c),
      },
    ];
  });
}

const signed = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;

/** Tableau du brief : effectif et position nette. */
export function briefTable(lines: readonly FamilyLine[]): string {
  const rows = lines.map(
    (f) =>
      `| ${f.label} | ${f.pour} | ${f.contre} | ${f.abstention} | ${f.members} | ${f.net === null ? 'n’a pas voté' : signed(f.net)} |`,
  );
  return [
    '| Famille | Pour | Contre | Abstention | Effectif | Position nette |',
    '|---|---:|---:|---:|---:|---:|',
    ...rows,
  ].join('\n');
}

/** Tableau de la fiche : participation. */
export function ficheTable(lines: readonly FamilyLine[]): string {
  const rows = lines.map((f) => {
    const expressed = f.pour + f.contre + f.abstention;
    const participation = f.members > 0 ? `${Math.round((expressed / f.members) * 100)} %` : '—';
    return `| ${f.label} | ${f.pour} | ${f.contre} | ${f.abstention} | ${participation} |`;
  });
  return ['| Famille | Pour | Contre | Abstention | Participation |', '|---|---:|---:|---:|---:|', ...rows].join('\n');
}
