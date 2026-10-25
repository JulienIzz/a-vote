/**
 * Une question de l'app : un scrutin reformulé pour qu'on y réponde par oui ou par non,
 * avec de quoi comprendre le texte et vérifier les sources.
 */
import type { Legislature, Statut, VoteResult } from '#data/model/types.ts';

/** Sens de la question : répondre « oui » revient à voter pour ou contre le scrutin. */
export type Sens = 'pour' | 'contre';

export interface QuestionSource {
  label: string;
  url: string;
}

/** Les faits du scrutin, tels que publiés par l'Assemblée. */
export interface ScrutinFacts {
  uid: string;
  legislature: Legislature;
  /** Date ISO (AAAA-MM-JJ). */
  date: string;
  officialTitle: string;
  result: VoteResult;
  totals: { pour: number; contre: number; abstention: number; votants: number };
  /** Page officielle du scrutin. */
  url: string;
}

export interface Question {
  /** Identifiant du scrutin (VTANR5L17V8431). */
  id: string;
  /** La question posée, une phrase fermée. */
  text: string;
  sens: Sens;
  /** Ce que le texte change, en une phrase. */
  summary: string;
  themes: string[];
  status: Statut;
  scrutin: ScrutinFacts;
}

/** Pour creuser une question : le texte long de la fiche, chargé seulement quand la question s'affiche. */
export interface QuestionDetail {
  measures: string[];
  argumentsFor: string[];
  argumentsAgainst: string[];
  context: string;
  sources: QuestionSource[];
}

export interface Theme {
  id: string;
  label: string;
}
