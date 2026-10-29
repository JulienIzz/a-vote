import rawCandidats from '#data/app/candidats.json';
import type { AppCandidates } from '#data/model/app-data.ts';
import { createCandidateRepository } from '#src/modules/candidates/infra/repository.ts';

export const candidateRepository = createCandidateRepository(rawCandidats as AppCandidates);
