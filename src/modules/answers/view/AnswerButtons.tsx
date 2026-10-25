import type { AnswerValue } from '#src/modules/answers/domain/answer.ts';

interface Props {
  onAnswer: (value: AnswerValue) => void;
}

/** Deux bulletins à glisser dans l'urne, et un bouton pour passer. */
export function AnswerButtons({ onAnswer }: Props) {
  return (
    <div className="ballots">
      <p className="eyebrow ballots__label">Votre bulletin</p>
      <div className="ballots__pair">
        <button type="button" className="ballot ballot--oui" onClick={() => onAnswer('oui')}>
          <span className="ballot__word">Oui</span>
          <span className="ballot__hint">Je suis pour</span>
        </button>
        <button type="button" className="ballot ballot--non" onClick={() => onAnswer('non')}>
          <span className="ballot__word">Non</span>
          <span className="ballot__hint">Je suis contre</span>
        </button>
      </div>
      <button type="button" className="skip-btn" onClick={() => onAnswer('passe')}>
        Passer la question
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" className="icon">
          <path
            d="M5 12h12M13 7l5 5-5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
