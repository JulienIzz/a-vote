/** Composition d'un jeu de questions : filtres par thème et statut, tirage équilibré entre thèmes. */
import type { Question } from '#src/modules/questions/domain/question.ts';

/** Seules les questions relues ou publiées sont proposées aux utilisateurs. */
export const isPublishable = (question: Question): boolean => question.status !== 'brouillon';

export const filterByThemes = (questions: readonly Question[], themeIds: readonly string[]): Question[] => {
  if (themeIds.length === 0) return [...questions];
  const wanted = new Set(themeIds);
  return questions.filter((q) => q.themes.some((t) => wanted.has(t)));
};

/** Nombre de questions par thème (une question peut compter dans plusieurs thèmes). */
export function countByTheme(questions: readonly Question[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const q of questions) for (const t of q.themes) counts.set(t, (counts.get(t) ?? 0) + 1);
  return counts;
}

/** Générateur pseudo-aléatoire déterministe (mulberry32), pour des jeux reproductibles. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

export interface DeckOptions {
  /** Nombre de questions voulu ; toutes si absent. */
  size?: number;
  /** Thèmes à couvrir ; tous si absent ou vide. */
  themes?: readonly string[];
  /** Graine du tirage ; sans graine, l'ordre d'entrée est conservé. */
  seed?: number;
  /** Inclure les fiches encore en brouillon (développement, relecture). */
  includeDrafts?: boolean;
  /** Questions à écarter, déjà posées par exemple (pour prolonger un jeu). */
  exclude?: readonly string[];
}

/**
 * Jeu de questions équilibré : on alterne entre les thèmes (tour par tour) pour qu'aucun ne domine,
 * sans répéter une question qui appartient à plusieurs thèmes.
 */
export function buildDeck(questions: readonly Question[], options: DeckOptions = {}): Question[] {
  const excluded = new Set(options.exclude);
  const pool = filterByThemes(
    questions.filter((q) => !excluded.has(q.id) && (options.includeDrafts || isPublishable(q))),
    options.themes ?? [],
  );
  const random = options.seed === undefined ? null : seededRandom(options.seed);
  const ordered = random ? shuffle(pool, random) : pool;
  const themeIds = options.themes?.length ? [...options.themes] : [...new Set(ordered.flatMap((q) => q.themes))];
  const buckets = new Map(themeIds.map((t) => [t, ordered.filter((q) => q.themes.includes(t))]));
  const untagged = ordered.filter((q) => q.themes.length === 0);
  const size = options.size ?? pool.length;
  const picked: Question[] = [];
  const seen = new Set<string>();
  const take = (q: Question | undefined): void => {
    if (q && !seen.has(q.id) && picked.length < size) {
      seen.add(q.id);
      picked.push(q);
    }
  };
  let progress = true;
  while (picked.length < size && progress) {
    progress = false;
    for (const t of themeIds) {
      const bucket = buckets.get(t) ?? [];
      const next = bucket.find((q) => !seen.has(q.id));
      if (next) {
        take(next);
        progress = true;
      }
    }
    const next = untagged.find((q) => !seen.has(q.id));
    if (next) {
      take(next);
      progress = true;
    }
  }
  return picked;
}
