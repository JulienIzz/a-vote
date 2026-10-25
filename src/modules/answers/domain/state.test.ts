import { describe, expect, it } from 'vitest';
import {
  answer,
  answersInOrder,
  currentQuestionId,
  extendDeck,
  goBack,
  initialAnswersState,
  isComplete,
  progress,
  skip,
  startDeck,
} from '#src/modules/answers/domain/state.ts';
import { createAnswersStore } from '#src/modules/answers/domain/store.ts';
import { createMemoryPersistence } from '#src/modules/answers/infra/memory-persistence.ts';

const t = '2026-10-25T10:00:00.000Z';

describe('transitions', () => {
  it('démarre un jeu, répond, passe, avance et termine', () => {
    let s = startDeck(initialAnswersState(), ['q1', 'q2', 'q3']);
    expect(currentQuestionId(s)).toBe('q1');
    s = answer(s, 'q1', 'oui', t);
    s = skip(s, 'q2', t);
    expect(currentQuestionId(s)).toBe('q3');
    expect(progress(s)).toEqual({ done: 2, total: 3 });
    expect(isComplete(s)).toBe(false);
    s = answer(s, 'q3', 'non', t);
    expect(isComplete(s)).toBe(true);
    expect(answersInOrder(s).map((a) => a.value)).toEqual(['oui', 'passe', 'non']);
  });
  it('ignore une question hors jeu et permet de revenir corriger', () => {
    let s = startDeck(initialAnswersState(), ['q1', 'q2']);
    expect(answer(s, 'zz', 'oui', t)).toBe(s);
    s = answer(s, 'q1', 'oui', t);
    s = goBack(s);
    expect(currentQuestionId(s)).toBe('q1');
    s = answer(s, 'q1', 'non', t);
    expect(s.answers.q1?.value).toBe('non');
    expect(currentQuestionId(s)).toBe('q2');
  });
  it('prolonge un jeu terminé sans perdre les réponses, et reprend à la suite', () => {
    let s = startDeck(initialAnswersState(), ['q1', 'q2']);
    s = answer(s, 'q1', 'oui', t);
    s = answer(s, 'q2', 'non', t);
    expect(extendDeck(s, ['q2'])).toBe(s);
    s = extendDeck(s, ['q3', 'q2', 'q4', 'q3']);
    expect(s.deck).toEqual(['q1', 'q2', 'q3', 'q4']);
    expect(isComplete(s)).toBe(false);
    expect(currentQuestionId(s)).toBe('q3');
    expect(progress(s)).toEqual({ done: 2, total: 4 });
    s = answer(s, 'q3', 'oui', t);
    s = answer(s, 'q4', 'passe', t);
    expect(isComplete(s)).toBe(true);
    expect(answersInOrder(s).map((a) => a.value)).toEqual(['oui', 'non', 'oui', 'passe']);
  });
});

describe('createAnswersStore', () => {
  it('notifie les abonnés, persiste chaque changement et se réhydrate', async () => {
    const persistence = createMemoryPersistence();
    const store = createAnswersStore({ persistence, now: () => t });
    const seen: number[] = [];
    store.subscribe((s) => seen.push(s.cursor));
    store.startDeck(['q1', 'q2']);
    store.answer('q1', 'oui');
    await Promise.resolve();
    expect(seen).toEqual([0, 1]);
    expect(persistence.snapshot()?.answers.q1?.answeredAt).toBe(t);

    const again = createAnswersStore({ persistence });
    await again.hydrate();
    expect(currentQuestionId(again.getState())).toBe('q2');
    await again.reset();
    expect(persistence.snapshot()).toBeNull();
    expect(again.getState().deck).toEqual([]);
  });
});
