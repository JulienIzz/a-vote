import { describe, expect, it } from 'vitest';
import {
  type Candidate,
  displayHost,
  fullName,
  initials,
  mainLink,
  shuffled,
} from '#src/modules/candidates/domain/candidate.ts';
import { seededRandom } from '#src/modules/questions/domain/deck.ts';

const candidate = (over: Partial<Candidate>): Candidate => ({
  id: 'x',
  firstName: 'Marie',
  lastName: 'Martin',
  party: 'Parti',
  partyShort: null,
  declaredAt: '2026-01-01',
  declaration: { label: 'Le Journal', url: 'https://journal.example/article' },
  note: null,
  programme: null,
  website: 'https://www.marie-martin.example/',
  photo: null,
  ...over,
});

describe('shuffled', () => {
  const list = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => candidate({ id }));

  it('garde toutes les candidatures, sans modifier la liste reçue', () => {
    const result = shuffled(list, seededRandom(42));
    expect(result.map((c) => c.id).sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(list.map((c) => c.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });
  it('change d’ordre d’un tirage à l’autre', () => {
    const orders = new Set(
      [1, 2, 3, 4, 5].map((seed) =>
        shuffled(list, seededRandom(seed))
          .map((c) => c.id)
          .join(''),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });
  it('met chaque candidature en tête à peu près aussi souvent', () => {
    const random = seededRandom(7);
    const firsts = new Map<string, number>();
    for (let i = 0; i < 6000; i++) {
      const id = shuffled(list, random)[0]?.id ?? '';
      firsts.set(id, (firsts.get(id) ?? 0) + 1);
    }
    for (const count of firsts.values()) expect(Math.abs(count - 1000)).toBeLessThan(150);
  });
});

describe('liens', () => {
  it('met en avant le programme s’il est publié, sinon le site, sinon rien', () => {
    expect(mainLink(candidate({}))).toEqual({ kind: 'site', url: 'https://www.marie-martin.example/' });
    const withProgramme = candidate({ programme: { label: 'Le projet', url: 'https://x.example/projet' } });
    expect(mainLink(withProgramme)).toEqual({ kind: 'programme', url: 'https://x.example/projet' });
    expect(mainLink(candidate({ website: null }))).toBeNull();
  });
  it('affiche un site sans protocole ni www', () => {
    expect(displayHost('https://www.marie-martin.example/projet')).toBe('marie-martin.example');
    expect(displayHost('pas une url')).toBe('pas une url');
  });
});

describe('noms', () => {
  it('écrit le nom complet', () => {
    expect(fullName(candidate({}))).toBe('Marie Martin');
  });
  it('tire les initiales, prénoms composés compris', () => {
    expect(initials(candidate({}))).toBe('MM');
    expect(initials(candidate({ firstName: 'Jean-Luc', lastName: 'Mélenchon' }))).toBe('JLM');
    expect(initials(candidate({ firstName: 'Édouard', lastName: 'Philippe' }))).toBe('ÉP');
  });
});
