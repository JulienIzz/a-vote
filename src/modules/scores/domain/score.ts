/** Le résultat : l'accord de l'utilisateur avec chaque famille politique, et son détail. */

export type Confidence = 'haute' | 'moyenne' | 'basse';

export interface QuestionContribution {
  questionId: string;
  familyId: string;
  /** Accord dans [0, 1] sur cette question, null si la famille n'a pas voté. */
  agreement: number | null;
  /** Poids de fiabilité dans [0, 1], selon la participation de la famille. */
  weight: number;
}

export interface FamilyScore {
  familyId: string;
  /** Accord global dans [0, 1], null si aucune question exploitable. */
  agreement: number | null;
  /** Questions où la famille a voté. */
  questionsCounted: number;
  /** Somme des poids de fiabilité : la part de ces questions qui pèse réellement. */
  weightSum: number;
  confidence: Confidence;
}

export interface ScoreResult {
  /** Dans l'ordre d'affichage des familles. */
  families: FamilyScore[];
  /** Du meilleur accord au moins bon, les familles sans score en dernier. */
  ranked: FamilyScore[];
  contributions: QuestionContribution[];
  /** Questions répondues par oui ou non (les passes ne comptent pas). */
  answeredCount: number;
}
