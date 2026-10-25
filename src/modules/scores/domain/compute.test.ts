import { describe, expect, it } from 'vitest';
import type { Answer } from '#src/modules/answers/domain/answer.ts';
import { rawQuestion, rawQuestionDraft } from '#src/modules/questions/infra/fixtures.ts';
import { toQuestion } from '#src/modules/questions/infra/mappers.ts';
import { agreementsForQuestion, computeScores, confidenceOf } from '#src/modules/scores/domain/compute.ts';
import { createVoteRepository } from '#src/modules/votes/infra/repository.ts';

const families = [
  { id: 'lfi', label: 'LFI', shortLabel: 'LFI', color: '#c00' },
  { id: 'soc', label: 'SOC', shortLabel: 'SOC', color: '#f8b' },
  { id: 'epr', label: 'EPR', shortLabel: 'EPR', color: '#74a' },
  { id: 'rn', label: 'RN', shortLabel: 'RN', color: '#335' },
];
const questions = new Map(
  [toQuestion(rawQuestion), toQuestion({ ...rawQuestionDraft, sens: 'contre' })].map((q) => [q.id, q]),
);
const votes = createVoteRepository(families, [rawQuestion, { ...rawQuestionDraft, sens: 'contre' }]);
const input = {
  question: (id: string) => questions.get(id),
  votesFor: (id: string) => votes.forQuestion(id),
  families: votes.families(),
};
const at = '2026-10-25T10:00:00.000Z';
const a = (questionId: string, value: Answer['value']): Answer => ({ questionId, value, answeredAt: at });

describe('computeScores', () => {
  it('retrouve les accords de l’exemple de la méthode (réponse « oui », sens « pour »)', () => {
    const result = computeScores({ ...input, answers: [a('VTANR5L17V8431', 'oui')] });
    const by = Object.fromEntries(result.families.map((f) => [f.familyId, f.agreement]));
    expect(by.epr).toBe(1);
    expect(by.lfi).toBe(0);
    expect(by.soc).toBeCloseTo(44 / 58, 5);
    expect(by.rn).toBeCloseTo(7 / 16, 5);
    expect(result.ranked.map((f) => f.familyId)).toEqual(['epr', 'soc', 'rn', 'lfi']);
    expect(result.answeredCount).toBe(1);
    expect(result.contributions.find((c) => c.familyId === 'rn')?.weight).toBeCloseTo(16 / 122 / 0.25, 5);
  });
  it('retourne le décompte quand le sens est « contre », et ignore les passes', () => {
    // Sens « contre » : répondre oui = voter contre ; LFI a voté pour à l'unanimité → désaccord total.
    const contre = computeScores({ ...input, answers: [a('VTANR5L16V1462', 'oui')] });
    expect(contre.families.find((f) => f.familyId === 'lfi')?.agreement).toBe(0);
    expect(contre.families.find((f) => f.familyId === 'rn')?.agreement).toBeNull();

    const both = computeScores({
      ...input,
      answers: [a('VTANR5L17V8431', 'oui'), a('VTANR5L16V1462', 'oui'), a('zz', 'passe')],
    });
    // LFI : 0 sur les deux questions → 0 ; EPR n'a voté que sur la première → 1.
    expect(both.families.find((f) => f.familyId === 'lfi')).toMatchObject({ agreement: 0, questionsCounted: 2 });
    expect(both.families.find((f) => f.familyId === 'epr')).toMatchObject({ agreement: 1, questionsCounted: 1 });
    expect(both.answeredCount).toBe(2);
  });
  it('donne une confiance selon le nombre de questions et leur fiabilité', () => {
    expect(confidenceOf(0, 0)).toBe('basse');
    expect(confidenceOf(5, 4)).toBe('haute');
    expect(confidenceOf(3, 1.6)).toBe('moyenne');
    expect(confidenceOf(5, 1)).toBe('basse');
    const single = computeScores({ ...input, answers: [a('VTANR5L17V8431', 'non')] });
    expect(single.families.every((f) => f.confidence === 'basse')).toBe(true);
  });
});

describe('agreementsForQuestion', () => {
  it('donne l’accord de chaque famille pour une réponse, sens compris', () => {
    const oui = agreementsForQuestion({ sens: 'pour' }, votes.forQuestion('VTANR5L17V8431'), 'oui');
    expect(oui.find((a) => a.familyId === 'soc')?.agreement).toBeCloseTo(44 / 58, 5);
    const non = agreementsForQuestion({ sens: 'contre' }, votes.forQuestion('VTANR5L17V8431'), 'non');
    // sens « contre » et réponse « non » = voter pour : même accord que « oui » avec le sens « pour »
    expect(non.find((a) => a.familyId === 'soc')?.agreement).toBeCloseTo(44 / 58, 5);
    expect(non.find((a) => a.familyId === 'rn')?.weight).toBeCloseTo(16 / 122 / 0.25, 5);
  });
});
