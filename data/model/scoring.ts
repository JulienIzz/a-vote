import type { Position } from '#data/model/types.ts';

export type UserAnswer = 'pour' | 'contre';

export interface ExpressedCounts {
  pour: number;
  contre: number;
  abstention: number;
}

/** Suffrages exprimés au sens large : pour + contre + abstention. Les non-votants sont ignorés. */
export function expressedTotal(c: ExpressedCounts): number {
  return c.pour + c.contre + c.abstention;
}

/**
 * Part des votants du groupe qui sont du côté de l'utilisateur,
 * l'abstention comptant pour moitié. `null` si personne n'a voté.
 */
export function agreement(c: ExpressedCounts, answer: UserAnswer, abstentionWeight = 0.5): number | null {
  const n = expressedTotal(c);
  if (n === 0) return null;
  const side = answer === 'pour' ? c.pour : c.contre;
  return (side + abstentionWeight * c.abstention) / n;
}

/** Score net du groupe dans [-1, 1] : +1 unanimement pour, -1 unanimement contre, 0 partagé ou abstention. */
export function netScore(c: ExpressedCounts): number | null {
  const n = expressedTotal(c);
  if (n === 0) return null;
  return (c.pour - c.contre) / n;
}

/** Indice de cohésion de Hix, Noury et Roland, dans [0, 1]. Celui utilisé par Datan. */
export function cohesion(c: ExpressedCounts): number | null {
  const n = expressedTotal(c);
  if (n === 0) return null;
  const max = Math.max(c.pour, c.contre, c.abstention);
  return (max - 0.5 * (n - max)) / n;
}

/** Position la plus votée. `null` si personne n'a voté ou en cas d'égalité. */
export function majorityPosition(c: ExpressedCounts): Position | null {
  if (expressedTotal(c) === 0) return null;
  const ranked: Array<[Position, number]> = [
    ['pour', c.pour],
    ['contre', c.contre],
    ['abstention', c.abstention],
  ];
  ranked.sort((a, b) => b[1] - a[1]);
  const [first, second] = ranked;
  if (!first || !second) return null;
  return first[1] === second[1] ? null : first[0];
}

/**
 * Poids de fiabilité d'un vote de groupe : plein dès que `fullParticipation`
 * des membres ont voté, dégressif en dessous. 0 si le groupe n'a pas voté.
 */
export function reliabilityWeight(expressed: number, members: number, fullParticipation = 0.25): number {
  if (members <= 0 || expressed <= 0) return 0;
  return Math.min(1, expressed / members / fullParticipation);
}

/**
 * Oriente un décompte selon le sens de la question : si répondre « oui »
 * correspond à voter contre le scrutin (motion de rejet, amendement de suppression…),
 * on échange pour et contre.
 */
export function orient(c: ExpressedCounts, yesMeans: UserAnswer): ExpressedCounts {
  return yesMeans === 'pour' ? c : { pour: c.contre, contre: c.pour, abstention: c.abstention };
}

export interface ScoredItem {
  agreement: number | null;
  weight: number;
}

/** Moyenne pondérée des accords. `null` si aucun item exploitable. */
export function weightedScore(items: readonly ScoredItem[]): number | null {
  let num = 0;
  let den = 0;
  for (const it of items) {
    if (it.agreement === null || it.weight <= 0) continue;
    num += it.weight * it.agreement;
    den += it.weight;
  }
  return den === 0 ? null : num / den;
}
