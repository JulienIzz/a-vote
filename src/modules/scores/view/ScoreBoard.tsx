import type { Confidence, FamilyScore } from '#src/modules/scores/domain/score.ts';
import type { Family } from '#src/modules/votes/domain/family.ts';

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  haute: 'estimation solide',
  moyenne: 'estimation indicative',
  basse: 'trop peu de votes pour conclure',
};

interface Props {
  scores: readonly FamilyScore[];
  families: readonly Family[];
}

export function ScoreBoard({ scores, families }: Props) {
  const familyById = new Map(families.map((f) => [f.id, f]));
  return (
    <ol className="scores">
      {scores.map((score) => {
        const family = familyById.get(score.familyId);
        const value = score.agreement === null ? null : Math.round(score.agreement * 100);
        return (
          <li key={score.familyId} className="score">
            <div className="score__head">
              <span className="vote__family">
                <span className="swatch" style={{ background: family?.color ?? '#999' }} />
                {family?.label ?? score.familyId}
              </span>
              <strong className="score__value">{value === null ? '—' : `${value} %`}</strong>
            </div>
            <div className="bar bar--score" aria-hidden="true">
              <span className="bar__fill" style={{ width: `${value ?? 0}%`, background: family?.color ?? '#999' }} />
            </div>
            <div className="muted score__note">
              {value === null
                ? "Cette famille n'a voté sur aucune de vos questions"
                : `${score.questionsCounted} question${score.questionsCounted > 1 ? 's' : ''} · ${CONFIDENCE_LABEL[score.confidence]}`}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
