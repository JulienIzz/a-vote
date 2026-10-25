import { expressedTotal } from '#data/model/scoring.ts';
import type { QuestionAgreement } from '#src/modules/scores/domain/compute.ts';
import type { Family } from '#src/modules/votes/domain/family.ts';
import { type FamilyVote, type Position, summarize } from '#src/modules/votes/domain/vote.ts';

const POSITION_LABEL: Record<Position, string> = {
  pour: 'Pour',
  contre: 'Contre',
  abstention: 'Abst.',
  partage: 'Partagé',
  absent: 'Absent',
};

interface Props {
  votes: readonly FamilyVote[];
  families: readonly Family[];
  /** Accord de chaque famille avec la réponse de l'utilisateur, si elle a répondu. */
  agreements?: readonly QuestionAgreement[] | undefined;
}

const percent = (value: number): string => `${Math.round(value * 100)} %`;

/**
 * Une ligne par famille : nom, barre, décompte, position, accord. Une pastille « ! » signale un vote peu suivi.
 * Les lignes partagent les colonnes de `.votes__rows` (subgrid) pour que barres et chiffres s'alignent.
 */
export function VoteBreakdown({ votes, families, agreements }: Props) {
  const familyById = new Map(families.map((f) => [f.id, f]));
  const agreementById = new Map((agreements ?? []).map((a) => [a.familyId, a]));
  let anyLowTurnout = false;
  let anySplit = false;
  return (
    <div className="votes">
      <div className={`votes__rows${agreements ? '' : ' votes__rows--no-agreement'}`}>
        {votes.map((vote) => {
          const family = familyById.get(vote.familyId);
          const summary = summarize(vote);
          const expressed = expressedTotal(vote);
          const width = (n: number) => (expressed > 0 ? `${(100 * n) / expressed}%` : '0%');
          const agreement = agreementById.get(vote.familyId);
          if (summary.lowTurnout) anyLowTurnout = true;
          if (summary.position === 'partage') anySplit = true;
          const participation = `${expressed} votant${expressed > 1 ? 's' : ''} sur ${vote.members} membres`;
          return (
            <div key={vote.familyId} className="vote" title={`${family?.label ?? vote.familyId} : ${participation}`}>
              <span className="vote__family">
                <span className="swatch" style={{ background: family?.color ?? '#999' }} />
                <span className="vote__name">{family?.label ?? vote.familyId}</span>
                <span className="vote__short">{family?.shortLabel ?? vote.familyId}</span>
              </span>
              <span className="vote__bar">
                <span className="bar" aria-hidden="true">
                  <span className="bar__pour" style={{ width: width(vote.pour) }} />
                  <span className="bar__contre" style={{ width: width(vote.contre) }} />
                  <span className="bar__abst" style={{ width: width(vote.abstention) }} />
                </span>
              </span>
              <span className="vote__counts">
                <b className="c-pour">{vote.pour}</b>
                <b className="c-contre">{vote.contre}</b>
                <b className="c-abst">{vote.abstention}</b>
                {summary.lowTurnout ? (
                  <LowTurnoutBadge />
                ) : (
                  <span className="vote__low vote__low--none" aria-hidden="true" />
                )}
              </span>
              <span className={`vote__position vote__position--${summary.position}`}>
                {POSITION_LABEL[summary.position]}
              </span>
              {agreements && (
                <span className="vote__agreement">
                  {agreement?.agreement == null ? '—' : percent(agreement.agreement)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="legend">
        <p className="legend__title">Comment lire ce tableau</p>
        <dl>
          <div className="legend__item">
            <dt>
              <span className="vote__counts">
                <b className="c-pour">12</b>
                <b className="c-contre">3</b>
                <b className="c-abst">1</b>
              </span>
            </dt>
            <dd>Députés pour · contre · abstention</dd>
          </div>
          {anySplit && (
            <div className="legend__item">
              <dt>
                <span className="vote__position vote__position--partage">Partagé</span>
              </dt>
              <dd>Le groupe s'est divisé, sans majorité nette</dd>
            </div>
          )}
          {agreements && (
            <div className="legend__item">
              <dt>
                <span className="vote__agreement">80 %</span>
              </dt>
              <dd>Votre accord avec ce groupe sur cette question</dd>
            </div>
          )}
          {anyLowTurnout && (
            <div className="legend__item">
              <dt>
                <LowTurnoutBadge />
              </dt>
              <dd>Peu de votants : moins d'un quart du groupe a voté, ce résultat compte moins</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

/** Pastille « ! » dessinée, pour qu'elle soit centrée au pixel près quelle que soit la police. */
function LowTurnoutBadge() {
  return (
    <span className="vote__low">
      <svg viewBox="0 0 16 16" width="15" height="15" role="img" focusable="false">
        <title>Peu de votants : moins d'un quart du groupe a voté</title>
        <circle cx="8" cy="8" r="8" fill="currentColor" />
        <rect x="6.9" y="3.1" width="2.2" height="6" rx="1.1" fill="#fff" />
        <circle cx="8" cy="11.7" r="1.25" fill="#fff" />
      </svg>
    </span>
  );
}
