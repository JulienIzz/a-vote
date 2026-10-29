import { type Candidate, displayHost, fullName, initials, mainLink } from '#src/modules/candidates/domain/candidate.ts';
import { formatDate } from '#src/modules/methodology/domain/methodology.ts';

/** Une candidature : le portrait, le nom, le parti, l'annonce avec sa source, et le lien vers le programme. */
export function CandidateCard({ candidate }: { candidate: Candidate }) {
  const link = mainLink(candidate);
  const declared = formatDate(candidate.declaredAt);
  return (
    <article className="card candidate">
      <header className="candidate__head">
        {candidate.photo ? (
          <img
            className="candidate__photo"
            src={candidate.photo.src}
            alt={`Portrait de ${fullName(candidate)}`}
            width="320"
            height="320"
            loading="lazy"
          />
        ) : (
          <span
            className="candidate__photo candidate__photo--none"
            role="img"
            aria-label="Pas de portrait libre de droits"
          >
            {initials(candidate)}
          </span>
        )}
        <div>
          <h2 className="candidate__name">{fullName(candidate)}</h2>
          <p className="candidate__party">
            {candidate.party}
            {candidate.partyShort && <> ({candidate.partyShort})</>}
          </p>
        </div>
      </header>
      {candidate.note && <p className="candidate__note">{candidate.note}</p>}
      <p className="candidate__declared">
        Candidature annoncée{declared ? ` le ${declared}` : ''} · source :{' '}
        <a href={candidate.declaration.url} target="_blank" rel="noreferrer">
          {candidate.declaration.label}
        </a>
      </p>
      {link?.kind === 'programme' && candidate.programme ? (
        <>
          <a className="btn btn--primary candidate__link" href={link.url} target="_blank" rel="noreferrer">
            Lire le programme <ExternalIcon />
          </a>
          <p className="candidate__site">
            {candidate.programme.label}
            {candidate.website && (
              <>
                {' · '}
                <a href={candidate.website} target="_blank" rel="noreferrer">
                  {displayHost(candidate.website)}
                </a>
              </>
            )}
          </p>
        </>
      ) : (
        <>
          <p className="candidate__missing">Programme pas encore publié.</p>
          {link ? (
            <a className="btn candidate__link" href={link.url} target="_blank" rel="noreferrer">
              Site officiel · {displayHost(link.url)} <ExternalIcon />
            </a>
          ) : (
            <p className="candidate__site">Aucun site de campagne trouvé.</p>
          )}
        </>
      )}
      {candidate.photo && (
        <p className="candidate__credit">
          Photo :{' '}
          <a href={candidate.photo.source} target="_blank" rel="noreferrer">
            {candidate.photo.author}, {candidate.photo.licence}
          </a>
        </p>
      )}
    </article>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" className="icon">
      <path
        d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
