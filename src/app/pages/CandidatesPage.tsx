import { useState } from 'react';
import { candidateRepository } from '#src/app/container.ts';
import { shuffled } from '#src/modules/candidates/domain/candidate.ts';
import { CandidateCard } from '#src/modules/candidates/view/CandidateCard.tsx';
import { formatDate } from '#src/modules/methodology/domain/methodology.ts';

export function CandidatesPage() {
  const { election, checkedAt, candidates: listed, pending } = candidateRepository.list();
  // Tiré une fois par visite : l'ordre ne bouge pas pendant la lecture, mais personne n'est toujours en tête.
  const [candidates] = useState(() => shuffled(listed));
  const checked = formatDate(checkedAt);
  return (
    <section className="candidates">
      <span className="eyebrow">{election}</span>
      <h1 className="candidates__title">Les candidatures déclarées</h1>
      <p className="candidates__lead">
        Qui s'est déclaré candidat, et où lire son programme. L'ordre est tiré au hasard à chaque visite, pour que
        personne ne soit toujours en tête : il ne dit rien d'une préférence ni des sondages.
      </p>
      <p className="candidates__warning">
        <strong>Ce n'est pas la liste officielle.</strong> Elle ne sera connue qu'après la collecte des 500 parrainages,
        quand le Conseil constitutionnel publiera les candidatures retenues. D'ici là, des candidats peuvent s'ajouter
        ou se retirer. Chaque candidature listée est attestée par un article ou un communiqué, en lien.
        {checked && <> Liste vérifiée le {checked}.</>}
      </p>
      {candidates.length === 0 ? (
        <p className="muted">Aucune candidature déclarée pour l'instant.</p>
      ) : (
        candidates.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} />)
      )}
      {pending.length > 0 && (
        <aside className="candidates__pending" aria-labelledby="candidates-pending-title">
          <h2 className="home__notes-title" id="candidates-pending-title">
            À suivre
          </h2>
          <ul>
            {pending.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </aside>
      )}
      <p className="muted candidates__fix">
        Une candidature manque ou un lien est cassé ?{' '}
        <a href="https://github.com/JuuuIzzz/a-vote/issues" target="_blank" rel="noreferrer">
          Signalez-le sur GitHub
        </a>
        . Les portraits viennent de Wikimedia Commons, sous licence libre, tous recadrés de la même façon.
      </p>
    </section>
  );
}
