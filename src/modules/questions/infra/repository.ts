/** Dépôt en mémoire construit depuis le JSON brut ; la source statique est branchée dans data-source.ts. */
import type { AppQuestionDetail, AppQuestionIndex, AppTheme } from '#data/model/app-data.ts';
import type { QuestionRepository } from '#src/modules/questions/domain/ports.ts';
import type { QuestionDetail } from '#src/modules/questions/domain/question.ts';
import { toQuestion, toQuestionDetail, toTheme } from '#src/modules/questions/infra/mappers.ts';

/** Charge le détail brut d'une question ; undefined si elle n'en a pas. */
export type DetailLoader = (id: string) => Promise<AppQuestionDetail | undefined>;

export function createQuestionRepository(
  rawQuestions: readonly AppQuestionIndex[],
  rawThemes: readonly AppTheme[],
  loadDetail: DetailLoader,
): QuestionRepository {
  const questions = rawQuestions.map(toQuestion);
  const byId = new Map(questions.map((q) => [q.id, q]));
  const themes = rawThemes.map(toTheme);
  // Un seul chargement par question, même si l'écran et le préchargement le demandent en même temps.
  const details = new Map<string, Promise<QuestionDetail | undefined>>();
  const detail = (id: string): Promise<QuestionDetail | undefined> => {
    if (!byId.has(id)) return Promise.resolve(undefined);
    const cached = details.get(id);
    if (cached) return cached;
    const loading = loadDetail(id).then((raw) => (raw ? toQuestionDetail(raw) : undefined));
    // Un échec (réseau coupé) n'est pas mémorisé : la prochaine demande réessaie.
    loading.catch(() => details.delete(id));
    details.set(id, loading);
    return loading;
  };
  return {
    all: () => [...questions],
    byId: (id) => byId.get(id),
    detail,
    themes: () => [...themes],
  };
}
