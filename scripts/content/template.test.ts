import { describe, expect, it } from 'vitest';
import { buildBrief } from '#scripts/content/brief.ts';
import { PLACEHOLDER, SECTION_TITLES } from '#scripts/content/fiche.ts';
import { context, families, scrutin, sources } from '#scripts/content/fixtures.ts';
import { renderScaffold } from '#scripts/content/template.ts';

describe('buildBrief', () => {
  it('rassemble faits, votes, consigne, thèmes, sources et pistes', () => {
    const brief = buildBrief({
      scrutin,
      context,
      families,
      themes: [{ id: 'numerique', label: 'Numérique' }],
      editorialNote: 'Mentionner la vérification d’âge.',
    });
    expect(brief).toContain('# Brief VTANR5L17V8431');
    expect(brief).toContain('| La France insoumise | 0 | 63 | 0 | 71 | -1.00 |');
    expect(brief).toContain('Mentionner la vérification d’âge.');
    expect(brief).toContain('- numerique : Numérique');
    expect(brief).toContain('Compte rendu de la séance');
    expect(brief).toContain('## Ce que le brief ne contient pas');
    expect(brief).toContain('### Exposé des motifs du texte déposé');
    expect(brief).toContain('articles introuvables');
  });
  it('signale un exposé des motifs manquant', () => {
    const brief = buildBrief({
      scrutin,
      context: { ...context, exposeDesMotifs: null },
      families,
      themes: [],
      editorialNote: null,
    });
    expect(brief).toContain('Exposé des motifs : introuvable');
  });
});

describe('renderScaffold', () => {
  const md = renderScaffold({
    scrutin,
    context,
    families,
    themes: ['numerique'],
    toCheck: ['Collecte : articles introuvables'],
    sources,
  });

  it('remplit les faits et laisse les champs éditoriaux à rédiger', () => {
    expect(md.startsWith('---\nuid: "VTANR5L17V8431"\n')).toBe(true);
    expect(md).toContain(`question: "${PLACEHOLDER}"`);
    expect(md).toContain(`sens: "${PLACEHOLDER}"`);
    expect(md).toContain('themes: ["numerique"]');
    expect(md).toContain('statut: "brouillon"');
    expect(md).toContain(
      'sources: ["https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip", "https://www.assemblee-nationale.fr/dyn/17/scrutins/8431"',
    );
    expect(md).toContain(`# ${PLACEHOLDER}`);
  });
  it('contient toutes les sections dans l’ordre, le tableau des votes et les liens libellés', () => {
    const headings = [...md.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(headings).toEqual(SECTION_TITLES);
    expect(md).toContain('| Rassemblement national | 0 | 2 | 14 | 13 % |');
    expect(md).toContain('- Collecte : articles introuvables');
    expect(md).toContain(
      '[Document brut du texte (exposé des motifs et articles)](https://www.assemblee-nationale.fr/dyn/docs/PIONANR5L17B2107.raw)',
    );
  });
});
