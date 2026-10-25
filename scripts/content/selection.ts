import { readFile } from 'node:fs/promises';
import type { Candidate } from '#scripts/content/ranking.ts';
import { SELECTION_FILE } from '#scripts/paths.ts';

/** Un texte retenu pour l'app, avec une note libre facultative (angle de la question, remarque). */
export interface SelectionEntry {
  uid: string;
  note?: string;
}

/**
 * Sélection des textes, maintenue à la main dans data/content/selection.json.
 * `rejected` garde la trace des textes examinés et écartés, pour ne pas les réexaminer.
 * `reviewedThrough` (AAAA-MM-JJ) : tous les scrutins jusqu'à cette date ont été examinés.
 */
export interface Selection {
  selected: SelectionEntry[];
  rejected: string[];
  reviewedThrough?: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isString = (v: unknown): v is string => typeof v === 'string';

export function isSelection(value: unknown): value is Selection {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.selected) &&
    v.selected.every(
      (e) =>
        typeof e === 'object' &&
        e !== null &&
        isString((e as Record<string, unknown>).uid) &&
        ((e as Record<string, unknown>).note === undefined || isString((e as Record<string, unknown>).note)),
    ) &&
    Array.isArray(v.rejected) &&
    v.rejected.every(isString) &&
    (v.reviewedThrough === undefined || (isString(v.reviewedThrough) && ISO_DATE.test(v.reviewedThrough)))
  );
}

/** Lit la sélection ; vide si le fichier n'existe pas encore. */
export async function readSelection(): Promise<Selection> {
  let raw: string;
  try {
    raw = await readFile(SELECTION_FILE, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { selected: [], rejected: [] };
    throw error;
  }
  const parsed: unknown = JSON.parse(raw);
  if (!isSelection(parsed)) throw new Error(`Format inattendu dans ${SELECTION_FILE}`);
  return parsed;
}

/** Ce que `shortlist --new` propose : les textes jamais examinés et les nouvelles lectures de textes déjà tranchés. */
export interface NewCandidates {
  /** Textes dont aucune lecture n'est sélectionnée ni écartée, votés après `reviewedThrough`. */
  fresh: Candidate[];
  /** Textes déjà tranchés qui ont une lecture plus récente que toutes celles tranchées. */
  newReadings: Array<{ candidate: Candidate; decided: 'selected' | 'rejected'; uids: string[] }>;
}

/** Sépare les candidats classés en textes nouveaux et nouvelles lectures ; l'ordre de `candidates` est conservé. */
export function splitNewCandidates(candidates: readonly Candidate[], selection: Selection): NewCandidates {
  const selected = new Set(selection.selected.map((e) => e.uid));
  const rejected = new Set(selection.rejected);
  const cutoff = selection.reviewedThrough ?? null;
  const isRecent = (date: string): boolean => cutoff === null || date > cutoff;
  const result: NewCandidates = { fresh: [], newReadings: [] };
  for (const candidate of candidates) {
    const readings = [{ uid: candidate.uid, date: candidate.date }, ...candidate.otherReadings];
    const decided = readings.filter((r) => selected.has(r.uid) || rejected.has(r.uid));
    if (decided.length === 0) {
      if (readings.some((r) => isRecent(r.date))) result.fresh.push(candidate);
      continue;
    }
    const lastDecided =
      decided
        .map((r) => r.date)
        .sort()
        .at(-1) ?? '';
    const later = readings.filter((r) => r.date > lastDecided && isRecent(r.date)).map((r) => r.uid);
    if (later.length > 0) {
      const status = decided.some((r) => selected.has(r.uid)) ? 'selected' : 'rejected';
      result.newReadings.push({ candidate, decided: status, uids: later });
    }
  }
  return result;
}
