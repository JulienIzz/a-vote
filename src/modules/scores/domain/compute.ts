/**
 * Calcul des scores à partir des réponses, des questions (pour le sens) et des votes par famille.
 * Les formules élémentaires viennent de data/model, décrites dans data/content/METHODE.md.
 */
import { agreement as agreementOf, orient, reliabilityWeight, weightedScore } from '#data/model/scoring.ts';
import type { Answer } from '#src/modules/answers/domain/answer.ts';
import type { Question } from '#src/modules/questions/domain/question.ts';
import type { Confidence, FamilyScore, QuestionContribution, ScoreResult } from '#src/modules/scores/domain/score.ts';
import type { Family } from '#src/modules/votes/domain/family.ts';
import type { FamilyVote } from '#src/modules/votes/domain/vote.ts';

export interface ScoreInput {
  answers: readonly Answer[];
  /** Retrouve une question par identifiant, pour son sens. */
  question: (id: string) => Question | undefined;
  /** Les votes des familles sur une question. */
  votesFor: (questionId: string) => readonly FamilyVote[];
  families: readonly Family[];
}

export interface QuestionAgreement {
  familyId: string;
  /** Accord dans [0, 1] sur cette question, null si la famille n'a pas voté. */
  agreement: number | null;
  /** Poids de fiabilité dans [0, 1]. */
  weight: number;
}

/** L'accord de chaque famille avec une réponse « oui » ou « non » à une question, après application du sens. */
export function agreementsForQuestion(
  question: Pick<Question, 'sens'>,
  votes: readonly FamilyVote[],
  value: 'oui' | 'non',
): QuestionAgreement[] {
  const userSide = value === 'oui' ? 'pour' : 'contre';
  return votes.map((vote) => {
    // Répondre « oui » à une question de sens « contre » revient à voter contre : on retourne le décompte.
    const oriented = orient(vote, question.sens);
    const expressed = oriented.pour + oriented.contre + oriented.abstention;
    return {
      familyId: vote.familyId,
      agreement: agreementOf(oriented, userSide),
      weight: reliabilityWeight(expressed, vote.members),
    };
  });
}

/** Confiance : il faut assez de questions, et des votes assez suivis, pour que le score veuille dire quelque chose. */
export function confidenceOf(questionsCounted: number, weightSum: number): Confidence {
  if (questionsCounted === 0) return 'basse';
  const averageWeight = weightSum / questionsCounted;
  if (questionsCounted >= 5 && averageWeight >= 0.75) return 'haute';
  if (questionsCounted >= 3 && averageWeight >= 0.5) return 'moyenne';
  return 'basse';
}

export function computeScores(input: ScoreInput): ScoreResult {
  const contributions: QuestionContribution[] = [];
  let answeredCount = 0;
  for (const a of input.answers) {
    if (a.value === 'passe') continue;
    const question = input.question(a.questionId);
    if (!question) continue;
    answeredCount += 1;
    for (const { familyId, agreement, weight } of agreementsForQuestion(
      question,
      input.votesFor(a.questionId),
      a.value,
    )) {
      contributions.push({ questionId: a.questionId, familyId, agreement, weight });
    }
  }

  const families: FamilyScore[] = input.families.map((family) => {
    const own = contributions.filter((c) => c.familyId === family.id && c.agreement !== null);
    const weightSum = own.reduce((sum, c) => sum + c.weight, 0);
    return {
      familyId: family.id,
      agreement: weightedScore(own),
      questionsCounted: own.length,
      weightSum,
      confidence: confidenceOf(own.length, weightSum),
    };
  });
  const ranked = [...families].sort((a, b) => {
    if (a.agreement === null) return b.agreement === null ? 0 : 1;
    if (b.agreement === null) return -1;
    return b.agreement - a.agreement;
  });
  return { families, ranked, contributions, answeredCount };
}
