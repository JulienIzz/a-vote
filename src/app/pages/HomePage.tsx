import { useNavigate } from 'react-router';
import { answersStore, DECK_SIZE, INCLUDE_DRAFTS, questionRepository, voteRepository } from '#src/app/container.ts';
import { MethodologyButton } from '#src/app/MethodologyDialog.tsx';
import { isComplete, progress } from '#src/modules/answers/domain/state.ts';
import { useAnswersState } from '#src/modules/answers/view/useAnswersState.ts';
import { buildDeck } from '#src/modules/questions/domain/deck.ts';
import { Hemicycle } from '#src/modules/votes/view/Hemicycle.tsx';
import { seatsByShare } from '#src/modules/votes/view/hemicycle-layout.ts';

export function HomePage() {
  const navigate = useNavigate();
  const state = useAnswersState(answersStore);
  const available = buildDeck(questionRepository.all(), { includeDrafts: INCLUDE_DRAFTS }).length;
  const count = Math.min(DECK_SIZE, available);
  const inProgress = state.deck.length > 0 && !isComplete(state);
  const done = progress(state).done;

  const start = (): void => {
    const deck = buildDeck(questionRepository.all(), {
      size: DECK_SIZE,
      includeDrafts: INCLUDE_DRAFTS,
      seed: Math.floor(Math.random() * 1_000_000_000),
    });
    answersStore.startDeck(deck.map((q) => q.id));
    navigate('/question/1');
  };

  return (
    <section className="home">
      <Hemicycle
        seats={seatsByShare(
          voteRepository.families().map((f) => f.color),
          undefined,
          60,
        )}
        className="home__hemicycle"
      />
      <h1 className="home__title">
        Comparez vos opinions à celles de <mark className="home__mark">vos députés</mark>
      </h1>
      <p className="home__lead">
        <strong>
          {count} question{count > 1 ? 's' : ''}
        </strong>{' '}
        tirée{count > 1 ? 's' : ''} de vrais scrutins. Des votes, pas des programmes.
      </p>
      <ol className="home__steps">
        <li>
          <strong>Vous votez</strong>
          <span>Oui ou non, sur un texte réellement soumis aux députés.</span>
        </li>
        <li>
          <strong>Vous découvrez</strong>
          <span>Ce que chaque groupe a voté, siège par siège.</span>
        </li>
        <li>
          <strong>Vous comparez</strong>
          <span>Votre accord avec chaque famille politique.</span>
        </li>
      </ol>
      {available === 0 ? (
        <p className="muted">Aucune question n'est encore disponible.</p>
      ) : inProgress ? (
        <div className="home__actions">
          <button type="button" className="btn btn--primary" onClick={() => navigate(`/question/${done + 1}`)}>
            Reprendre ({done}/{state.deck.length})
          </button>
          <button type="button" className="btn btn--ghost" onClick={start}>
            Recommencer avec de nouvelles questions
          </button>
        </div>
      ) : (
        <div className="home__actions">
          <button type="button" className="btn btn--primary" onClick={start}>
            <BallotIcon /> Entrer dans l'isoloir
          </button>
          {isComplete(state) && (
            <button type="button" className="btn btn--ghost" onClick={() => navigate('/resultats')}>
              Revoir mes derniers résultats
            </button>
          )}
        </div>
      )}
      <p className="home__privacy">
        <LockIcon />
        <span>
          <strong>Vos réponses restent sur votre appareil.</strong> Rien n'est stocké en ligne, collecté ni transmis :
          pas de compte, pas de cookie, pas de mesure d'audience.
        </span>
      </p>
      <aside className="home__notes" aria-labelledby="home-notes-title">
        <h2 className="home__notes-title" id="home-notes-title">
          À savoir
        </h2>
        <ul>
          <li>
            <strong>Données officielles.</strong> Les votes sont repris tels quels de l'open data de l'Assemblée
            nationale. <MethodologyButton section="les-donnees">D'où viennent les données</MethodologyButton>
          </li>
          <li>
            <strong>Projet indépendant.</strong> Aucun parti ni financeur derrière le projet.
          </li>
          <li>
            <strong>Open source.</strong> Le code qui télécharge les votes et calcule les scores est public.{' '}
            <a href="https://github.com/JuuuIzzz/a-vote" target="_blank" rel="noreferrer">
              Voir sur GitHub
            </a>
          </li>
          <li>
            <strong>Fiches rédigées avec l'aide d'une IA.</strong> Les votes et les scores, eux, n'en passent jamais par
            une.{' '}
            <MethodologyButton section="transparence-et-utilisation-de-l-ia">
              Ce qui est fait par l'IA
            </MethodologyButton>
          </li>
          <li>
            <strong>Des limites à connaître.</strong> Un vote peut être tactique, et vos scores dépendent des questions
            tirées. <MethodologyButton section="les-limites">Lire les limites</MethodologyButton>
          </li>
        </ul>
      </aside>
    </section>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" className="icon">
      <rect x="5" y="10.5" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" />
    </svg>
  );
}

function BallotIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" className="icon">
      <path d="M4 10h16v10H4z" fill="currentColor" opacity="0.25" />
      <path
        d="M3 9.5h18M4 10v10h16V10M9 4h8l1 5H8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M10 7h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
