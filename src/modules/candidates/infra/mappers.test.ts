import { describe, expect, it } from 'vitest';
import type { AppCandidate } from '#data/model/app-data.ts';
import { createCandidateRepository } from '#src/modules/candidates/infra/repository.ts';

const raw = (id: string, lastName: string): AppCandidate => ({
  id,
  firstName: 'Prénom',
  lastName,
  party: 'Parti',
  partyShort: 'P',
  declaredAt: '2026-03-01',
  declaration: { label: 'Le Journal', url: 'https://journal.example/a' },
  note: null,
  programme: null,
  website: 'https://site.example',
  photo: null,
});

describe('createCandidateRepository', () => {
  it('expose la liste dans l’ordre du fichier, avec les portraits et les désignations en cours', () => {
    const repo = createCandidateRepository({
      election: 'Élection présidentielle 2027',
      checkedAt: '2026-10-29',
      candidates: [
        raw('b', 'Bernard'),
        {
          ...raw('a', 'André'),
          photo: {
            src: '/candidats/a.jpg',
            author: 'Auteur',
            licence: 'CC BY 4.0',
            source: 'https://commons.example/a',
          },
        },
      ],
      pending: ['Une primaire'],
    });
    const list = repo.list();
    expect(list.election).toBe('Élection présidentielle 2027');
    expect(list.candidates.map((c) => c.id)).toEqual(['b', 'a']);
    expect(list.candidates[0]?.photo).toBeNull();
    expect(list.candidates[1]?.photo?.licence).toBe('CC BY 4.0');
    expect(list.pending).toEqual(['Une primaire']);
  });
});
