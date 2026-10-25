import { normalizeText } from '#scripts/text.ts';
/** Thème tel que défini dans content/themes.json. */
export interface ThemeDefinition {
  id: string;
  label: string;
  /** Mots-clés sans accents ; une étoile finale accepte toute terminaison (agricol* → agricoles). */
  keywords: string[];
}

export interface ThemesFile {
  themes: ThemeDefinition[];
}

export interface CompiledKeyword {
  keyword: string;
  regex: RegExp;
}

export interface CompiledTheme {
  id: string;
  label: string;
  keywords: CompiledKeyword[];
}

/** Correspondance entre un texte et un mot-clé. Toutes sont conservées pour expliquer le classement. */
export interface ThemeMatch {
  themeId: string;
  keyword: string;
}

/**
 * Normalise un texte pour la comparaison : minuscules, sans diacritiques,
 * ligatures et apostrophes typographiques ramenées à l'ASCII, espaces compactés.
 */

const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/g;
const escapeRegex = (s: string): string => s.replace(REGEX_SPECIALS, '\\$&');
const isWordChar = (c: string | undefined): boolean => c !== undefined && /\w/.test(c);

/**
 * Compile un mot-clé en expression régulière à frontières de mot :
 * `viol` ne reconnaît pas « violences », `femme*` reconnaît « femmes ».
 * Une étoile (finale ou interne) accepte toute suite de caractères de mot.
 */
export function compileKeyword(keyword: string): RegExp {
  const normalized = normalizeText(keyword);
  if (normalized === '') throw new Error(`Mot-clé vide : « ${keyword} »`);
  const body = normalized.split('*').map(escapeRegex).join('\\w*');
  const start = isWordChar(normalized[0]) ? '\\b' : '';
  const last = normalized.at(-1);
  const end = last === '*' || !isWordChar(last) ? '' : '\\b';
  return new RegExp(`${start}${body}${end}`);
}

export function compileThemes(themes: readonly ThemeDefinition[]): CompiledTheme[] {
  return themes.map((theme) => ({
    id: theme.id,
    label: theme.label,
    keywords: theme.keywords.map((keyword) => ({ keyword, regex: compileKeyword(keyword) })),
  }));
}

/** Toutes les correspondances mot-clé / thème trouvées dans le texte, dans l'ordre des thèmes. */
export function classify(text: string, compiled: readonly CompiledTheme[]): ThemeMatch[] {
  const normalized = normalizeText(text);
  const matches: ThemeMatch[] = [];
  for (const theme of compiled) {
    for (const { keyword, regex } of theme.keywords) {
      if (regex.test(normalized)) matches.push({ themeId: theme.id, keyword });
    }
  }
  return matches;
}
