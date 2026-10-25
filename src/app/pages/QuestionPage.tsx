import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { answersStore, questionRepository, voteRepository } from '#src/app/container.ts';
import type { AnswerValue } from '#src/modules/answers/domain/answer.ts';
import { AnswerButtons } from '#src/modules/answers/view/AnswerButtons.tsx';
import { useAnswersState } from '#src/modules/answers/view/useAnswersState.ts';
import { QuestionDetails } from '#src/modules/questions/view/QuestionDetails.tsx';
import { QuestionHeadline } from '#src/modules/questions/view/QuestionHeadline.tsx';
import { useQuestionDetail } from '#src/modules/questions/view/useQuestionDetail.ts';
import { agreementsForQuestion } from '#src/modules/scores/domain/compute.ts';
import { VoteBreakdown } from '#src/modules/votes/view/VoteBreakdown.tsx';
import { VoteHemicycle } from '#src/modules/votes/view/VoteHemicycle.tsx';

const ANSWER_WORD: Record<AnswerValue, string> = { oui: 'Oui', non: 'Non', passe: 'Passé' };

export function QuestionPage() {
  const { n } = useParams();
  const navigate = useNavigate();
  const state = useAnswersState(answersStore);
  const index = Number(n) - 1;
  const id = Number.isInteger(index) && index >= 0 ? state.deck[index] : undefined;
  const existing = id ? state.answers[id] : undefined;
  const [mode, setMode] = useState<'ask' | 'recap'>(existing ? 'recap' : 'ask');
  const recapRef = useRef<HTMLElement>(null);
  const detail = useQuestionDetail(questionRepository, id ?? '');
  const nextId = state.deck[index + 1];
  useEffect(() => {
    setMode(existing ? 'recap' : 'ask');
  }, [existing]);
  // Le détail de la question suivante se charge pendant qu'on répond à celle-ci.
  useEffect(() => {
    if (nextId) questionRepository.detail(nextId).catch(() => {});
  }, [nextId]);

  if (!id) return <Navigate to="/" replace />;
  const question = questionRepository.byId(id);
  if (!question) return <Navigate to="/" replace />;
  const total = state.deck.length;
  const isLast = index === total - 1;
  const votes = voteRepository.forQuestion(id);
  const families = voteRepository.families();

  const onAnswer = (value: AnswerValue): void => {
    if (value === 'passe') answersStore.skip(id);
    else answersStore.answer(id, value);
    setMode('recap');
    requestAnimationFrame(() => recapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const next = (): void => {
    navigate(isLast ? '/resultats' : `/question/${index + 2}`);
    window.scrollTo({ top: 0 });
  };

  return (
    <section>
      <div className="progress">
        <span>
          Question {index + 1} sur {total}
        </span>
        <div className="progress__bar" aria-hidden="true">
          <span style={{ width: `${(100 * (index + (mode === 'recap' ? 1 : 0))) / total}%` }} />
        </div>
      </div>

      <QuestionHeadline question={question} />

      {mode === 'ask' ? (
        <AnswerButtons onAnswer={onAnswer} />
      ) : (
        <section className="card recap" ref={recapRef}>
          <div className="recap__head">
            <div className="recap__ballot">
              <span className="eyebrow">Votre bulletin</span>
              <span className={`recap__word recap__word--${existing?.value ?? 'passe'}`}>
                {existing ? ANSWER_WORD[existing.value] : '—'}
              </span>
            </div>
            <button type="button" className="chip-btn" onClick={() => setMode('ask')}>
              <RevoteIcon /> Changer d'avis
            </button>
          </div>
          <h2 className="recap__title">Comment les groupes ont voté</h2>
          <VoteHemicycle votes={votes} families={families} />
          <VoteBreakdown
            votes={votes}
            families={families}
            agreements={
              existing && existing.value !== 'passe'
                ? agreementsForQuestion(question, votes, existing.value)
                : undefined
            }
          />
        </section>
      )}

      <QuestionDetails question={question} detail={detail} />

      {mode === 'recap' && (
        <div className="next-bar">
          <button type="button" className="btn btn--primary next-bar__button" onClick={next}>
            {isLast ? 'Voir mes résultats' : 'Question suivante'} <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </section>
  );
}

function RevoteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" className="icon">
      <path
        d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4.5h4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
