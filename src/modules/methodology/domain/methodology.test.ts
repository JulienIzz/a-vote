import { describe, expect, it } from 'vitest';
import {
  describeDataset,
  formatBytes,
  formatDate,
  slugify,
  splitSections,
} from '#src/modules/methodology/domain/methodology.ts';
import { createMethodologyRepository } from '#src/modules/methodology/infra/repository.ts';

describe('formatage', () => {
  it('écrit les tailles et les dates à la française', () => {
    expect(formatBytes(null)).toBeNull();
    expect(formatBytes(512)).toBe('512 o');
    expect(formatBytes(20_480)).toBe('20 ko');
    expect(formatBytes(28_199_162)).toBe('26,9 Mo');
    expect(formatDate('2026-10-25T11:25:49.000Z')).toBe('25 octobre 2026');
    expect(formatDate('pas une date')).toBeNull();
  });
  it('décrit un jeu de données en une ligne', () => {
    const dataset = {
      name: 'Scrutins de la XVIIe législature',
      url: 'https://x',
      licence: 'LO 2.0',
      bytes: 28_199_162,
      modifiedAt: '2026-10-25T11:25:49.000Z',
    };
    expect(describeDataset(dataset)).toBe('Scrutins de la XVIIe législature, 26,9 Mo, archive du 25 octobre 2026');
    expect(describeDataset({ ...dataset, bytes: null, modifiedAt: null })).toBe('Scrutins de la XVIIe législature');
  });
});

describe('createMethodologyRepository', () => {
  it('expose la méthode et la provenance', () => {
    const repo = createMethodologyRepository(
      { title: 'Comment les scores sont calculés', markdown: '# Comment…' },
      {
        importedAt: '2026-10-25T18:31:06.874Z',
        datasets: [],
        website: 'https://www.assemblee-nationale.fr',
        repository: null,
      },
    );
    expect(repo.methodology().title).toBe('Comment les scores sont calculés');
    expect(repo.provenance().importedAt).toBe('2026-10-25T18:31:06.874Z');
  });
});

describe('splitSections', () => {
  it('retire le titre, garde le chapeau et découpe aux titres de niveau 2', () => {
    const { intro, sections } = splitSections(
      "# Comment ça marche\n\nLe chapeau.\n\n## Les données\n\nTexte.\n\n### Détail\n\nPlus.\n\n## L'IA\n\n- un point\n",
    );
    expect(intro).toBe('Le chapeau.');
    expect(sections.map((s) => s.title)).toEqual(['Les données', "L'IA"]);
    expect(sections[0]?.body).toBe('Texte.\n\n### Détail\n\nPlus.');
    expect(sections[1]?.id).toBe('l-ia');
  });
  it('fabrique des ancres sans accents', () => {
    expect(slugify('Le calcul de votre accord')).toBe('le-calcul-de-votre-accord');
    expect(slugify('Transparence et utilisation de l’IA')).toBe('transparence-et-utilisation-de-l-ia');
  });
});
