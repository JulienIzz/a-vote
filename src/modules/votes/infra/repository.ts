import type { AppFamily, AppQuestionIndex } from '#data/model/app-data.ts';
import type { VoteRepository } from '#src/modules/votes/domain/ports.ts';
import { toFamily, toFamilyVote } from '#src/modules/votes/infra/mappers.ts';

export function createVoteRepository(
  rawFamilies: readonly AppFamily[],
  rawQuestions: readonly AppQuestionIndex[],
): VoteRepository {
  const families = rawFamilies.map(toFamily);
  const byId = new Map(families.map((f) => [f.id, f]));
  const order = new Map(families.map((f) => [f.id, f.order]));
  const votes = new Map(
    rawQuestions.map((q) => [
      q.uid,
      q.votes
        .map((v) => toFamilyVote(q.uid, v))
        .sort((a, b) => (order.get(a.familyId) ?? 99) - (order.get(b.familyId) ?? 99)),
    ]),
  );
  return {
    families: () => [...families],
    family: (id) => byId.get(id),
    forQuestion: (questionId) => [...(votes.get(questionId) ?? [])],
  };
}
