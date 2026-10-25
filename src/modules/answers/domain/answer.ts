/** Les réponses de l'utilisateur et sa progression dans un jeu de questions. Tout reste sur l'appareil. */

/** « oui » ou « non » à la question posée ; « passe » exclut la question du calcul. */
export type AnswerValue = 'oui' | 'non' | 'passe';

export interface Answer {
  questionId: string;
  value: AnswerValue;
  /** Date ISO de la réponse. */
  answeredAt: string;
}

export interface AnswersState {
  /** Identifiants des questions du jeu en cours, dans l'ordre. */
  deck: string[];
  /** Position de la prochaine question à poser. */
  cursor: number;
  answers: Record<string, Answer>;
}
