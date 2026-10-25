/** Du JSON brut de data/app vers le domaine `questions`. */
import type { AppQuestionDetail, AppQuestionIndex, AppTheme } from '#data/model/app-data.ts';
import type { Question, QuestionDetail, Theme } from '#src/modules/questions/domain/question.ts';

export function toQuestion(raw: AppQuestionIndex): Question {
  return {
    id: raw.uid,
    text: raw.question,
    sens: raw.sens,
    summary: raw.summary,
    themes: [...raw.themes],
    status: raw.statut,
    scrutin: {
      uid: raw.uid,
      legislature: raw.legislature,
      date: raw.date,
      officialTitle: raw.officialTitle,
      result: raw.result,
      totals: { ...raw.totals },
      url: raw.urls.scrutin,
    },
  };
}

export function toQuestionDetail(raw: AppQuestionDetail): QuestionDetail {
  return {
    measures: [...raw.measures],
    argumentsFor: [...raw.pour],
    argumentsAgainst: [...raw.contre],
    context: raw.context,
    sources: raw.sources.map((s) => ({ label: s.label, url: s.url })),
  };
}

export const toTheme = (raw: AppTheme): Theme => ({ id: raw.id, label: raw.label });
