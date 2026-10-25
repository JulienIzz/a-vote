/** Transitions pures de l'état des réponses, et sélecteurs pour l'interface. */
import type { Answer, AnswersState, AnswerValue } from '#src/modules/answers/domain/answer.ts';

export const initialAnswersState = (): AnswersState => ({ deck: [], cursor: 0, answers: {} });

/** Démarre un jeu : l'ordre des questions est fixé, les réponses précédentes sont oubliées. */
export const startDeck = (_state: AnswersState, questionIds: readonly string[]): AnswersState => ({
  deck: [...questionIds],
  cursor: 0,
  answers: {},
});

/**
 * Prolonge le jeu en cours avec de nouvelles questions, à la suite : les réponses déjà données sont
 * gardées et le parcours reprend à la première question ajoutée. Les questions déjà au jeu sont ignorées.
 */
export function extendDeck(state: AnswersState, questionIds: readonly string[]): AnswersState {
  const added = [...new Set(questionIds)].filter((id) => !state.deck.includes(id));
  if (added.length === 0) return state;
  return { ...state, deck: [...state.deck, ...added], cursor: state.deck.length };
}

/** Répond à la question courante (ou à une question déjà vue) et avance d'un cran si c'est la courante. */
export function answer(state: AnswersState, questionId: string, value: AnswerValue, now: string): AnswersState {
  if (!state.deck.includes(questionId)) return state;
  const next: Answer = { questionId, value, answeredAt: now };
  const isCurrent = state.deck[state.cursor] === questionId;
  return {
    ...state,
    cursor: isCurrent ? Math.min(state.cursor + 1, state.deck.length) : state.cursor,
    answers: { ...state.answers, [questionId]: next },
  };
}

export const skip = (state: AnswersState, questionId: string, now: string): AnswersState =>
  answer(state, questionId, 'passe', now);

/** Revient à la question précédente sans effacer sa réponse, pour la modifier. */
export const goBack = (state: AnswersState): AnswersState => ({ ...state, cursor: Math.max(0, state.cursor - 1) });

export const reset = (): AnswersState => initialAnswersState();

// ---------------------------------------------------------------- sélecteurs

export const currentQuestionId = (state: AnswersState): string | undefined => state.deck[state.cursor];

export const isComplete = (state: AnswersState): boolean => state.deck.length > 0 && state.cursor >= state.deck.length;

export interface Progress {
  /** Questions répondues ou passées. */
  done: number;
  total: number;
}

export const progress = (state: AnswersState): Progress => ({
  done: state.deck.filter((id) => state.answers[id] !== undefined).length,
  total: state.deck.length,
});

/** Les réponses dans l'ordre du jeu, passes comprises. */
export const answersInOrder = (state: AnswersState): Answer[] =>
  state.deck.flatMap((id) => (state.answers[id] ? [state.answers[id] as Answer] : []));
