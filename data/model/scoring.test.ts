import { describe, expect, it } from 'vitest';
import {
  agreement,
  cohesion,
  majorityPosition,
  netScore,
  orient,
  reliabilityWeight,
  weightedScore,
} from '#data/model/scoring.ts';

// Chiffres du scrutin n° 8431 (XVIIe, 21 juillet 2026, réseaux sociaux et mineurs).
const rn = { pour: 0, contre: 2, abstention: 14 };
const epr = { pour: 83, contre: 0, abstention: 0 };
const lfi = { pour: 0, contre: 63, abstention: 0 };
const soc = { pour: 30, contre: 0, abstention: 28 };
const eco = { pour: 19, contre: 7, abstention: 7 };

describe('agreement', () => {
  it("compte l'abstention à moitié", () => {
    expect(agreement(rn, 'pour')).toBeCloseTo(7 / 16, 5);
    expect(agreement(soc, 'pour')).toBeCloseTo(44 / 58, 5);
    expect(agreement(eco, 'contre')).toBeCloseTo(10.5 / 33, 5);
  });
  it('est total ou nul sur un groupe unanime', () => {
    expect(agreement(epr, 'pour')).toBe(1);
    expect(agreement(lfi, 'pour')).toBe(0);
  });
  it("vaut null quand personne n'a voté", () => {
    expect(agreement({ pour: 0, contre: 0, abstention: 0 }, 'pour')).toBeNull();
  });
});

describe('netScore et cohesion', () => {
  it('calcule le score net', () => {
    expect(netScore(soc)).toBeCloseTo(30 / 58, 5);
    expect(netScore(lfi)).toBe(-1);
  });
  it('calcule la cohésion de Hix-Noury-Roland', () => {
    expect(cohesion(epr)).toBe(1);
    expect(cohesion(eco)).toBeCloseTo(12 / 33, 5);
    expect(cohesion(soc)).toBeCloseTo((30 - 14) / 58, 5);
  });
});

describe('majorityPosition', () => {
  it("retient l'abstention quand elle domine", () => {
    expect(majorityPosition(rn)).toBe('abstention');
  });
  it("renvoie null en cas d'égalité", () => {
    expect(majorityPosition({ pour: 5, contre: 5, abstention: 0 })).toBeNull();
  });
});

describe('reliabilityWeight', () => {
  it('est dégressif sous 25 % de participation', () => {
    expect(reliabilityWeight(16, 122)).toBeCloseTo(16 / 122 / 0.25, 5);
    expect(reliabilityWeight(58, 68)).toBe(1);
    expect(reliabilityWeight(0, 10)).toBe(0);
  });
});

describe('orient', () => {
  it('échange pour et contre quand « oui » signifie voter contre', () => {
    expect(orient(eco, 'contre')).toEqual({ pour: 7, contre: 19, abstention: 7 });
    expect(orient(eco, 'pour')).toBe(eco);
  });
});

describe('weightedScore', () => {
  it('pondère par fiabilité', () => {
    expect(
      weightedScore([
        { agreement: 0.5, weight: 1 },
        { agreement: 1, weight: 0.5 },
      ]),
    ).toBeCloseTo(2 / 3, 5);
  });
  it('ignore les items sans vote et renvoie null si rien à agréger', () => {
    expect(
      weightedScore([
        { agreement: null, weight: 1 },
        { agreement: 1, weight: 0 },
      ]),
    ).toBeNull();
    expect(weightedScore([])).toBeNull();
  });
});
