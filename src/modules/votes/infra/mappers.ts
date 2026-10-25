/** Du JSON brut (familles et bloc `votes` de chaque question) vers le domaine `votes`. */
import type { AppFamily, AppFamilyVote } from '#data/model/app-data.ts';
import type { Family } from '#src/modules/votes/domain/family.ts';
import type { FamilyVote } from '#src/modules/votes/domain/vote.ts';

export const toFamily = (raw: AppFamily, order: number): Family => ({
  id: raw.id,
  label: raw.label,
  shortLabel: raw.shortLabel,
  color: raw.color,
  order,
});

export const toFamilyVote = (questionId: string, raw: AppFamilyVote): FamilyVote => ({
  questionId,
  familyId: raw.familyId,
  pour: raw.pour,
  contre: raw.contre,
  abstention: raw.abstention,
  members: raw.members,
});
