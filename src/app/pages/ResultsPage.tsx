import { Navigate, useNavigate } from 'react-router';
import {
  answersStore,
  EXTENSION_SIZE,
  INCLUDE_DRAFTS,
  questionRepository,
  voteRepository,
} from '#src/app/container.ts';
import { MethodologyButton } from '#src/app/MethodologyDialog.tsx';
import { ShareSite } from '#src/app/ShareSite.tsx';
import type { AnswerValue } from '#src/modules/answers/domain/answer.ts';
import { answersInOrder } from '#src/modules/answers/domain/state.ts';
import { useAnswersState } from '#src/modules/answers/view/useAnswersState.ts';
import { buildDeck } from '#src/modules/questions/domain/deck.ts';
import { computeScores } from '#src/modules/scores/domain/compute.ts';
import { ScoreBoard } from '#src/modules/scores/view/ScoreBoard.tsx';
import { type Position, positionOf } from '#src/modules/votes/domain/vote.ts';
import { Hemicycle } from '#src/modules/votes/view/Hemicycle.tsx';
import { seatsByShare } from '#src/modules/votes/view/hemicycle-layout.ts';

const SHORT_POSITION: Record<Position, string> = {
  pour: 'pour',
  contre: 'contre',
  abstention: 'abst.',
  partage: 'partagé',
  absent: '—',
};

const MY_VOTE: Record<AnswerValue, string> = { oui: 'Oui', non: 'Non', passe: 'Passée' };

export function ResultsPage() {
  const navigate = useNavigate();
  const state = useAnswersState(answersStore);
  if (state.deck.length === 0) return <Navigate to="/" replace />;

  const families = voteRepository.families();
  const answers = answersInOrder(state);
  const result = computeScores({
    answers,
    question: (id) => questionRepository.byId(id),
    votesFor: (id) => voteRepository.forQuestion(id),
    families,
  });
  const familyById = new Map(families.map((f) => [f.id, f]));
  const shares = result.families.map((f) => (f.agreement ?? 0) ** 2 + 0.02);
  const groups = result.families.map((f) => ({
    id: f.familyId,
    label: familyById.get(f.familyId)?.label ?? f.familyId,
    detail: f.agreement === null ? 'Aucun vote sur vos questions' : `${Math.round(f.agreement * 100)}\u00a0% d'accord`,
  }));

  // Les questions encore jamais posées, pour prolonger le parcours.
  const remaining = buildDeck(questionRepository.all(), { includeDrafts: INCLUDE_DRAFTS, exclude: state.deck }).length;
  const more = Math.min(EXTENSION_SIZE, remaining);

  const extend = (): void => {
    const extra = buildDeck(questionRepository.all(), {
      size: EXTENSION_SIZE,
      includeDrafts: INCLUDE_DRAFTS,
      exclude: state.deck,
      seed: Math.floor(Math.random() * 1_000_000_000),
    });
    const from = state.deck.length;
    answersStore.extendDeck(extra.map((q) => q.id));
    navigate(`/question/${from + 1}`);
    window.scrollTo({ top: 0 });
  };

  const restart = (): void => {
    void answersStore.reset().then(() => navigate('/'));
  };

  return (
    <section>
      <Hemicycle
        seats={seatsByShare(
          families.map((f) => f.color),
          shares,
          60,
          groups,
        )}
        className="results__hemicycle"
      />
      <p className="eyebrow">Vos résultats</p>
      <h1 className="headline__text">
        Votre accord avec chaque famille politique
        {result.answeredCount > 0 &&
          `, d'après vos réponses à ${result.answeredCount}\u00a0question${result.answeredCount > 1 ? 's' : ''} sur\u00a0${state.deck.length}`}
      </h1>
      <p className="results__lead">
        Plus une famille a de sièges dans l'hémicycle, plus elle a voté comme vous.{' '}
        <MethodologyButton className="results__how">Comment c'est calculé ?</MethodologyButton>
      </p>
      {/* Avant le classement, qui est long : sinon on ne voit l'invitation à affiner qu'après avoir tout lu. */}
      {more > 0 && (
        <section className="card results__more">
          <div className="results__more-body">
            <h2 className="results__more-title">Affiner la comparaison</h2>
            <p className="results__more-text">
              Plus vous répondez, plus vos scores sont fiables. Vos réponses actuelles sont gardées et vos résultats
              recalculés.
            </p>
          </div>
          <button type="button" className="btn btn--primary results__more-btn" onClick={extend}>
            +{more} question{more > 1 ? 's' : ''}
          </button>
        </section>
      )}

      <div className="card">
        <ScoreBoard scores={result.ranked} families={families} />
      </div>

      <details className="card results__details">
        <summary>Le détail question par question</summary>
        <ol className="recap-list">
          {state.deck.map((id) => {
            const question = questionRepository.byId(id);
            const answer = state.answers[id];
            if (!question) return null;
            return (
              <li key={id}>
                <p className="recap-list__question">{question.text}</p>
                <p className="my-vote">
                  <span className="my-vote__label">Votre vote</span>
                  <span className={`recap__word recap__word--${answer?.value ?? 'passe'} my-vote__word`}>
                    {answer ? MY_VOTE[answer.value] : 'Sans réponse'}
                  </span>
                </p>
                <p className="chips">
                  {voteRepository.forQuestion(id).map((vote) => {
                    const family = familyById.get(vote.familyId);
                    const position = positionOf(vote);
                    return (
                      <span key={vote.familyId} className={`chip chip--${position}`} title={family?.label}>
                        {family?.shortLabel ?? vote.familyId} {SHORT_POSITION[position]}
                      </span>
                    );
                  })}
                </p>
              </li>
            );
          })}
        </ol>
      </details>

      <div className="home__actions">
        <button type="button" className={`btn ${more > 0 ? 'btn--ghost' : 'btn--primary'}`} onClick={restart}>
          Recommencer
        </button>
      </div>

      <ShareSite />
    </section>
  );
}
