import type { Family } from '#src/modules/votes/domain/family.ts';
import type { FamilyVote } from '#src/modules/votes/domain/vote.ts';

export interface VoteRepository {
  /** Toutes les familles, dans l'ordre d'affichage. */
  families(): Family[];
  family(id: string): Family | undefined;
  /** Les votes des familles sur une question, dans l'ordre d'affichage ; vide si la question est inconnue. */
  forQuestion(questionId: string): FamilyVote[];
}
