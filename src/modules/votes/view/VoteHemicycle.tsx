import { expressedTotal } from '#data/model/scoring.ts';
import type { Family } from '#src/modules/votes/domain/family.ts';
import type { FamilyVote } from '#src/modules/votes/domain/vote.ts';
import { Hemicycle } from '#src/modules/votes/view/Hemicycle.tsx';
import type { Seat } from '#src/modules/votes/view/hemicycle-layout.ts';

const VOTE_COLORS = { pour: 'var(--pour)', contre: 'var(--contre)', abstention: 'var(--abst)' } as const;

interface Props {
  votes: readonly FamilyVote[];
  families: readonly Family[];
}

/**
 * Le scrutin vu de l'hémicycle : un siège par député ayant voté, coloré selon son vote,
 * les familles rangées de gauche à droite ; la réglette en dessous dit où est chaque famille.
 */
export function VoteHemicycle({ votes, families }: Props) {
  const familyById = new Map(families.map((f) => [f.id, f]));
  const seats: Seat[] = [];
  const strip: Array<{ family: Family | undefined; expressed: number }> = [];
  for (const vote of votes) {
    const family = familyById.get(vote.familyId);
    const label = family?.label ?? vote.familyId;
    const push = (n: number, kind: keyof typeof VOTE_COLORS): void => {
      for (let i = 0; i < n; i += 1) seats.push({ color: VOTE_COLORS[kind], title: `${label} : ${kind}` });
    };
    push(vote.pour, 'pour');
    push(vote.abstention, 'abstention');
    push(vote.contre, 'contre');
    const expressed = expressedTotal(vote);
    if (expressed > 0) strip.push({ family, expressed });
  }
  const total = seats.length;
  const pour = votes.reduce((s, v) => s + v.pour, 0);
  const contre = votes.reduce((s, v) => s + v.contre, 0);
  const abstention = votes.reduce((s, v) => s + v.abstention, 0);
  return (
    <figure className="hemi">
      <Hemicycle seats={seats} className="hemi__svg" />
      <div className="hemi__strip" aria-hidden="true">
        {strip.map(({ family, expressed }) => (
          <span
            key={family?.id ?? expressed}
            style={{ flexGrow: expressed, background: family?.color ?? '#c9c4b8' }}
            title={`${family?.label ?? '?'} : ${expressed} votant${expressed > 1 ? 's' : ''}`}
          />
        ))}
      </div>
      <figcaption className="hemi__legend">
        <span>
          <i className="dot dot--pour" />
          {pour} pour
        </span>
        <span>
          <i className="dot dot--contre" />
          {contre} contre
        </span>
        <span>
          <i className="dot dot--abst" />
          {abstention} abstention{abstention > 1 ? 's' : ''}
        </span>
        <span className="muted">{total} députés ont voté</span>
      </figcaption>
    </figure>
  );
}
