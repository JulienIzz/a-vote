/**
 * La source de données embarquée. L'index (questions.json) et les thèmes sont importés statiquement ;
 * le texte long de chaque fiche (fiches/<uid>.json) devient un fichier à part, chargé à la demande.
 */
import rawQuestions from '#data/app/questions.json';
import rawThemes from '#data/app/themes.json';
import type { AppQuestionDetail, AppQuestionIndex, AppTheme } from '#data/model/app-data.ts';
import { createQuestionRepository } from '#src/modules/questions/infra/repository.ts';

const fiches = import.meta.glob<AppQuestionDetail>('/data/app/fiches/*.json', { import: 'default' });

export const questionRepository = createQuestionRepository(
  rawQuestions as AppQuestionIndex[],
  rawThemes as AppTheme[],
  async (id) => fiches[`/data/app/fiches/${id}.json`]?.(),
);
