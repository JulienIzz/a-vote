/** Du JSON brut (candidats.json) vers le domaine `candidates`. */
import type { AppCandidate, AppCandidates } from '#data/model/app-data.ts';
import type { Candidate, CandidateList } from '#src/modules/candidates/domain/candidate.ts';

export const toCandidate = (raw: AppCandidate): Candidate => ({
  id: raw.id,
  firstName: raw.firstName,
  lastName: raw.lastName,
  party: raw.party,
  partyShort: raw.partyShort,
  declaredAt: raw.declaredAt,
  declaration: { label: raw.declaration.label, url: raw.declaration.url },
  note: raw.note,
  programme: raw.programme ? { label: raw.programme.label, url: raw.programme.url } : null,
  website: raw.website,
  photo: raw.photo
    ? { src: raw.photo.src, author: raw.photo.author, licence: raw.photo.licence, source: raw.photo.source }
    : null,
});

export const toCandidateList = (raw: AppCandidates): CandidateList => ({
  election: raw.election,
  checkedAt: raw.checkedAt,
  candidates: raw.candidates.map(toCandidate),
  pending: [...raw.pending],
});
