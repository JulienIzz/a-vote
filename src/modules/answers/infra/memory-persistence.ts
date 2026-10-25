/** Persistance en mémoire : tests et prototypage. */
import type { AnswersState } from '#src/modules/answers/domain/answer.ts';
import type { AnswersPersistence } from '#src/modules/answers/domain/ports.ts';

export function createMemoryPersistence(
  initial: AnswersState | null = null,
): AnswersPersistence & { snapshot(): AnswersState | null } {
  let saved = initial;
  return {
    load: async () => saved,
    save: async (state) => {
      saved = state;
    },
    clear: async () => {
      saved = null;
    },
    snapshot: () => saved,
  };
}
