/**
 * Persistance sur un stockage clé-valeur : localStorage sur le web, AsyncStorage sur mobile.
 * Les deux exposent la même interface asynchrone minimale.
 */
import type { AnswersState } from '#src/modules/answers/domain/answer.ts';
import type { AnswersPersistence } from '#src/modules/answers/domain/ports.ts';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

export const ANSWERS_STORAGE_KEY = 'a-vote.answers.v1';

const isAnswersState = (value: unknown): value is AnswersState =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as AnswersState).deck) &&
  typeof (value as AnswersState).cursor === 'number' &&
  typeof (value as AnswersState).answers === 'object';

export function createKeyValuePersistence(storage: KeyValueStorage, key = ANSWERS_STORAGE_KEY): AnswersPersistence {
  return {
    load: async () => {
      const raw = await storage.getItem(key);
      if (raw === null) return null;
      try {
        const parsed: unknown = JSON.parse(raw);
        return isAnswersState(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    save: async (state) => {
      await storage.setItem(key, JSON.stringify(state));
    },
    clear: async () => {
      await storage.removeItem(key);
    },
  };
}

/** Le localStorage du navigateur s'il est disponible, sinon null (rendu côté serveur, navigation privée stricte). */
export function webStorage(): KeyValueStorage | null {
  try {
    const candidate = (globalThis as { localStorage?: KeyValueStorage }).localStorage;
    return candidate ?? null;
  } catch {
    return null;
  }
}
