/**
 * Classement des scrutins candidats : filtre, statistiques par famille, discriminance, score,
 * dédoublonnage des lectures. Fonctions pures, sans accès disque, testées dans ranking.test.ts.
 * Chaîne : import (scrutins normalisés) → ranking → shortlist (commande, écriture des fichiers).
 */
import { aggregateByFamily } from '#data/model/families.ts';
import { cohesion, expressedTotal, netScore, reliabilityWeight } from '#data/model/scoring.ts';
import type { Legislature, Scrutin, TextType, VoteKind } from '#data/model/types.ts';
import { type CompiledTheme, classify } from '#scripts/content/themes.ts';
import { normalizeText, significantWords } from '#scripts/text.ts';

export const ASSEMBLY_SEATS = 577;
/** Participation globale à partir de laquelle un scrutin n'est plus pénalisé. */
export const FULL_PARTICIPATION = 0.35;
/** Votants minimum pour retenir un scrutin hors « ensemble » / solennel (option --all-kinds). */
export const ALL_KINDS_MIN_VOTANTS = 250;

/**
 * Textes sans contenu d'opinion, votés chaque année sur une ligne majorité / opposition :
 * lois de règlement du budget et d'approbation des comptes.
 */
export const EXCLUDED_TITLE_PATTERNS: readonly RegExp[] = [/reglement du budget/, /approbation des comptes/];

/**
 * Mention de lecture en fin de titre : « (première lecture) », « (texte de la commission mixte paritaire) »,
 * ou « (texte de la commission paritaire) », sans « mixte », dans certains titres officiels.
 */
const READING_SUFFIX = /\s*\(([^()]*(?:lecture|commission (?:mixte )?paritaire)[^()]*)\)\s*\.?\s*$/;

/** Une autre lecture du même texte, écartée de la shortlist au profit de la mieux classée. */
export interface Reading {
  uid: string;
  legislature: Legislature;
  date: string;
  label: string | null;
  sourceUrl: string;
  score: number;
}

/** Décompte d'une famille politique sur un scrutin, enrichi des indicateurs de scoring. */
export interface FamilyStat {
  familyId: string;
  pour: number;
  contre: number;
  abstention: number;
  /** pour + contre + abstention. */
  expressed: number;
  members: number;
  /** expressed / members, 0 si la famille n'a pas d'effectif. */
  participation: number;
  /** Score net dans [-1, 1], null si personne n'a voté. */
  net: number | null;
  /** Cohésion de Hix-Noury-Roland, null si personne n'a voté. */
  cohesion: number | null;
  /** Poids de fiabilité : 1 dès que 25 % des membres ont voté. */
  weight: number;
}

export interface Candidate {
  uid: string;
  legislature: Legislature;
  numero: number;
  date: string;
  title: string;
  /** Dossier législatif dans l'open data, souvent absent : complète le titre pour regrouper les lectures. */
  dossierRef: string | null;
  dossierTitle: string | null;
  kind: VoteKind;
  textType: TextType;
  solemn: boolean;
  result: Scrutin['result'];
  votants: number;
  sourceUrl: string;
  /** Identifiants de thèmes, uniques, dans l'ordre de themes.json. */
  themes: string[];
  /** Mots-clés ayant déclenché les thèmes, uniques. */
  keywords: string[];
  /** Écart-type pondéré des scores nets des familles. */
  discriminance: number;
  /** votants / 577. */
  participation: number;
  score: number;
  families: FamilyStat[];
  /** Mention de lecture extraite du titre, ex. « premiere lecture ». */
  reading: string | null;
  /** Autres lectures du même texte, écartées par le dédoublonnage. */
  otherReadings: Reading[];
}

/**
 * Un scrutin est candidat s'il porte sur l'ensemble d'un texte ou s'il est solennel.
 * Les motions (censure, rejet préalable…) sont écartées : elles ne disent rien du fond.
 * Avec `allKinds`, tout scrutin suffisamment suivi (≥ 250 votants) est aussi retenu.
 */
export function isCandidate(scrutin: Scrutin, allKinds: boolean): boolean {
  if (scrutin.voteType === 'MOC' || scrutin.kind === 'motion' || scrutin.kind === 'procedure') return false;
  const title = normalizeText(scrutin.title);
  if (EXCLUDED_TITLE_PATTERNS.some((pattern) => pattern.test(title))) return false;
  if (scrutin.kind === 'ensemble' || scrutin.solemn) return true;
  return allKinds && scrutin.totals.votants >= ALL_KINDS_MIN_VOTANTS;
}

/** Statistiques par famille, dans l'ordre de `familyOrder` (celui du mapping). */
export function familyStats(
  scrutin: Pick<Scrutin, 'groups'>,
  index: ReadonlyMap<string, string>,
  familyOrder: readonly string[],
): FamilyStat[] {
  const rank = new Map(familyOrder.map((id, i) => [id, i]));
  return aggregateByFamily(scrutin, index)
    .map((f): FamilyStat => {
      const expressed = expressedTotal(f);
      return {
        familyId: f.familyId,
        pour: f.pour,
        contre: f.contre,
        abstention: f.abstention,
        expressed,
        members: f.members,
        participation: f.members > 0 ? expressed / f.members : 0,
        net: netScore(f),
        cohesion: cohesion(f),
        weight: reliabilityWeight(expressed, f.members),
      };
    })
    .sort((a, b) => (rank.get(a.familyId) ?? Infinity) - (rank.get(b.familyId) ?? Infinity));
}

export interface WeightedValue {
  value: number;
  weight: number;
}

/** Écart-type pondéré (population). 0 si la somme des poids est nulle. */
export function weightedStdDev(items: readonly WeightedValue[]): number {
  let total = 0;
  for (const it of items) total += it.weight;
  if (total <= 0) return 0;
  let mean = 0;
  for (const it of items) mean += (it.weight * it.value) / total;
  let variance = 0;
  for (const it of items) variance += (it.weight * (it.value - mean) ** 2) / total;
  return Math.sqrt(variance);
}

export interface RankInput {
  discriminance: number;
  participation: number;
  textType: TextType;
  kind: VoteKind;
  solemn: boolean;
  hasTheme: boolean;
}

function textTypeFactor(textType: TextType): number {
  switch (textType) {
    case 'projet-de-loi':
    case 'proposition-de-loi':
      return 1;
    case 'proposition-de-resolution':
      return 0.8;
    default:
      return 0.7;
  }
}

function kindFactor(kind: VoteKind, solemn: boolean): number {
  if (kind === 'ensemble') return 1;
  return solemn ? 0.9 : 0.7;
}

/**
 * Score de classement : la discriminance entre familles, pénalisée quand
 * moins de 35 % des sièges ont voté, puis selon le type de texte, la nature
 * du vote et l'absence de thème identifié.
 */
export function rankScore(input: RankInput): number {
  const participationFactor = Math.min(1, input.participation / FULL_PARTICIPATION);
  const themeFactor = input.hasTheme ? 1 : 0.6;
  return (
    input.discriminance *
    participationFactor *
    textTypeFactor(input.textType) *
    kindFactor(input.kind, input.solemn) *
    themeFactor
  );
}

const unique = <T>(items: readonly T[]): T[] => [...new Set(items)];

/**
 * Clé d'un texte indépendante de sa lecture : titre normalisé, sans la mention de lecture,
 * réduit à ses mots significatifs. Retourne aussi la mention de lecture.
 */
export function readingKey(title: string): { key: string; label: string | null } {
  const normalized = normalizeText(title);
  const match = READING_SUFFIX.exec(normalized);
  const label = match?.[1]?.trim() ?? null;
  const base = match ? normalized.slice(0, match.index) : normalized;
  const words = significantWords(base);
  return { key: words.join(' '), label };
}

/**
 * Ne garde qu'une entrée par texte, toutes législatures confondues (un projet de loi
 * peut survivre à une dissolution) : la mieux classée, c'est-à-dire la plus haute
 * dans `sorted`. Les autres lectures lui sont rattachées. Deux scrutins portent sur le même
 * texte s'ils partagent leur titre sans mention de lecture ou leur dossier : le titre officiel
 * change parfois d'une lecture à l'autre. Les cas restants sont rattrapés par `check`.
 */
export function dedupeReadings(sorted: readonly Candidate[]): Candidate[] {
  const kept = new Map<string, Candidate>();
  const result: Candidate[] = [];
  for (const candidate of sorted) {
    const keys = [`titre:${readingKey(candidate.title).key}`];
    if (candidate.dossierRef) keys.push(`dossier:${candidate.dossierRef}`);
    const existing = keys.map((k) => kept.get(k)).find((c) => c !== undefined);
    if (existing) {
      for (const k of keys) if (!kept.has(k)) kept.set(k, existing);
      existing.otherReadings.push({
        uid: candidate.uid,
        legislature: candidate.legislature,
        date: candidate.date,
        label: candidate.reading,
        sourceUrl: candidate.sourceUrl,
        score: candidate.score,
      });
      continue;
    }
    const copy: Candidate = { ...candidate, otherReadings: [] };
    for (const k of keys) kept.set(k, copy);
    result.push(copy);
  }
  return result;
}

export function buildCandidate(
  scrutin: Scrutin,
  index: ReadonlyMap<string, string>,
  familyOrder: readonly string[],
  themes: readonly CompiledTheme[],
): Candidate {
  const matches = classify(`${scrutin.title} ${scrutin.dossierTitle ?? ''}`, themes);
  const themeIds = unique(matches.map((m) => m.themeId));
  const families = familyStats(scrutin, index, familyOrder);
  const discriminance = weightedStdDev(
    families.flatMap((f) => (f.net === null ? [] : [{ value: f.net, weight: f.weight }])),
  );
  const participation = scrutin.totals.votants / ASSEMBLY_SEATS;
  const score = rankScore({
    discriminance,
    participation,
    textType: scrutin.textType,
    kind: scrutin.kind,
    solemn: scrutin.solemn,
    hasTheme: themeIds.length > 0,
  });
  return {
    uid: scrutin.uid,
    legislature: scrutin.legislature,
    numero: scrutin.numero,
    date: scrutin.date,
    title: scrutin.title,
    dossierRef: scrutin.dossierRef,
    dossierTitle: scrutin.dossierTitle,
    kind: scrutin.kind,
    textType: scrutin.textType,
    solemn: scrutin.solemn,
    result: scrutin.result,
    votants: scrutin.totals.votants,
    sourceUrl: scrutin.sourceUrl,
    themes: themeIds,
    keywords: unique(matches.map((m) => m.keyword)),
    discriminance,
    participation,
    score,
    families,
    reading: readingKey(scrutin.title).label,
    otherReadings: [],
  };
}

/** Score décroissant, puis votants décroissants, puis identifiant pour un ordre stable. */
export function compareCandidates(a: Candidate, b: Candidate): number {
  return b.score - a.score || b.votants - a.votants || a.uid.localeCompare(b.uid);
}
