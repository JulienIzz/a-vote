import { describe, expect, it } from 'vitest';
import {
  buildDeck,
  countByTheme,
  filterByThemes,
  isPublishable,
  seededRandom,
} from '#src/modules/questions/domain/deck.ts';
import type { Question } from '#src/modules/questions/domain/question.ts';
import { rawQuestion, rawQuestionDraft } from '#src/modules/questions/infra/fixtures.ts';
import { toQuestion } from '#src/modules/questions/infra/mappers.ts';

const base = toQuestion(rawQuestion);
const make = (id: string, themes: string[]): Question => ({ ...base, id, themes });
const questions = [
  make('a1', ['agriculture']),
  make('a2', ['agriculture']),
  make('a3', ['agriculture']),
  make('s1', ['sante']),
  make('s2', ['sante', 'agriculture']),
  make('i1', ['immigration']),
  make('x1', []),
];

describe('filtres', () => {
  it('écarte les brouillons et filtre par thème', () => {
    expect(isPublishable(toQuestion(rawQuestionDraft))).toBe(false);
    expect(filterByThemes(questions, ['sante']).map((q) => q.id)).toEqual(['s1', 's2']);
    expect(filterByThemes(questions, [])).toHaveLength(7);
    expect(countByTheme(questions).get('agriculture')).toBe(4);
  });
});

describe('buildDeck', () => {
  it('alterne entre les thèmes sans répéter une question', () => {
    const deck = buildDeck(questions, { size: 5 });
    expect(deck.map((q) => q.id)).toEqual(['a1', 's1', 'i1', 'x1', 'a2']);
  });
  it('inclut les brouillons sur demande', () => {
    const draft = { ...make('d1', ['sante']), status: 'brouillon' as const };
    expect(buildDeck([draft])).toEqual([]);
    expect(buildDeck([draft], { includeDrafts: true }).map((q) => q.id)).toEqual(['d1']);
  });
  it('se limite aux thèmes demandés et à la taille', () => {
    expect(buildDeck(questions, { themes: ['sante'], size: 10 }).map((q) => q.id)).toEqual(['s1', 's2']);
  });
  it('écarte les questions déjà posées', () => {
    expect(buildDeck(questions, { size: 3, exclude: ['a1', 's1', 'x1'] }).map((q) => q.id)).toEqual(['a2', 's2', 'i1']);
    expect(buildDeck(questions, { exclude: questions.map((q) => q.id) })).toEqual([]);
  });
  it('est reproductible avec une graine', () => {
    const a = buildDeck(questions, { seed: 42 }).map((q) => q.id);
    const b = buildDeck(questions, { seed: 42 }).map((q) => q.id);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(7);
    const r = seededRandom(1);
    expect(r()).toBeGreaterThanOrEqual(0);
    expect(r()).toBeLessThan(1);
  });
});
