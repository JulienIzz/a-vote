import { legislatureRoman } from '#data/model/types.ts';
import type { Question, QuestionDetail } from '#src/modules/questions/domain/question.ts';
import type { DetailState } from '#src/modules/questions/view/useQuestionDetail.ts';

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

interface Props {
  question: Question;
  detail: DetailState;
}

/** Pour ceux qui veulent creuser : le scrutin, les mesures, les arguments, le contexte, les sources. */
export function QuestionDetails({ question, detail }: Props) {
  const { scrutin } = question;
  return (
    <section className="card details-card">
      <div className="details-card__meta">
        <span className="eyebrow">Pour creuser</span>
        <span className="muted">
          Scrutin du {dateFormat.format(new Date(scrutin.date))} · {legislatureRoman(scrutin.legislature)} législature
        </span>
      </div>
      {detail.status === 'loading' && <p className="muted">Chargement des détails…</p>}
      {detail.status === 'failed' && (
        <p className="muted">
          Les détails n'ont pas pu être chargés.{' '}
          <button type="button" className="link" onClick={detail.retry}>
            Réessayer
          </button>
        </p>
      )}
      {detail.status === 'ready' && detail.detail && (
        <DetailSections detail={detail.detail} officialTitle={scrutin.officialTitle} />
      )}
    </section>
  );
}

function DetailSections({ detail, officialTitle }: { detail: QuestionDetail; officialTitle: string }) {
  return (
    <>
      <details className="details">
        <summary>Ce que contient le texte</summary>
        <ul>
          {detail.measures.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </details>
      <details className="details">
        <summary>Les arguments des deux camps</summary>
        <h3>Pour</h3>
        <ul>
          {detail.argumentsFor.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <h3>Contre</h3>
        <ul>
          {detail.argumentsAgainst.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </details>
      <details className="details">
        <summary>Le contexte</summary>
        <p>{detail.context}</p>
        <p className="muted">Intitulé officiel : {officialTitle}</p>
      </details>
      <details className="details">
        <summary>Les sources</summary>
        <ul className="sources">
          {detail.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
