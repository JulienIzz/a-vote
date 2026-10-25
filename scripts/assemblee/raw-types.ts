/**
 * Types « bruts » du JSON de l'Assemblée nationale. Ce JSON est dérivé du XML :
 * les nombres sont des chaînes, les listes à un élément peuvent être des objets,
 * et les champs absents valent `null`.
 */

type Maybe<T> = T | null | undefined;

export interface RawDecompte {
  pour?: Maybe<string>;
  contre?: Maybe<string>;
  abstentions?: Maybe<string>;
  nonVotants?: Maybe<string>;
  nonVotantsVolontaires?: Maybe<string>;
}

export interface RawGroupe {
  organeRef: string;
  nombreMembresGroupe?: Maybe<string>;
  vote?: Maybe<{
    positionMajoritaire?: Maybe<string>;
    decompteVoix?: Maybe<RawDecompte>;
  }>;
}

export interface RawScrutin {
  uid: string;
  numero: string;
  legislature: string;
  dateScrutin: string;
  titre?: Maybe<string>;
  typeVote?: Maybe<{ codeTypeVote?: Maybe<string>; libelleTypeVote?: Maybe<string> }>;
  sort?: Maybe<{ code?: Maybe<string>; libelle?: Maybe<string> }>;
  objet?: Maybe<{
    libelle?: Maybe<string>;
    dossierLegislatif?: Maybe<string | { dossierRef?: Maybe<string>; libelle?: Maybe<string> }>;
  }>;
  syntheseVote?: Maybe<{
    nombreVotants?: Maybe<string>;
    suffragesExprimes?: Maybe<string>;
    decompte?: Maybe<RawDecompte>;
  }>;
  ventilationVotes?: Maybe<{
    organe?: Maybe<{
      groupes?: Maybe<{ groupe?: Maybe<RawGroupe | RawGroupe[]> }>;
    }>;
  }>;
}

export interface RawScrutinFile {
  scrutin: RawScrutin;
}

export interface RawOrgane {
  uid: string;
  codeType?: Maybe<string>;
  libelle?: Maybe<string>;
  libelleAbrev?: Maybe<string>;
  libelleAbrege?: Maybe<string>;
  legislature?: Maybe<string>;
  viMoDe?: Maybe<{ dateDebut?: Maybe<string>; dateFin?: Maybe<string> }>;
  couleurAssociee?: Maybe<string>;
}

export interface RawOrganeFile {
  organe: RawOrgane;
}

export function toInt(value: Maybe<string | number>): number {
  const n = typeof value === 'number' ? value : Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : 0;
}

export function asArray<T>(value: Maybe<T | T[]>): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}
