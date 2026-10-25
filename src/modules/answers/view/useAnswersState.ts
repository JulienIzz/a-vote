import { useSyncExternalStore } from 'react';
import type { AnswersState } from '#src/modules/answers/domain/answer.ts';
import type { AnswersStore } from '#src/modules/answers/domain/store.ts';

/** Abonne un composant React à l'état des réponses. */
export function useAnswersState(store: AnswersStore): AnswersState {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}
