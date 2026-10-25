/** Options communes aux commandes qui ciblent des textes sélectionnés (collect, brief, scaffold). */
import type { Legislature } from '#data/model/types.ts';

export interface ScopedOptions {
  legislatures: Legislature[];
  force: boolean;
  /** Identifiants de scrutins à traiter exclusivement (--only). */
  only: string[] | null;
  /** Nombre maximal de textes à traiter (--limit). */
  limit: number | null;
}
