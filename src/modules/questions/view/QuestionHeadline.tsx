import type { Question } from '#src/modules/questions/domain/question.ts';

interface Props {
  question: Question;
}

/** Le cœur de l'écran : la question en grand, puis ce que le texte change en une phrase. */
export function QuestionHeadline({ question }: Props) {
  return (
    <header className="headline">
      <span className="eyebrow">La question</span>
      <h1 className="headline__text">{question.text}</h1>
      <p className="headline__summary">{question.summary}</p>
    </header>
  );
}
