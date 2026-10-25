import type { Methodology, Provenance } from '#src/modules/methodology/domain/methodology.ts';

export interface MethodologyRepository {
  methodology(): Methodology;
  provenance(): Provenance;
}
