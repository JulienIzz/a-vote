import type { CandidateList } from '#src/modules/candidates/domain/candidate.ts';

export interface CandidateRepository {
  list(): CandidateList;
}
