import { describe, expect, it } from 'vitest';
import {
  checkFiche,
  PLACEHOLDER,
  parseFiche,
  parseStatut,
  remainingPlaceholders,
  sameDossierGroups,
} from '#scripts/content/fiche.ts';
import { filled, skeleton } from '#scripts/content/fixtures.ts';

const options = {
  knownThemes: new Set(['numerique', 'enfance-jeunesse']),
  selectedUids: new Set(['VTANR5L17V8431']),
  fileName: 'VTANR5L17V8431.md',
};
describe('parseFiche', () => {
  it('lit l’en-tête, le titre, l’introduction et les sections', () => {
    const parsed = parseFiche(filled);
    expect(parsed.front.get('uid')).toBe('VTANR5L17V8431');
    expect(parsed.front.get('legislature')).toBe(17);
    expect(parsed.front.get('themes')).toEqual(['numerique']);
    expect(parsed.title).toBe('Faut-il interdire les réseaux sociaux aux moins de 15 ans ?');
    expect(parsed.intro).toBe('Le texte interdit l’inscription des moins de 15 ans sur les réseaux sociaux.');
    expect(parsed.sections.get('Pour')).toBe('- Selon les auteurs, protéger la santé mentale des adolescents.');
    expect(parsed.unreadable).toEqual([]);
    expect(parseStatut(parsed)).toBe('brouillon');
  });
  it('tolère des valeurs écrites à la main', () => {
    const parsed = parseFiche(
      '---\nuid: VTANR5L17V8431\nthemes: [numerique, sante]\nnote: "guillemet non fermé\nbad line\n---\n# Q ?\n',
    );
    expect(parsed.front.get('uid')).toBe('VTANR5L17V8431');
    expect(parsed.front.get('themes')).toEqual(['numerique', 'sante']);
    expect(parsed.unreadable).toEqual(['bad line']);
  });
});

describe('remainingPlaceholders', () => {
  it('couvre en-tête, titre, introduction et sections', () => {
    expect(remainingPlaceholders(parseFiche(skeleton))).toEqual([
      'question',
      'sens',
      'titre',
      'introduction',
      'Les grandes mesures',
      'Pour',
      'Contre',
      'Contexte',
    ]);
    expect(remainingPlaceholders(parseFiche(filled))).toEqual([]);
    expect(
      remainingPlaceholders(parseFiche(filled.replace('Le texte interdit', `${PLACEHOLDER} Le texte interdit`))),
    ).toEqual(['introduction']);
  });
});

describe('checkFiche', () => {
  it('accepte un gabarit en brouillon avec seulement des avertissements', () => {
    const result = checkFiche(parseFiche(skeleton), options);
    expect(result.problems).toEqual([]);
    expect(result.warnings.some((w) => w.startsWith('Champs encore à rédiger'))).toBe(true);
  });
  it('accepte une fiche entièrement rédigée', () => {
    expect(checkFiche(parseFiche(filled), options)).toEqual({ problems: [], warnings: [] });
  });
  it('bloque hors brouillon : champs à rédiger, sens invalide, thème inconnu, section manquante, sources absentes', () => {
    const relu = (md: string): string => md.replace('statut: "brouillon"', 'statut: "relu"');
    expect(
      checkFiche(parseFiche(relu(skeleton)), options).problems.some((p) => p.startsWith('Champs encore à rédiger')),
    ).toBe(true);
    const broken = relu(filled)
      .replace('sens: "pour"', 'sens: "oui"')
      .replace('themes: ["numerique"]', 'themes: ["inconnu"]')
      .replace('## Contexte', '## Historique')
      .replace(/^sources: .*$/m, 'sources: []');
    expect(checkFiche(parseFiche(broken), options).problems).toEqual(
      expect.arrayContaining([
        'En-tête : sens « oui » invalide (pour ou contre).',
        'Thèmes inconnus : inconnu.',
        'Section manquante : « Contexte ».',
        'Aucune source (en-tête « sources ») : chaque fiche doit lier ses sources.',
      ]),
    );
  });
  it('avertit sur la longueur, la double négation, le vocabulaire orienté et les listes trop courtes', () => {
    const long = `Faut-il ${'vraiment '.repeat(20)}interdire ?`;
    const md = filled
      .replace('question: "Faut-il interdire les réseaux sociaux aux moins de 15 ans ?"', `question: "${long}"`)
      .replace('# Faut-il interdire les réseaux sociaux aux moins de 15 ans ?', `# ${long}`)
      .replace(
        '- Interdiction d’inscription avant 15 ans.\n- Vérification de l’âge par les plateformes.',
        '- Une mesure de bon sens.',
      )
      .replace('- Pour les députés LFI, une mesure inefficace.', '');
    const { problems, warnings } = checkFiche(parseFiche(md), options);
    expect(problems).toEqual([]);
    expect(warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining('caractères (140 maximum souhaités)'),
        '« Les grandes mesures » liste 1 point(s), au moins deux attendus.',
        '« Contre » ne contient aucun argument.',
        '« Les grandes mesures » contient un vocabulaire possiblement orienté.',
      ]),
    );
    expect(
      checkFiche(
        parseFiche(
          filled.replace(
            /Faut-il interdire les réseaux sociaux aux moins de 15 ans \?/g,
            'Ne faut-il pas ne pas interdire ?',
          ),
        ),
        options,
      ).warnings,
    ).toContain('La question contient une double négation.');
  });
  it('vérifie la cohérence titre / question et le nom du fichier', () => {
    const result = checkFiche(parseFiche(filled.replace('# Faut-il interdire', '# Interdire')), {
      ...options,
      fileName: 'autre.md',
    });
    expect(result.problems).toEqual(
      expect.arrayContaining([
        "Le titre de niveau 1 ne reprend pas la question de l'en-tête.",
        'En-tête : uid VTANR5L17V8431 ne correspond pas au nom du fichier autre.md.',
      ]),
    );
  });
});

describe('sameDossierGroups', () => {
  const fiches = [
    { uid: 'A1', dossier: 'https://example.test/dossiers/a' },
    { uid: 'B', dossier: 'https://example.test/dossiers/b' },
    { uid: 'A2', dossier: 'https://example.test/dossiers/a' },
    { uid: 'C', dossier: null },
    { uid: 'D', dossier: null },
  ];
  it('repère les fiches qui partagent un dossier, sans regrouper celles qui n’en ont pas', () => {
    expect(sameDossierGroups(fiches, new Set())).toEqual([
      { dossier: 'https://example.test/dossiers/a', uids: ['A1', 'A2'] },
    ]);
  });
  it('tolère un groupe seulement si chacune de ses fiches est autorisée', () => {
    expect(sameDossierGroups(fiches, new Set(['A1', 'A2']))).toEqual([]);
    expect(sameDossierGroups(fiches, new Set(['A1']))).toHaveLength(1);
  });
});
