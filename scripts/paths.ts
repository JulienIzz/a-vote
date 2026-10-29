import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGISLATURES, type Legislature } from '#data/model/types.ts';

export { LEGISLATURES };

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(here, '..');
export const DATA_DIR = path.join(ROOT_DIR, 'data');

/** Maintenu à la main et versionné. */
export const CONTENT_DIR = path.join(DATA_DIR, 'content');
export const FAMILIES_FILE = path.join(CONTENT_DIR, 'families.json');
export const THEMES_FILE = path.join(CONTENT_DIR, 'themes.json');
export const SELECTION_FILE = path.join(CONTENT_DIR, 'selection.json');
export const METHODE_FILE = path.join(CONTENT_DIR, 'METHODE.md');
export const CANDIDATS_FILE = path.join(CONTENT_DIR, 'candidats.json');
export const FICHES_DIR = path.join(CONTENT_DIR, 'fiches');

/** Compilé par `pnpm data build`, versionné, importé par l'app. */
export const APP_DIR = path.join(DATA_DIR, 'app');
/** Un JSON par question pour le texte long, chargé à la demande par l'app. */
export const APP_FICHES_DIR = path.join(APP_DIR, 'fiches');

/** Régénérable, ignoré par git. */
export const CACHE_DIR = path.join(DATA_DIR, 'cache');
export const NORMALIZED_DIR = path.join(CACHE_DIR, 'normalized');
export const SHORTLIST_DIR = path.join(CACHE_DIR, 'shortlist');
export const PAGES_DIR = path.join(CACHE_DIR, 'pages');
export const CONTEXT_DIR = path.join(CACHE_DIR, 'context');
export const BRIEFS_DIR = path.join(CACHE_DIR, 'briefs');
export const GROUPS_FILE = path.join(NORMALIZED_DIR, 'groups.json');
export const MANIFEST_FILE = path.join(NORMALIZED_DIR, 'manifest.json');
export const scrutinsFile = (legislature: Legislature): string =>
  path.join(NORMALIZED_DIR, `scrutins.${legislature}.json`);

// ---------------------------------------------------------------------------
// URLs de l'Assemblée nationale

export const AN_SITE = 'https://www.assemblee-nationale.fr';

const AN_REPO = 'https://data.assemblee-nationale.fr/static/openData/repository';

export interface SourceFile {
  url: string;
  path: string;
}

/** Archive « Scrutins » d'une législature : un fichier JSON par scrutin. */
export function scrutinsSource(legislature: Legislature): SourceFile {
  return {
    url: `${AN_REPO}/${legislature}/loi/scrutins/Scrutins.json.zip`,
    path: path.join(CACHE_DIR, 'archives', `scrutins-${legislature}.json.zip`),
  };
}

/**
 * Référentiel historique acteurs / mandats / organes depuis 1997.
 * Seule archive qui contient les groupes politiques des législatures passées :
 * l'archive « députés actifs » de la XVIe n'en a aucun.
 */
export const ORGANES_SOURCE: SourceFile = {
  url: `${AN_REPO}/17/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip`,
  path: path.join(CACHE_DIR, 'archives', 'organes-historique.json.zip'),
};

export function scrutinPageUrl(legislature: Legislature, numero: number): string {
  return `${AN_SITE}/dyn/${legislature}/scrutins/${numero}`;
}

export function parseLegislatures(input: string | undefined): Legislature[] {
  if (!input) return [...LEGISLATURES];
  return input.split(',').map((raw) => {
    const n = Number(raw.trim());
    if (!LEGISLATURES.includes(n as Legislature)) {
      throw new Error(`Législature non prise en charge : ${raw} (attendu : ${LEGISLATURES.join(', ')})`);
    }
    return n as Legislature;
  });
}
