import { describe, expect, it } from 'vitest';
import type { Scrutin } from '#data/model/types.ts';
import {
  buildCandidate,
  type Candidate,
  compareCandidates,
  familyStats,
  isCandidate,
  rankScore,
  weightedStdDev,
} from '#scripts/content/ranking.ts';
import { compileThemes } from '#scripts/content/themes.ts';
import { renderMarkdown } from '#scripts/steps/shortlist.ts';

const baseScrutin: Scrutin = {
  uid: 'VTANR5L17V100',
  legislature: 17,
  numero: 100,
  date: '2025-03-01',
  title: "l'ensemble du projet de loi pour contrôler l'immigration (première lecture).",
  kind: 'ensemble',
  textType: 'projet-de-loi',
  voteType: 'SPO',
  solemn: false,
  result: 'adopte',
  dossierRef: null,
  dossierTitle: null,
  totals: { pour: 97, contre: 60, abstention: 10, nonVotants: 1, votants: 167, exprimes: 157 },
  groups: [
    { groupRef: 'G-EPR', members: 90, pour: 80, contre: 0, abstention: 0, nonVotants: 0, officialMajority: 'pour' },
    { groupRef: 'G-LFI', members: 70, pour: 0, contre: 60, abstention: 0, nonVotants: 1, officialMajority: 'contre' },
    { groupRef: 'G-SOC', members: 60, pour: 10, contre: 0, abstention: 10, nonVotants: 0, officialMajority: null },
    { groupRef: 'G-HOR', members: 30, pour: 2, contre: 0, abstention: 0, nonVotants: 0, officialMajority: 'pour' },
    { groupRef: 'G-NI', members: 10, pour: 5, contre: 0, abstention: 0, nonVotants: 0, officialMajority: 'pour' },
    { groupRef: 'G-RN', members: 100, pour: 0, contre: 0, abstention: 0, nonVotants: 0, officialMajority: null },
  ],
  sourceUrl: 'https://www.assemblee-nationale.fr/dyn/17/scrutins/100',
};
const scrutin = (patch: Partial<Scrutin>): Scrutin => ({ ...baseScrutin, ...patch });

// G-NI n'est volontairement pas indexé : il doit être ignoré.
const index = new Map([
  ['G-LFI', 'lfi'],
  ['G-SOC', 'soc'],
  ['G-EPR', 'epr'],
  ['G-HOR', 'hor'],
  ['G-RN', 'rn'],
]);
const familyOrder = ['lfi', 'soc', 'epr', 'hor', 'rn'];

describe('isCandidate', () => {
  it("retient les votes sur l'ensemble et les scrutins solennels", () => {
    expect(isCandidate(baseScrutin, false)).toBe(true);
    expect(isCandidate(scrutin({ kind: 'autre', solemn: true, voteType: 'SPS' }), false)).toBe(true);
  });
  it('écarte les motions de censure et les motions de procédure', () => {
    expect(isCandidate(scrutin({ kind: 'motion', voteType: 'MOC' }), true)).toBe(false);
    expect(isCandidate(scrutin({ kind: 'motion' }), true)).toBe(false);
    expect(isCandidate(scrutin({ kind: 'ensemble', voteType: 'MOC' }), true)).toBe(false);
  });
  it('ne retient les autres natures que si --all-kinds et au moins 250 votants', () => {
    const amendment = scrutin({ kind: 'amendement', totals: { ...baseScrutin.totals, votants: 300 } });
    expect(isCandidate(amendment, false)).toBe(false);
    expect(isCandidate(amendment, true)).toBe(true);
    expect(isCandidate(scrutin({ kind: 'article', totals: { ...baseScrutin.totals, votants: 249 } }), true)).toBe(
      false,
    );
  });
});

describe('weightedStdDev', () => {
  it('vaut 0 sans élément ou avec des poids nuls', () => {
    expect(weightedStdDev([])).toBe(0);
    expect(
      weightedStdDev([
        { value: 1, weight: 0 },
        { value: -1, weight: 0 },
      ]),
    ).toBe(0);
  });
  it('se ramène à l’écart-type classique à poids égaux', () => {
    expect(
      weightedStdDev([
        { value: 1, weight: 1 },
        { value: -1, weight: 1 },
      ]),
    ).toBeCloseTo(1, 10);
    expect(
      weightedStdDev([
        { value: 2, weight: 3 },
        { value: 2, weight: 1 },
      ]),
    ).toBe(0);
  });
  it('tient compte des poids', () => {
    // moyenne = (3·1 + 1·(-1)) / 4 = 0,5 ; variance = (3·0,25 + 1·2,25) / 4 = 0,75
    expect(
      weightedStdDev([
        { value: 1, weight: 3 },
        { value: -1, weight: 1 },
      ]),
    ).toBeCloseTo(Math.sqrt(0.75), 10);
  });
});

describe('rankScore', () => {
  const base = {
    discriminance: 0.5,
    participation: 0.5,
    textType: 'projet-de-loi',
    kind: 'ensemble',
    solemn: false,
    hasTheme: true,
  } as const;
  it('vaut la discriminance quand tous les facteurs sont à 1', () => {
    expect(rankScore(base)).toBeCloseTo(0.5, 10);
  });
  it('pénalise une participation sous 35 %', () => {
    expect(rankScore({ ...base, participation: 0.175 })).toBeCloseTo(0.25, 10);
    expect(rankScore({ ...base, participation: 0.9 })).toBeCloseTo(0.5, 10);
  });
  it('applique les facteurs de type de texte', () => {
    expect(rankScore({ ...base, textType: 'proposition-de-loi' })).toBeCloseTo(0.5, 10);
    expect(rankScore({ ...base, textType: 'proposition-de-resolution' })).toBeCloseTo(0.4, 10);
    expect(rankScore({ ...base, textType: 'declaration-du-gouvernement' })).toBeCloseTo(0.35, 10);
  });
  it('applique les facteurs de nature de vote', () => {
    expect(rankScore({ ...base, kind: 'autre', solemn: true })).toBeCloseTo(0.45, 10);
    expect(rankScore({ ...base, kind: 'ensemble', solemn: true })).toBeCloseTo(0.5, 10);
    expect(rankScore({ ...base, kind: 'amendement' })).toBeCloseTo(0.35, 10);
  });
  it('pénalise l’absence de thème et multiplie les facteurs', () => {
    expect(rankScore({ ...base, hasTheme: false })).toBeCloseTo(0.3, 10);
    expect(
      rankScore({ ...base, hasTheme: false, kind: 'article', textType: 'autre', participation: 0.07 }),
    ).toBeCloseTo(0.5 * 0.2 * 0.7 * 0.7 * 0.6, 10);
  });
});

describe('familyStats', () => {
  const stats = familyStats(baseScrutin, index, familyOrder);
  const byId = new Map(stats.map((s) => [s.familyId, s]));

  it('suit l’ordre des familles du mapping et ignore les groupes non rattachés', () => {
    expect(stats.map((s) => s.familyId)).toEqual(['lfi', 'soc', 'epr', 'hor', 'rn']);
  });
  it('calcule exprimés, participation, net, cohésion et poids', () => {
    expect(byId.get('lfi')).toEqual({
      familyId: 'lfi',
      pour: 0,
      contre: 60,
      abstention: 0,
      expressed: 60,
      members: 70,
      participation: 60 / 70,
      net: -1,
      cohesion: 1,
      weight: 1,
    });
    const soc = byId.get('soc');
    expect(soc?.expressed).toBe(20);
    expect(soc?.net).toBeCloseTo(0.5, 10);
    expect(soc?.cohesion).toBeCloseTo(0.25, 10);
    expect(soc?.weight).toBe(1);
  });
  it('dégrade le poids d’une famille dont peu de membres ont voté', () => {
    const hor = byId.get('hor');
    expect(hor?.net).toBe(1);
    expect(hor?.participation).toBeCloseTo(2 / 30, 10);
    expect(hor?.weight).toBeCloseTo(2 / 30 / 0.25, 10);
  });
  it('renvoie net et cohésion null quand personne n’a voté', () => {
    expect(byId.get('rn')).toMatchObject({ expressed: 0, participation: 0, net: null, cohesion: null, weight: 0 });
  });
  it('met participation à 0 pour une famille sans effectif', () => {
    const empty = scrutin({
      groups: [
        { groupRef: 'G-LFI', members: 0, pour: 0, contre: 0, abstention: 0, nonVotants: 0, officialMajority: null },
      ],
    });
    expect(familyStats(empty, index, familyOrder)[0]?.participation).toBe(0);
  });
});

describe('buildCandidate', () => {
  const themes = compileThemes([
    { id: 'immigration', label: 'Immigration', keywords: ['immigration', 'etrangers'] },
    { id: 'sante', label: 'Santé', keywords: ['sante'] },
  ]);
  const candidate = buildCandidate(baseScrutin, index, familyOrder, themes);

  it('classe le scrutin par thème et mot-clé', () => {
    expect(candidate.themes).toEqual(['immigration']);
    expect(candidate.keywords).toEqual(['immigration']);
  });
  it('calcule discriminance, participation et score', () => {
    const expected = weightedStdDev([
      { value: -1, weight: 1 },
      { value: 0.5, weight: 1 },
      { value: 1, weight: 1 },
      { value: 1, weight: 2 / 30 / 0.25 },
    ]);
    expect(candidate.discriminance).toBeCloseTo(expected, 10);
    expect(candidate.participation).toBeCloseTo(167 / 577, 10);
    // Participation 29 % < 35 % : score = discriminance × (167/577)/0,35.
    expect(candidate.score).toBeCloseTo(expected * (167 / 577 / 0.35), 10);
  });
  it('utilise le titre du dossier pour la classification', () => {
    const withDossier = buildCandidate(
      scrutin({ dossierTitle: 'Accès aux soins et santé' }),
      index,
      familyOrder,
      themes,
    );
    expect(withDossier.themes).toEqual(['immigration', 'sante']);
  });
  it('vaut 0 quand une seule famille a voté', () => {
    const single = scrutin({ groups: baseScrutin.groups.filter((g) => g.groupRef === 'G-LFI') });
    expect(buildCandidate(single, index, familyOrder, themes).score).toBe(0);
  });
});

describe('compareCandidates et renderMarkdown', () => {
  const themes = compileThemes([{ id: 'immigration', label: 'Immigration', keywords: ['immigration'] }]);
  const a = buildCandidate(baseScrutin, index, familyOrder, themes);
  const b: Candidate = { ...a, uid: 'VTANR5L17V101', score: a.score + 1, title: 'titre | avec barre' };

  it('trie par score décroissant', () => {
    expect([a, b].sort(compareCandidates).map((c) => c.uid)).toEqual(['VTANR5L17V101', 'VTANR5L17V100']);
  });
  it('produit un tableau Markdown avec familles signées et barres échappées', () => {
    const md = renderMarkdown(
      [b, a],
      new Map([
        ['lfi', 'LFI'],
        ['epr', 'EPR'],
      ]),
      { allKinds: false, themes: null },
      new Date('2026-01-01T00:00:00Z'),
    );
    expect(md).toContain('| # | Score | Date | Lég. | Votants | Thèmes | Titre | Familles |');
    expect(md).toContain('[titre \\| avec barre](https://www.assemblee-nationale.fr/dyn/17/scrutins/100)');
    expect(md).toContain('LFI -1.00 · soc +0.50 · EPR +1.00 · hor +1.00\\*');
    expect(md).not.toContain('rn ');
    expect(md).toContain('\\* moins de 25 % des membres ont voté');
  });
});
