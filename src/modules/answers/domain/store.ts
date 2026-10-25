/**
 * Store minimal, sans dépendance : état courant, abonnement, et les actions du domaine.
 * La vue s'y branchera (hook React) ; la persistance est injectée.
 */
import type { AnswersState, AnswerValue } from '#src/modules/answers/domain/answer.ts';
import type { AnswersPersistence } from '#src/modules/answers/domain/ports.ts';
import {
  answer,
  extendDeck,
  goBack,
  initialAnswersState,
  reset,
  skip,
  startDeck,
} from '#src/modules/answers/domain/state.ts';

export type Listener<S> = (state: S) => void;

export interface Store<S> {
  getState(): S;
  setState(updater: (state: S) => S): void;
  subscribe(listener: Listener<S>): () => void;
}

export function createStore<S>(initial: S): Store<S> {
  let state = initial;
  const listeners = new Set<Listener<S>>();
  return {
    getState: () => state,
    setState: (updater) => {
      const next = updater(state);
      if (next === state) return;
      state = next;
      for (const listener of listeners) listener(state);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export interface AnswersStore extends Store<AnswersState> {
  /** Recharge l'état sauvegardé, s'il existe. */
  hydrate(): Promise<void>;
  startDeck(questionIds: readonly string[]): void;
  /** Ajoute des questions à la suite du jeu en cours, sans oublier les réponses. */
  extendDeck(questionIds: readonly string[]): void;
  answer(questionId: string, value: AnswerValue): void;
  skip(questionId: string): void;
  goBack(): void;
  reset(): Promise<void>;
}

export interface AnswersStoreOptions {
  persistence?: AnswersPersistence;
  /** Horloge injectable, pour les tests. */
  now?: () => string;
}

export function createAnswersStore(options: AnswersStoreOptions = {}): AnswersStore {
  const store = createStore(initialAnswersState());
  const now = options.now ?? (() => new Date().toISOString());
  const persist = (): void => {
    void options.persistence?.save(store.getState()).catch(() => undefined);
  };
  const apply = (updater: (state: AnswersState) => AnswersState): void => {
    store.setState(updater);
    persist();
  };
  return {
    ...store,
    hydrate: async () => {
      const saved = await options.persistence?.load();
      if (saved) store.setState(() => saved);
    },
    startDeck: (ids) => apply((s) => startDeck(s, ids)),
    extendDeck: (ids) => apply((s) => extendDeck(s, ids)),
    answer: (id, value) => apply((s) => answer(s, id, value, now())),
    skip: (id) => apply((s) => skip(s, id, now())),
    goBack: () => apply(goBack),
    reset: async () => {
      store.setState(reset);
      await options.persistence?.clear();
    },
  };
}
