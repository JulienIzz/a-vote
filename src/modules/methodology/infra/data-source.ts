import rawMethode from '#data/app/methode.json';
import rawSources from '#data/app/sources.json';
import type { AppMethode, AppSources } from '#data/model/app-data.ts';
import { createMethodologyRepository } from '#src/modules/methodology/infra/repository.ts';

export const methodologyRepository = createMethodologyRepository(rawMethode as AppMethode, rawSources as AppSources);
