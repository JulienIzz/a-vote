/**
 * Contexte documentaire d'un scrutin : le type `ScrutinContext`, son cache JSON (`CONTEXT_DIR`, un
 * fichier par scrutin) et l'orchestration `collectContext`, qui enchaîne le client HTTP (http.ts), les
 * parseurs de pages (pages.ts) et l'extraction du document (document.ts). Entrée : un `Scrutin`
 * normalisé ; sortie : son contexte, écrit dans le cache et consommé par la génération des fiches.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Legislature, Scrutin, TextType } from '#data/model/types.ts';
import { ARTICLES_MAX_CHARS, EXPOSE_MAX_CHARS, extractDocument, truncateText } from '#scripts/assemblee/document.ts';
import { createPageFetcher, type FetchPage } from '#scripts/assemblee/http.ts';
import {
  chooseDepositedText,
  chooseDossier,
  type DossierLink,
  parseCompteRenduDossiers,
  parseDossierPage,
  parseScrutinPage,
  parseTextPage,
  scoreDossierTexts,
  titleSimilarity,
} from '#scripts/assemblee/pages.ts';
import { AN_SITE, CONTEXT_DIR } from '#scripts/paths.ts';

export interface ContextSource {
  url: string;
  status: 'ok' | 'missing' | 'error';
  note?: string;
}

/**
 * Contexte documentaire rassemblé pour un scrutin, en entrée de la génération.
 * Tout vient du site de l'Assemblée nationale ; les textes sont en clair, sans HTML.
 */
export interface ScrutinContext {
  uid: string;
  legislature: Legislature;
  /** Date ISO de la collecte. */
  collectedAt: string;
  /** Page officielle du scrutin. */
  scrutinUrl: string;
  /** Compte rendu de la séance : interventions et explications de vote des groupes. */
  compteRenduUrl: string | null;
  dossier: { url: string; title: string } | null;
  /** Texte déposé (celui qui porte l'exposé des motifs) ; `kind` est lu dans l'URL du texte. */
  text: { url: string; title: string; number: string | null; kind: TextType } | null;
  /** Exposé des motifs en clair, null si introuvable. */
  exposeDesMotifs: string | null;
  /** Articles du texte déposé en clair, tronqués, null si introuvables. */
  articles: string | null;
  /** Pages consultées, pour la traçabilité. */
  sources: ContextSource[];
  warnings: string[];
}

export interface ContextOptions {
  /** Ignore les caches (contexte et pages) et recollecte. */
  force?: boolean;
  /** Chargeur de pages injectable (tests). Par défaut : `fetch` avec cache disque. */
  fetchPage?: FetchPage;
  /** Dossier des contextes en cache (tests). Par défaut : `data/cache/context`. */
  cacheDir?: string;
}

// ---------------------------------------------------------------------------
// Cache des contextes

export function contextCachePath(uid: string, cacheDir: string = CONTEXT_DIR): string {
  return path.join(cacheDir, `${uid}.json`);
}

function isScrutinContext(value: unknown): value is ScrutinContext {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.uid === 'string' &&
    typeof v.collectedAt === 'string' &&
    typeof v.scrutinUrl === 'string' &&
    Array.isArray(v.sources) &&
    Array.isArray(v.warnings)
  );
}

/** Contexte déjà collecté, ou `null` s'il n'existe pas (ou n'est pas lisible). */
export async function readCachedContext(uid: string, cacheDir: string = CONTEXT_DIR): Promise<ScrutinContext | null> {
  let raw: string;
  try {
    raw = await readFile(contextCachePath(uid, cacheDir), 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  const parsed: unknown = JSON.parse(raw);
  return isScrutinContext(parsed) ? parsed : null;
}

async function writeCachedContext(ctx: ScrutinContext, cacheDir: string): Promise<void> {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(contextCachePath(ctx.uid, cacheDir), `${JSON.stringify(ctx, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// Collecte

/** Charge une page en la journalisant dans le contexte ; `null` si absente ou en erreur. */
type PageLoader = (url: string, what: string) => Promise<string | null>;

/** Votes du Congrès (VTCGR…) : pas de page de scrutin sur le site de l'AN. */
const isCongresVote = (uid: string): boolean => uid.startsWith('VTCGR');

/** Formatte un nombre de caractères pour un avertissement. */
const chars = (n: number): string => `${n.toLocaleString('fr-FR')} caractères`;

/** Nombre maximal de dossiers du compte rendu dont on consulte la page, à défaut de titre concordant. */
const MAX_DOSSIER_CANDIDATES = 5;

/**
 * Rassemble le contexte documentaire d'un scrutin : page du scrutin → dossier législatif
 * (via le compte rendu de séance si la page du scrutin n'y renvoie pas) → texte déposé → document.
 * Chaque étape manquante dégrade le contexte (warning) sans interrompre la collecte.
 */
export async function collectContext(scrutin: Scrutin, options: ContextOptions = {}): Promise<ScrutinContext> {
  const cacheDir = options.cacheDir ?? CONTEXT_DIR;
  if (!options.force) {
    const cached = await readCachedContext(scrutin.uid, cacheDir);
    if (cached) return cached;
  }
  const fetchPage = options.fetchPage ?? createPageFetcher({ force: options.force ?? false });
  const ctx: ScrutinContext = {
    uid: scrutin.uid,
    legislature: scrutin.legislature,
    collectedAt: new Date().toISOString(),
    scrutinUrl: scrutin.sourceUrl,
    compteRenduUrl: null,
    dossier: null,
    text: null,
    exposeDesMotifs: null,
    articles: null,
    sources: [],
    warnings: [],
  };

  const loadPage: PageLoader = async (url, what) => {
    try {
      const html = await fetchPage(url);
      if (html === null) {
        ctx.sources.push({ url, status: 'missing' });
        ctx.warnings.push(`${what} introuvable (404) : ${url}`);
        return null;
      }
      ctx.sources.push({ url, status: 'ok' });
      return html;
    } catch (error) {
      const note = error instanceof Error ? error.message : String(error);
      ctx.sources.push({ url, status: 'error', note });
      ctx.warnings.push(`${what} : erreur de chargement (${note})`);
      return null;
    }
  };

  await collectSteps(scrutin, ctx, loadPage);
  await writeCachedContext(ctx, cacheDir);
  return ctx;
}

/** Consulte les dossiers candidats et retient celui dont un texte recouvre au moins la moitié du titre du scrutin. */
async function chooseDossierByTexts(
  links: readonly DossierLink[],
  scrutinTitle: string,
  loadPage: PageLoader,
): Promise<{ link: DossierLink; html: string } | null> {
  let best: { link: DossierLink; html: string; score: number } | null = null;
  for (const link of links) {
    const html = await loadPage(link.url, 'Dossier législatif candidat');
    if (!html) continue;
    const score = scoreDossierTexts(html, scrutinTitle);
    if (score > (best?.score ?? 0)) best = { link, html, score };
  }
  return best && best.score >= 0.5 ? { link: best.link, html: best.html } : null;
}

async function collectSteps(scrutin: Scrutin, ctx: ScrutinContext, loadPage: PageLoader): Promise<void> {
  if (isCongresVote(scrutin.uid)) {
    ctx.sources.push({
      url: scrutin.sourceUrl,
      status: 'missing',
      note: "vote du Congrès : l'URL désigne un autre scrutin de l'AN, page non consultée",
    });
    ctx.warnings.push('Vote du Congrès : pas de page de scrutin sur le site de l’AN, aucun dossier ni texte rattaché.');
    return;
  }

  // 1. Page du scrutin
  const scrutinHtml = await loadPage(scrutin.sourceUrl, 'Page du scrutin');
  if (!scrutinHtml) return;
  const page = parseScrutinPage(scrutinHtml, scrutin.legislature);
  ctx.compteRenduUrl = page.compteRenduUrl;
  if (page.numero !== scrutin.numero || page.title === null || titleSimilarity(page.title, scrutin.title) < 0.6) {
    ctx.warnings.push(
      `La page du scrutin ne correspond pas au scrutin attendu (page : n°${page.numero ?? '?'} « ${page.title ?? ''} »).`,
    );
    return;
  }

  // 2. Dossier législatif, via le compte rendu de séance si la page du scrutin n'y renvoie pas
  let dossierUrl = page.dossierUrl;
  let dossierHtml: string | null = null;
  if (!dossierUrl) {
    if (!page.compteRenduUrl) {
      ctx.warnings.push('Aucun lien vers un dossier législatif ni vers un compte rendu sur la page du scrutin.');
      return;
    }
    const crHtml = await loadPage(page.compteRenduUrl, 'Compte rendu de la séance');
    if (!crHtml) return;
    const links = parseCompteRenduDossiers(crHtml, scrutin.legislature);
    let chosen = chooseDossier(links, scrutin.title);
    if (!chosen) {
      // Un texte renommé en cours d'examen reste listé sous son titre initial : on compare alors
      // le titre du scrutin aux titres des textes de chaque dossier candidat.
      const best = await chooseDossierByTexts(links.slice(0, MAX_DOSSIER_CANDIDATES), scrutin.title, loadPage);
      if (best) {
        chosen = best.link;
        dossierHtml = best.html;
      }
    }
    if (!chosen) {
      ctx.warnings.push(
        `Aucun dossier législatif du compte rendu ne correspond au titre du scrutin (${links.length} dossier(s) listé(s)).`,
      );
      return;
    }
    dossierUrl = chosen.url;
  }
  if (!dossierHtml) dossierHtml = await loadPage(dossierUrl, 'Dossier législatif');
  if (!dossierHtml) return;
  const dossier = parseDossierPage(dossierHtml);
  ctx.dossier = { url: dossierUrl, title: dossier.title ?? scrutin.dossierTitle ?? '' };
  if (!dossier.title) ctx.warnings.push('Titre du dossier législatif introuvable sur sa page.');

  // 3. Texte déposé
  const text = chooseDepositedText(dossier.texts);
  if (!text) {
    ctx.warnings.push('Aucun texte déposé (projet ou proposition) publié par l’AN sur la page du dossier.');
    return;
  }
  if (!text.deposit) {
    ctx.warnings.push(
      'Texte initial non déposé à l’AN (dépôt au Sénat ?) : texte transmis utilisé, probablement sans exposé des motifs.',
    );
  }
  ctx.text = { url: text.url, title: text.title, number: text.number, kind: text.kind };
  if (text.kind === 'autre') ctx.warnings.push(`Nature du texte non reconnue d’après l’URL : ${text.url}`);

  const textHtml = await loadPage(text.url, 'Page du texte');
  let documentUrl = textHtml ? parseTextPage(textHtml).documentUrl : null;
  if (!documentUrl && text.documentId) documentUrl = `${AN_SITE}/dyn/docs/${text.documentId}.raw`;
  if (!documentUrl) {
    ctx.warnings.push('Document du texte introuvable (pas d’iframe /dyn/docs/ sur la page du texte).');
    return;
  }

  // 4. Extraction
  const docHtml = await loadPage(documentUrl, 'Document du texte');
  if (!docHtml) return;
  const extracted = extractDocument(docHtml);
  if (extracted.expose === null) {
    ctx.warnings.push('Exposé des motifs introuvable dans le texte déposé.');
  } else {
    const { text: expose, truncated } = truncateText(extracted.expose, EXPOSE_MAX_CHARS);
    ctx.exposeDesMotifs = expose;
    if (truncated)
      ctx.warnings.push(
        `Exposé des motifs tronqué à ${chars(EXPOSE_MAX_CHARS)} (${chars(extracted.expose.length)} à l’origine).`,
      );
  }
  if (extracted.articles === null) {
    ctx.warnings.push('Articles introuvables dans le texte déposé.');
  } else {
    const { text: articles, truncated } = truncateText(extracted.articles, ARTICLES_MAX_CHARS);
    ctx.articles = articles;
    if (truncated)
      ctx.warnings.push(
        `Articles tronqués à ${chars(ARTICLES_MAX_CHARS)} (${chars(extracted.articles.length)} à l’origine).`,
      );
  }
}
