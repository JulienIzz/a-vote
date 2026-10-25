/** Législatures couvertes. Pour en ajouter une : ici, puis dans data/content/families.json. */
export const LEGISLATURES = [16, 17] as const;
export type Legislature = (typeof LEGISLATURES)[number];

/** Libellé courant d'une législature : « XVIe législature (2022-2024) ». */
export function legislatureLabel(legislature: Legislature): string {
  const labels: Record<Legislature, string> = {
    16: 'XVIe législature (2022-2024)',
    17: 'XVIIe législature (depuis 2024)',
  };
  return labels[legislature];
}

/** Numéro romain d'une législature : « XVIIe ». */
export function legislatureRoman(legislature: Legislature): string {
  const romans: Record<Legislature, string> = { 16: 'XVIe', 17: 'XVIIe' };
  return romans[legislature];
}

/** Issue d'un scrutin. */
export type VoteResult = 'adopte' | 'rejete';

/** Cycle de vie d'une fiche : rédigée, relue par une autre personne, embarquée dans une version publiée. */
export const STATUTS = ['brouillon', 'relu', 'publiee'] as const;
export type Statut = (typeof STATUTS)[number];

/** Nature de ce qui est mis aux voix, déduite du titre officiel du scrutin. */
export type VoteKind =
  | 'ensemble'
  | 'article'
  | 'amendement'
  | 'sous-amendement'
  | 'motion'
  /** Demandes de suspension de séance, de seconde délibération, etc. */
  | 'procedure'
  | 'autre';

/** Type de texte concerné, déduit du titre. */
export type TextType =
  | 'projet-de-loi'
  | 'proposition-de-loi'
  | 'proposition-de-resolution'
  | 'declaration-du-gouvernement'
  | 'autre';

export type Position = 'pour' | 'contre' | 'abstention';

export interface VoteCounts {
  pour: number;
  contre: number;
  abstention: number;
  /** Députés présents dans le décompte mais n'ayant pas pris part au vote. */
  nonVotants: number;
}

/** Décompte d'un groupe politique sur un scrutin. */
export interface GroupVote extends VoteCounts {
  /** Identifiant d'organe AN (PO…). Le nom se résout via `PoliticalGroup`. */
  groupRef: string;
  /** Effectif du groupe le jour du vote. */
  members: number;
  /** Position majoritaire publiée par l'AN. Non fiable dans ~3 % des cas, à recalculer. */
  officialMajority: Position | null;
}

export interface Scrutin {
  uid: string;
  legislature: Legislature;
  numero: number;
  /** Date ISO (AAAA-MM-JJ). */
  date: string;
  /** Titre officiel, tel que publié par l'AN. */
  title: string;
  kind: VoteKind;
  textType: TextType;
  /** Code AN : SPO (ordinaire), SPS (solennel), MOC (motion de censure)… */
  voteType: string;
  solemn: boolean;
  result: VoteResult;
  dossierRef: string | null;
  dossierTitle: string | null;
  totals: VoteCounts & { votants: number; exprimes: number };
  groups: GroupVote[];
  sourceUrl: string;
}

/** Groupe politique tel que décrit dans le référentiel « organes » de l'AN. */
export interface PoliticalGroup {
  ref: string;
  legislature: Legislature;
  abbrev: string;
  shortLabel: string;
  name: string;
  start: string | null;
  end: string | null;
  color: string | null;
}
