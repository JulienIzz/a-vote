import { describe, expect, it } from 'vitest';
import {
  aggregateByFamily,
  buildGroupFamilyIndex,
  type FamiliesMapping,
  familyForGroup,
  validateMapping,
} from '#data/model/families.ts';
import type { PoliticalGroup } from '#data/model/types.ts';

const mapping: FamiliesMapping = {
  families: [
    {
      id: 'soc',
      label: 'Socialistes',
      shortLabel: 'SOC',
      color: '#000',
      groups: { '16': ['SOC', 'SOC-A'], '17': ['SOC'] },
    },
    { id: 'epr', label: 'Renaissance', shortLabel: 'EPR', color: '#000', groups: { '16': ['RE'], '17': ['EPR'] } },
  ],
  excluded: ['NI'],
};

const group = (ref: string, legislature: 16 | 17, abbrev: string): PoliticalGroup => ({
  ref,
  legislature,
  abbrev,
  shortLabel: abbrev,
  name: abbrev,
  start: null,
  end: null,
  color: null,
});

describe('familyForGroup', () => {
  it('retrouve une famille par législature et abréviation, y compris les identifiants successifs', () => {
    expect(familyForGroup(mapping, 16, 'SOC-A')?.id).toBe('soc');
    expect(familyForGroup(mapping, 17, 'EPR')?.id).toBe('epr');
    expect(familyForGroup(mapping, 17, 'RE')).toBeNull();
  });
});

describe('validateMapping', () => {
  it('accepte un mapping cohérent', () => {
    expect(validateMapping(mapping)).toEqual([]);
  });
  it('signale un groupe rattaché deux fois', () => {
    const bad: FamiliesMapping = {
      families: [...mapping.families, { id: 'x', label: 'x', shortLabel: 'x', color: '', groups: { '17': ['SOC'] } }],
      excluded: [],
    };
    expect(validateMapping(bad)).toHaveLength(1);
  });
});

describe('buildGroupFamilyIndex et aggregateByFamily', () => {
  const groups = [
    group('PO1', 16, 'SOC'),
    group('PO2', 16, 'SOC-A'),
    group('PO3', 16, 'RE'),
    group('PO4', 16, 'NI'),
    group('PO5', 16, 'LIOT'),
  ];
  const { index, unmapped } = buildGroupFamilyIndex(groups, mapping);

  it('indexe les groupes rattachés et liste ceux qui manquent', () => {
    expect(index.get('PO2')).toBe('soc');
    expect(unmapped.map((g) => g.abbrev)).toEqual(['LIOT']);
  });

  it('additionne les groupes d’une même famille et ignore les autres', () => {
    const counts = aggregateByFamily(
      {
        groups: [
          { groupRef: 'PO1', members: 20, pour: 5, contre: 1, abstention: 2, nonVotants: 0, officialMajority: 'pour' },
          { groupRef: 'PO2', members: 10, pour: 3, contre: 0, abstention: 0, nonVotants: 1, officialMajority: 'pour' },
          { groupRef: 'PO5', members: 20, pour: 9, contre: 0, abstention: 0, nonVotants: 0, officialMajority: 'pour' },
        ],
      },
      index,
    );
    expect(counts).toEqual([
      { familyId: 'soc', pour: 8, contre: 1, abstention: 2, nonVotants: 1, members: 30, groupRefs: ['PO1', 'PO2'] },
    ]);
  });
});
