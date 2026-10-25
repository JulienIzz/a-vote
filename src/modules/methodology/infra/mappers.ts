/** Du JSON brut (methode.json, sources.json) vers le domaine `methodology`. */
import type { AppDataset, AppMethode, AppSources } from '#data/model/app-data.ts';
import type { Dataset, Methodology, Provenance } from '#src/modules/methodology/domain/methodology.ts';

export const toMethodology = (raw: AppMethode): Methodology => ({ title: raw.title, markdown: raw.markdown });

export const toDataset = (raw: AppDataset): Dataset => ({
  name: raw.name,
  url: raw.url,
  licence: raw.licence,
  bytes: raw.bytes,
  modifiedAt: raw.modifiedAt,
});

export const toProvenance = (raw: AppSources): Provenance => ({
  importedAt: raw.importedAt,
  datasets: raw.datasets.map(toDataset),
  website: raw.website,
  repository: raw.repository,
});
