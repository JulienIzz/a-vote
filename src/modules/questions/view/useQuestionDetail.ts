import { useEffect, useState } from 'react';
import type { QuestionRepository } from '#src/modules/questions/domain/ports.ts';
import type { QuestionDetail } from '#src/modules/questions/domain/question.ts';

export type DetailState =
  | { status: 'loading' }
  | { status: 'ready'; detail: QuestionDetail | undefined }
  | { status: 'failed'; retry: () => void };

/** Charge le détail d'une question à l'affichage ; un échec (réseau coupé) se réessaie à la demande. */
export function useQuestionDetail(repository: QuestionRepository, id: string): DetailState {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<DetailState>({ status: 'loading' });
  // biome-ignore lint/correctness/useExhaustiveDependencies: `attempt` relance le chargement après un échec.
  useEffect(() => {
    let current = true;
    setState({ status: 'loading' });
    repository.detail(id).then(
      (detail) => {
        if (current) setState({ status: 'ready', detail });
      },
      () => {
        if (current) setState({ status: 'failed', retry: () => setAttempt((n) => n + 1) });
      },
    );
    return () => {
      current = false;
    };
  }, [repository, id, attempt]);
  return state;
}
