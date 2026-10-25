/**
 * Le vote d'une famille politique sur un scrutin, et ce qu'on en dit à l'écran :
 * position dominante, part de votants, fiabilité. Les formules viennent de data/model.
 */
import { cohesion, expressedTotal, majorityPosition, netScore, reliabilityWeight } from '#data/model/scoring.ts';

export interface FamilyVote {
  questionId: string;
  familyId: string;
  pour: number;
  contre: number;
  abstention: number;
  /** Effectif du groupe le jour du vote. */
  members: number;
}

/** Position lisible d'une famille : dominante ou partagée, ou absente si personne n'a voté. */
export type Position = 'pour' | 'contre' | 'abstention' | 'partage' | 'absent';

export interface VoteSummary {
  familyId: string;
  position: Position;
  /** pour + contre + abstention. */
  expressed: number;
  /** Part des membres qui ont voté, dans [0, 1]. */
  participation: number;
  /** Score net dans [-1, 1], null si personne n'a voté. */
  net: number | null;
  /** Cohésion dans [0, 1], null si personne n'a voté. */
  cohesion: number | null;
  /** Vrai quand moins d'un quart des membres a voté : la position repose sur peu de députés. */
  lowTurnout: boolean;
}

/** Seuil de cohésion sous lequel une famille est dite partagée. */
export const SPLIT_COHESION = 0.6;

export const participationOf = (vote: FamilyVote): number =>
  vote.members > 0 ? expressedTotal(vote) / vote.members : 0;

export function positionOf(vote: FamilyVote): Position {
  const expressed = expressedTotal(vote);
  if (expressed === 0) return 'absent';
  const c = cohesion(vote) ?? 0;
  const majority = majorityPosition(vote);
  if (majority === null || c < SPLIT_COHESION) return 'partage';
  return majority;
}

export function summarize(vote: FamilyVote): VoteSummary {
  const expressed = expressedTotal(vote);
  return {
    familyId: vote.familyId,
    position: positionOf(vote),
    expressed,
    participation: participationOf(vote),
    net: netScore(vote),
    cohesion: cohesion(vote),
    lowTurnout: reliabilityWeight(expressed, vote.members) < 1,
  };
}
