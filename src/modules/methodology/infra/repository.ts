import type { AppMethode, AppSources } from '#data/model/app-data.ts';
import type { MethodologyRepository } from '#src/modules/methodology/domain/ports.ts';
import { toMethodology, toProvenance } from '#src/modules/methodology/infra/mappers.ts';

export function createMethodologyRepository(rawMethode: AppMethode, rawSources: AppSources): MethodologyRepository {
  const methodology = toMethodology(rawMethode);
  const provenance = toProvenance(rawSources);
  return { methodology: () => methodology, provenance: () => provenance };
}
