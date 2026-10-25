/** Ce que le domaine attend de l'infrastructure. */
import type { Question, QuestionDetail, Theme } from '#src/modules/questions/domain/question.ts';

export interface QuestionRepository {
  all(): Question[];
  byId(id: string): Question | undefined;
  /** Le détail d'une question, chargé à la demande puis gardé en mémoire ; undefined si la question est inconnue. */
  detail(id: string): Promise<QuestionDetail | undefined>;
  themes(): Theme[];
}
