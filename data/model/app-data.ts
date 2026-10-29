import type { SourceLink } from '#data/model/sources.ts';
import type { Legislature, Position, Statut, VoteResult } from '#data/model/types.ts';

/** Décompte d'une famille politique sur une question, tel qu'embarqué dans l'app. */
export interface AppFamilyVote {
  familyId: string;
  pour: number;
  contre: number;
  abstention: number;
  members: number;
}

/** Une question de l'app : la fiche rédigée plus les votes du scrutin. */
export interface AppQuestion {
  uid: string;
  legislature: Legislature;
  date: string;
  question: string;
  /** « pour » : répondre oui = voter pour le scrutin ; « contre » : répondre oui = voter contre. */
  sens: Exclude<Position, 'abstention'>;
  themes: string[];
  statut: Statut;
  /** Ce que le texte change, en une phrase. */
  summary: string;
  measures: string[];
  /** Arguments des partisans et des opposants, attribués. */
  pour: string[];
  contre: string[];
  context: string;
  officialTitle: string;
  result: VoteResult;
  totals: { pour: number; contre: number; abstention: number; votants: number };
  urls: { scrutin: string; dossier: string | null; texte: string | null };
  /** Toutes les sources consultées pour cette fiche, à afficher telles quelles. */
  sources: SourceLink[];
  votes: AppFamilyVote[];
}

/** Les champs longs d'une fiche, séparés de l'index pour n'être chargés qu'à l'affichage de la question. */
export type AppDetailField = 'measures' | 'pour' | 'contre' | 'context' | 'sources';

/** Une entrée de data/app/questions.json : de quoi tirer un jeu, poser la question et calculer les scores. */
export type AppQuestionIndex = Omit<AppQuestion, AppDetailField>;

/** Le texte long d'une fiche, dans data/app/fiches/<uid>.json. */
export type AppQuestionDetail = Pick<AppQuestion, 'uid' | AppDetailField>;

export interface AppFamily {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
}

export interface AppTheme {
  id: string;
  label: string;
}

/** Un jeu de données utilisé par l'app, pour la page « D'où viennent les données ». */
export interface AppDataset {
  name: string;
  url: string;
  licence: string;
  /** Taille de l'archive téléchargée, en octets, si connue. */
  bytes: number | null;
  /** Date de l'archive telle que téléchargée, ISO, si connue. */
  modifiedAt: string | null;
}

export interface AppSources {
  /** Date du dernier import de l'open data, ISO, null si inconnue. */
  importedAt: string | null;
  datasets: AppDataset[];
  /** Site consulté pour les textes et exposés des motifs. */
  website: string;
  /** Dépôt public du code, depuis package.json, null tant qu'il n'est pas renseigné. */
  repository: string | null;
}

/** La méthode de calcul, en Markdown, affichée dans l'app. */
export interface AppMethode {
  title: string;
  markdown: string;
}

/** Un lien cité par l'app : un libellé lisible et l'URL. */
export interface AppLink {
  label: string;
  url: string;
}

/** Une candidature déclarée à l'élection présidentielle, telle que maintenue dans data/content/candidats.json. */
export interface AppCandidate {
  id: string;
  firstName: string;
  lastName: string;
  /** Parti ou mouvement qui porte la candidature, nom officiel. */
  party: string;
  /** Sigle du parti, null s'il n'en a pas. */
  partyShort: string | null;
  /** Date ISO (AAAA-MM-JJ) de l'annonce ou de la désignation, null si la source ne l'atteste pas. */
  declaredAt: string | null;
  /** Article ou déclaration officielle qui atteste la candidature. */
  declaration: AppLink;
  /** Une précision factuelle d'une phrase (désignation par une primaire…), null sinon. */
  note: string | null;
  /** Le programme publié, null tant qu'il ne l'est pas. */
  programme: AppLink | null;
  /** Site officiel de campagne ou du parti, null si aucun n'a été trouvé. */
  website: string | null;
  /** Portrait sous licence libre, null si aucun n'a été trouvé. */
  photo: AppPhoto | null;
}

/** Un portrait recadré, servi depuis public/, et ce qu'il faut créditer. */
export interface AppPhoto {
  /** Chemin servi par le site : « /candidats/<id>.jpg ». */
  src: string;
  author: string;
  licence: string;
  /** Page de l'image sur Wikimedia Commons. */
  source: string;
}

export interface AppCandidates {
  /** Intitulé du scrutin : « Élection présidentielle 2027 ». */
  election: string;
  /** Date ISO de la dernière vérification de la liste. */
  checkedAt: string;
  candidates: AppCandidate[];
  /** Désignations encore en cours (primaires…), une phrase chacune. */
  pending: string[];
}
