import { describe, expect, it } from 'vitest';
import { labelForSource, toSourceLinks } from '#data/model/sources.ts';

describe('labelForSource', () => {
  it('reconnaît les pages de l’Assemblée et l’open data', () => {
    expect(
      labelForSource(
        'https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip',
      ),
    ).toContain('Open data');
    expect(labelForSource('https://www.assemblee-nationale.fr/dyn/17/scrutins/8431')).toBe(
      'Le scrutin sur assemblee-nationale.fr',
    );
    expect(labelForSource('https://www.assemblee-nationale.fr/dyn/17/dossiers/x')).toBe('Le dossier législatif');
    expect(labelForSource('https://www.assemblee-nationale.fr/dyn/docs/PIONANR5L17B2107.raw')).toContain(
      'Document brut',
    );
    expect(labelForSource('https://www.senat.fr/leg/ppl24-123.html')).toBe('Sur le site du Sénat');
  });
});

describe('toSourceLinks', () => {
  it('dédoublonne et ignore les vides', () => {
    const links = toSourceLinks(['https://a.test/1', '', 'https://a.test/1', ' https://a.test/2 ']);
    expect(links.map((l) => l.url)).toEqual(['https://a.test/1', 'https://a.test/2']);
  });
});
