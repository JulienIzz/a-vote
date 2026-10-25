import { describe, expect, it } from 'vitest';
import { classify, compileKeyword, compileThemes, type ThemeDefinition } from '#scripts/content/themes.ts';
import { normalizeText } from '#scripts/text.ts';

describe('normalizeText', () => {
  it('retire accents et casse, compacte les espaces', () => {
    expect(normalizeText('  Égalité   entre les Femmes\net les Hommes ')).toBe(
      'egalite entre les femmes et les hommes',
    );
  });
  it('ramène ligatures et apostrophes typographiques à l’ASCII', () => {
    expect(normalizeText('cœur, Œuvre, ex æquo')).toBe('coeur, oeuvre, ex aequo');
    expect(normalizeText('pouvoir d’achat')).toBe("pouvoir d'achat");
  });
});

describe('compileKeyword', () => {
  it('respecte les frontières de mot', () => {
    const viol = compileKeyword('viol');
    expect(viol.test('le viol et les viols')).toBe(true);
    expect(viol.test('les violences faites aux femmes')).toBe(false);
    expect(viol.test('violon')).toBe(false);
  });
  it('accepte toute terminaison après une étoile finale', () => {
    const femme = compileKeyword('femme*');
    expect(femme.test('les femmes')).toBe(true);
    expect(femme.test('une femme')).toBe(true);
    expect(femme.test('sage-femme')).toBe(true);
    expect(femme.test('affermer')).toBe(false);
  });
  it('accepte une étoile interne', () => {
    const agression = compileKeyword('agression* sexuelle*');
    expect(agression.test('les agressions sexuelles')).toBe(true);
    expect(agression.test("l'agression sexuelle")).toBe(true);
    expect(compileKeyword('video*surveillance').test('la videosurveillance')).toBe(true);
  });
  it('échappe les caractères spéciaux', () => {
    const article = compileKeyword('49.3');
    expect(article.test('recours au 49.3 par le gouvernement')).toBe(true);
    expect(article.test('4903')).toBe(false);
  });
  it('refuse un mot-clé vide', () => {
    expect(() => compileKeyword('  ')).toThrow();
  });
});

const themes: ThemeDefinition[] = [
  { id: 'droits-des-femmes', label: 'Droits des femmes', keywords: ['femme*', 'ivg', 'parite'] },
  { id: 'violences-sexuelles', label: 'Violences sexuelles', keywords: ['viol', 'viols', 'violences sexuelles'] },
  { id: 'immigration', label: 'Immigration', keywords: ['immigration', 'etrangers'] },
];
const compiled = compileThemes(themes);

describe('classify', () => {
  it('ignore accents et casse et renvoie toutes les correspondances', () => {
    const matches = classify(
      "l'ensemble du projet de loi constitutionnelle relatif à la liberté de recourir à l’IVG et à la PARITÉ",
      compiled,
    );
    expect(matches).toEqual([
      { themeId: 'droits-des-femmes', keyword: 'ivg' },
      { themeId: 'droits-des-femmes', keyword: 'parite' },
    ]);
  });
  it('peut rattacher un texte à plusieurs thèmes', () => {
    const matches = classify('lutte contre les violences sexuelles faites aux femmes étrangères', compiled);
    expect(matches.map((m) => m.themeId)).toEqual(['droits-des-femmes', 'violences-sexuelles']);
    expect(matches.map((m) => m.keyword)).toEqual(['femme*', 'violences sexuelles']);
  });
  it('ne confond pas un mot avec un mot plus long', () => {
    expect(classify('les violences routières', compiled)).toEqual([]);
  });
  it('renvoie un tableau vide pour un texte sans thème', () => {
    expect(classify("l'ensemble du projet de loi de règlement du budget", compiled)).toEqual([]);
    expect(classify('', compiled)).toEqual([]);
  });
});
