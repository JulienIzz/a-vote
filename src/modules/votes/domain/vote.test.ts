import { describe, expect, it } from 'vitest';
import { rawQuestion } from '#src/modules/questions/infra/fixtures.ts';
import { positionOf, summarize } from '#src/modules/votes/domain/vote.ts';
import { createVoteRepository } from '#src/modules/votes/infra/repository.ts';

const families = [
  { id: 'lfi', label: 'LFI', shortLabel: 'LFI', color: '#c00' },
  { id: 'soc', label: 'SOC', shortLabel: 'SOC', color: '#f8b' },
  { id: 'epr', label: 'EPR', shortLabel: 'EPR', color: '#74a' },
  { id: 'rn', label: 'RN', shortLabel: 'RN', color: '#335' },
];
const repo = createVoteRepository(families, [rawQuestion]);
const votes = repo.forQuestion('VTANR5L17V8431');
const vote = (familyId: string) => votes.find((v) => v.familyId === familyId);

describe('createVoteRepository', () => {
  it('ordonne les familles et les votes comme le référentiel', () => {
    expect(repo.families().map((f) => [f.id, f.order])).toEqual([
      ['lfi', 0],
      ['soc', 1],
      ['epr', 2],
      ['rn', 3],
    ]);
    expect(votes.map((v) => v.familyId)).toEqual(['lfi', 'soc', 'epr', 'rn']);
    expect(repo.forQuestion('inconnue')).toEqual([]);
    expect(repo.family('rn')?.color).toBe('#335');
  });
});

describe('positionOf et summarize', () => {
  it('lit une position dominante, une abstention et un groupe partagé', () => {
    expect(positionOf(vote('epr') as never)).toBe('pour');
    expect(positionOf(vote('rn') as never)).toBe('abstention');
    expect(positionOf(vote('soc') as never)).toBe('partage');
    expect(positionOf({ questionId: 'q', familyId: 'x', pour: 0, contre: 0, abstention: 0, members: 10 })).toBe(
      'absent',
    );
  });
  it('signale les votes à faible participation', () => {
    const rn = summarize(vote('rn') as never);
    expect(rn.expressed).toBe(16);
    expect(rn.participation).toBeCloseTo(16 / 122, 5);
    expect(rn.lowTurnout).toBe(true);
    const soc = summarize(vote('soc') as never);
    expect(soc.lowTurnout).toBe(false);
    expect(soc.net).toBeCloseTo(30 / 58, 5);
    expect(soc.cohesion).toBeCloseTo(16 / 58, 5);
  });
});
