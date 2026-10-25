import type { AnswersState } from '#src/modules/answers/domain/answer.ts';

/** Sauvegarde locale de l'état des réponses (appareil ou navigateur). */
export interface AnswersPersistence {
  load(): Promise<AnswersState | null>;
  save(state: AnswersState): Promise<void>;
  clear(): Promise<void>;
}
