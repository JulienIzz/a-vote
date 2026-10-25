import type { Legislature, PoliticalGroup, Scrutin } from '#data/model/types.ts';

type LegislatureKey = `${Legislature}`;

/**
 * Famille politique : identité stable d'un groupe parlementaire à travers
 * les législatures (ex. Renaissance en XVIe → Ensemble pour la République en XVIIe).
 */
export interface FamilyDefinition {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  /**
   * Abréviations officielles (libelleAbrev) des groupes rattachés, par législature.
   * Plusieurs quand un groupe a changé d'identifiant en cours de législature.
   */
  groups: Partial<Record<LegislatureKey, string[]>>;
}

export interface FamiliesMapping {
  families: FamilyDefinition[];
  /** Abréviations volontairement hors calcul (ex. non-inscrits). */
  excluded: string[];
}

export function familyForGroup(
  mapping: FamiliesMapping,
  legislature: Legislature,
  abbrev: string,
): FamilyDefinition | null {
  const key = String(legislature) as LegislatureKey;
  return mapping.families.find((f) => (f.groups[key] ?? []).includes(abbrev)) ?? null;
}

/** Vérifie le mapping : identifiants uniques, un groupe rattaché à une seule famille. */
export function validateMapping(mapping: FamiliesMapping): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const seen = new Map<string, string>();
  for (const family of mapping.families) {
    if (ids.has(family.id)) errors.push(`Famille dupliquée : ${family.id}`);
    ids.add(family.id);
    for (const [legislature, abbrevs] of Object.entries(family.groups)) {
      for (const abbrev of abbrevs ?? []) {
        const key = `${legislature}:${abbrev}`;
        const previous = seen.get(key);
        if (previous) {
          errors.push(`Groupe ${abbrev} (législature ${legislature}) rattaché à ${previous} et ${family.id}`);
        }
        seen.set(key, family.id);
      }
    }
  }
  return errors;
}

export interface GroupFamilyIndex {
  /** organeRef → identifiant de famille. */
  index: Map<string, string>;
  /** Groupes ni rattachés ni exclus : à ajouter au mapping. */
  unmapped: PoliticalGroup[];
}

export function buildGroupFamilyIndex(groups: readonly PoliticalGroup[], mapping: FamiliesMapping): GroupFamilyIndex {
  const index = new Map<string, string>();
  const unmapped: PoliticalGroup[] = [];
  const excluded = new Set(mapping.excluded);
  for (const group of groups) {
    const family = familyForGroup(mapping, group.legislature, group.abbrev);
    if (family) index.set(group.ref, family.id);
    else if (!excluded.has(group.abbrev)) unmapped.push(group);
  }
  return { index, unmapped };
}

export interface FamilyCounts {
  familyId: string;
  pour: number;
  contre: number;
  abstention: number;
  nonVotants: number;
  members: number;
  groupRefs: string[];
}

/** Agrège les décomptes des groupes d'un scrutin par famille politique. */
export function aggregateByFamily(
  scrutin: Pick<Scrutin, 'groups'>,
  index: ReadonlyMap<string, string>,
): FamilyCounts[] {
  const byFamily = new Map<string, FamilyCounts>();
  for (const group of scrutin.groups) {
    const familyId = index.get(group.groupRef);
    if (!familyId) continue;
    const acc = byFamily.get(familyId) ?? {
      familyId,
      pour: 0,
      contre: 0,
      abstention: 0,
      nonVotants: 0,
      members: 0,
      groupRefs: [],
    };
    acc.pour += group.pour;
    acc.contre += group.contre;
    acc.abstention += group.abstention;
    acc.nonVotants += group.nonVotants;
    acc.members += group.members;
    acc.groupRefs.push(group.groupRef);
    byFamily.set(familyId, acc);
  }
  return [...byFamily.values()];
}
