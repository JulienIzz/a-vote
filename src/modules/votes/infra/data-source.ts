import rawFamilies from '#data/app/families.json';
import rawQuestions from '#data/app/questions.json';
import type { AppFamily, AppQuestionIndex } from '#data/model/app-data.ts';
import { createVoteRepository } from '#src/modules/votes/infra/repository.ts';

export const voteRepository = createVoteRepository(rawFamilies as AppFamily[], rawQuestions as AppQuestionIndex[]);
