import { describe, expect, it } from 'vitest';
import type { Candidate } from '#scripts/content/ranking.ts';
import { isSelection, type Selection, splitNewCandidates } from '#scripts/content/selection.ts';

describe('isSelection', () => {
  it('accepte la forme attendue et refuse le reste', () => {
    expect(isSelection({ selected: [{ uid: 'A' }, { uid: 'B', note: 'x' }], rejected: ['C'] })).toBe(true);
    expect(isSelection({ selected: [], rejected: [], reviewedThrough: '2026-10-25' })).toBe(true);
    expect(isSelection({ selected: [], rejected: [], reviewedThrough: '25/10/2026' })).toBe(false);
    expect(isSelection({ selected: [{ uid: 'A', allowSameDossier: true }], rejected: [] })).toBe(true);
    expect(isSelection({ selected: [{ uid: 'A', allowSameDossier: 'oui' }], rejected: [] })).toBe(false);
    expect(isSelection({ selected: [{ uid: 1 }], rejected: [] })).toBe(false);
    expect(isSelection({ selected: [], rejected: [2] })).toBe(false);
    expect(isSelection(null)).toBe(false);
  });
});

/** Un texte classé, sa lecture principale puis les autres, chacune `uid@date`. */
const text = (main: string, ...others: string[]): Candidate => {
  const reading = (spec: string) => {
    const [uid = '', date = ''] = spec.split('@');
    return { uid, date };
  };
  const { uid, date } = reading(main);
  return {
    uid,
    date,
    otherReadings: others.map((spec) => ({
      ...reading(spec),
      legislature: 17,
      label: null,
      sourceUrl: '',
      score: 0,
    })),
  } as unknown as Candidate;
};

const selection = (selected: string[], rejected: string[], reviewedThrough?: string): Selection => ({
  selected: selected.map((uid) => ({ uid })),
  rejected,
  ...(reviewedThrough ? { reviewedThrough } : {}),
});

describe('splitNewCandidates', () => {
  it('écarte les textes dont une lecture est déjà retenue ou écartée', () => {
    const candidates = [text('A@2026-11-03'), text('B@2026-11-04', 'B1@2026-06-01'), text('C@2026-11-05')];
    const { fresh, newReadings } = splitNewCandidates(candidates, selection(['B1'], ['C']));
    expect(fresh.map((c) => c.uid)).toEqual(['A']);
    expect(newReadings).toEqual([{ candidate: candidates[1], decided: 'selected', uids: ['B'] }]);
  });

  it('ne garde que les textes votés après reviewedThrough, dans l’ordre du classement', () => {
    const candidates = [text('OLD@2026-09-30'), text('NEW@2026-11-02'), text('MIX@2026-10-01', 'MIX2@2026-11-10')];
    const { fresh } = splitNewCandidates(candidates, selection([], [], '2026-10-25'));
    expect(fresh.map((c) => c.uid)).toEqual(['NEW', 'MIX']);
  });

  it('ne signale pas les lectures antérieures à la lecture tranchée', () => {
    const candidates = [text('FINAL@2026-07-21', 'FIRST@2026-03-01'), text('R@2026-02-01', 'R2@2026-11-15')];
    const { fresh, newReadings } = splitNewCandidates(candidates, selection(['FINAL'], ['R']));
    expect(fresh).toEqual([]);
    expect(newReadings).toEqual([{ candidate: candidates[1], decided: 'rejected', uids: ['R2'] }]);
  });
});
