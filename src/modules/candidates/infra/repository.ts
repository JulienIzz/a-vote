import type { AppCandidates } from '#data/model/app-data.ts';
import type { CandidateRepository } from '#src/modules/candidates/domain/ports.ts';
import { toCandidateList } from '#src/modules/candidates/infra/mappers.ts';

export function createCandidateRepository(raw: AppCandidates): CandidateRepository {
  const list = toCandidateList(raw);
  return { list: () => list };
}
