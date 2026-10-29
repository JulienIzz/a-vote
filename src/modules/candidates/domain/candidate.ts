/** Les candidatures déclarées à l'élection présidentielle, et le lien vers leur programme. */
import { shuffle } from '#src/modules/questions/domain/deck.ts';

export interface Link {
  label: string;
  url: string;
}

export interface Photo {
  src: string;
  author: string;
  licence: string;
  /** Page de l'image, pour le crédit. */
  source: string;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  party: string;
  partyShort: string | null;
  /** Date ISO (AAAA-MM-JJ) de l'annonce ou de la désignation, null si la source ne l'atteste pas. */
  declaredAt: string | null;
  declaration: Link;
  note: string | null;
  /** Le programme publié, null tant qu'il ne l'est pas. */
  programme: Link | null;
  website: string | null;
  photo: Photo | null;
}

export interface CandidateList {
  election: string;
  /** Date ISO de la dernière vérification de la liste. */
  checkedAt: string;
  /** Dans l'ordre du fichier : l'écran les tire au hasard (`shuffled`). */
  candidates: Candidate[];
  pending: string[];
}

export const fullName = (candidate: Candidate): string => `${candidate.firstName} ${candidate.lastName}`;

/**
 * Un ordre tiré au hasard, pour qu'aucune candidature ne soit toujours en tête : même l'ordre alphabétique
 * avantage les premiers noms. `random` est injectable pour les tests.
 */
export const shuffled = (candidates: readonly Candidate[], random: () => number = Math.random): Candidate[] =>
  shuffle(candidates, random);

/** « JM » pour Jean-Michel Martin, quand il n'y a pas de portrait. */
export function initials(candidate: Candidate): string {
  const first = candidate.firstName.split(/[\s-]+/).map((part) => part.charAt(0));
  return `${first.join('')}${candidate.lastName.charAt(0)}`.toUpperCase();
}

/** Le lien à mettre en avant : le programme s'il est publié, sinon le site de campagne, sinon rien. */
export function mainLink(candidate: Candidate): { kind: 'programme' | 'site'; url: string } | null {
  if (candidate.programme) return { kind: 'programme', url: candidate.programme.url };
  return candidate.website ? { kind: 'site', url: candidate.website } : null;
}

/** « example.fr », pour afficher un site sans protocole ni « www. ». */
export function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
