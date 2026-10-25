/**
 * Normalisations de texte partagées par les parseurs, le classifieur de thèmes et le classement.
 * Trois niveaux : `tidy*` garde les accents (titres affichés), `normalizeText` les retire (comparaisons),
 * `significantWords` ne garde que les mots porteurs de sens (clés de rapprochement).
 */

export const foldAccents = (text: string): string =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae');

export const tidyApostrophes = (text: string): string => text.replace(/[’‘`]/g, "'");

export const collapseSpaces = (text: string): string => text.replace(/\s+/g, ' ').trim();

/** Titre propre à afficher : apostrophes droites, espaces compactés, accents conservés. */
export const tidyTitle = (text: string): string => collapseSpaces(tidyApostrophes(text));

/** Forme de comparaison : minuscules, sans accents ni apostrophes typographiques, espaces compactés. */
export const normalizeText = (text: string): string => collapseSpaces(tidyApostrophes(foldAccents(text.toLowerCase())));

/** Mots-outils du français ignorés dans les comparaisons de titres. */
export const STOP_WORDS: ReadonlySet<string> = new Set([
  'l',
  'le',
  'la',
  'les',
  'de',
  'du',
  'des',
  'd',
  'un',
  'une',
  'et',
  'a',
  'au',
  'aux',
  'en',
  'pour',
  'sur',
  'par',
  'dans',
  'ou',
  'ce',
  'cette',
  'ces',
  'se',
  'sa',
  'son',
  'ses',
  'que',
  'qui',
  'ne',
  'pas',
  'plus',
  'sans',
  'sous',
]);

/** Mots significatifs d'un texte : alphanumériques, normalisés, sans mots-outils. */
export function significantWords(text: string, stopWords: ReadonlySet<string> = STOP_WORDS): string[] {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((word) => word.length > 0 && !stopWords.has(word));
}
