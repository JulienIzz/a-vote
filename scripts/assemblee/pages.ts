/**
 * Parseurs des pages HTML du site de l'AN (cheerio), entre le client HTTP (http.ts) et l'orchestration
 * de `collectContext` (context.ts) : page du scrutin → compte rendu de séance → dossier législatif →
 * page du texte. Entrée : le HTML d'une page ; sortie : les titres, numéros et liens (URLs absolues)
 * qu'elle porte, plus les comparaisons de titres qui servent à choisir le bon dossier.
 */
import { type CheerioAPI, load } from 'cheerio';
import type { Legislature, TextType } from '#data/model/types.ts';
import { AN_SITE } from '#scripts/paths.ts';
import { collapseSpaces } from '#scripts/text.ts';

// ---------------------------------------------------------------------------
// Texte des nœuds HTML (partagé avec document.ts)

/**
 * Texte d'un nœud, prêt à afficher ou à comparer. Diffère de `tidyTitle` (scripts/text.ts) : retire les
 * caractères invisibles des exports Word (trait d'union conditionnel, espaces de largeur nulle), ramène
 * le trait d'union insécable à un tiret simple et conserve les apostrophes typographiques.
 */
export function cleanText(text: string): string {
  return collapseSpaces(text.replace(/[­​‌‍]/g, '').replace(/‑/g, '-'));
}

/**
 * Forme « mots seuls » pour comparer titres et en-têtes : minuscules, sans accents, toute ponctuation
 * remplacée par une espace. Diffère de `normalizeText` (scripts/text.ts), qui garde la ponctuation et
 * translittère œ/æ (ici retirés comme la ponctuation) ; passe d'abord par `cleanText`.
 */
export function normalizeWords(text: string): string {
  return cleanText(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Comparaison de titres

/**
 * Mots ignorés dans les comparaisons de titres. Diffère de `STOP_WORDS` (scripts/text.ts) : les mots de
 * moins de trois lettres sont écartés d'office, et s'y ajoutent les termes présents dans presque tous les
 * titres parlementaires (« texte », « lecture », « commission mixte paritaire », « visant »…).
 */
const TITLE_STOP_WORDS: ReadonlySet<string> = new Set([
  'les',
  'des',
  'une',
  'aux',
  'pour',
  'par',
  'dans',
  'sur',
  'est',
  'qui',
  'que',
  'ensemble',
  'texte',
  'lecture',
  'premiere',
  'deuxieme',
  'nouvelle',
  'commission',
  'mixte',
  'paritaire',
  'visant',
  'relatif',
  'relative',
  'portant',
]);

/** Diffère de `significantWords` (scripts/text.ts) : forme `normalizeWords`, mots d'au moins trois lettres, ensemble. */
function significantWords(text: string): Set<string> {
  return new Set(
    normalizeWords(text)
      .split(' ')
      .filter((w) => w.length >= 3 && !TITLE_STOP_WORDS.has(w)),
  );
}

/** Part des mots significatifs de `needle` présents dans `haystack` (0 si `needle` n'en a aucun). */
function wordCoverage(needle: string, haystack: string): number {
  const wanted = significantWords(needle);
  if (wanted.size === 0) return 0;
  const available = significantWords(haystack);
  let found = 0;
  for (const w of wanted) if (available.has(w)) found += 1;
  return found / wanted.size;
}

/** Coefficient de Dice sur les mots significatifs. */
export function titleSimilarity(a: string, b: string): number {
  const wa = significantWords(a);
  const wb = significantWords(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  let common = 0;
  for (const w of wa) if (wb.has(w)) common += 1;
  return (2 * common) / (wa.size + wb.size);
}

// ---------------------------------------------------------------------------
// Aides cheerio

function absoluteUrl(href: string): string {
  return new URL(href, AN_SITE).toString();
}

function firstHref($: CheerioAPI, selector: string): string | null {
  const href = $(selector).first().attr('href');
  return href ? absoluteUrl(href) : null;
}

function headTitle($: CheerioAPI, suffix: string): string | null {
  const raw = cleanText($('head > title').text());
  if (!raw) return null;
  const i = raw.indexOf(suffix);
  return i > 0 ? raw.slice(0, i).trim() : raw;
}

// ---------------------------------------------------------------------------
// Page du scrutin : https://www.assemblee-nationale.fr/dyn/17/scrutins/8431

export interface ScrutinPage {
  /** Numéro lu dans « Scrutin public n°8431 sur … ». */
  numero: number | null;
  /** Objet du vote lu dans la même phrase. */
  title: string | null;
  dossierUrl: string | null;
  compteRenduUrl: string | null;
}

export function parseScrutinPage(html: string, legislature: Legislature): ScrutinPage {
  const $ = load(html);
  let numero: number | null = null;
  let title: string | null = null;
  $('p.h6').each((_, el) => {
    if (title !== null) return;
    const m = /^Scrutin public\D*?n°\s*(\d+)\s+sur\s+(.+)$/i.exec(cleanText($(el).text()));
    if (m?.[1] && m[2]) {
      numero = Number(m[1]);
      title = m[2];
    }
  });
  return {
    numero,
    title,
    dossierUrl: firstHref($, `a[href*="/dyn/${legislature}/dossiers/"]`),
    compteRenduUrl: firstHref($, `a[href*="/dyn/${legislature}/comptes-rendus/seance/"]`),
  };
}

// ---------------------------------------------------------------------------
// Compte rendu de séance : liste des dossiers législatifs associés (#dosLegListeTipsy)

export interface DossierLink {
  url: string;
  title: string;
}

export function parseCompteRenduDossiers(html: string, legislature: Legislature): DossierLink[] {
  const $ = load(html);
  const links: DossierLink[] = [];
  const seen = new Set<string>();
  $(`#dosLegListeTipsy a[href*="/dyn/${legislature}/dossiers/"], a[href*="/dyn/${legislature}/dossiers/"]`).each(
    (_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const url = absoluteUrl(href);
      if (seen.has(url)) return;
      const title = cleanText($(el).find('span').first().text() || $(el).text());
      if (!title) return;
      seen.add(url);
      links.push({ url, title });
    },
  );
  return links;
}

/** Dossier dont le titre recouvre le mieux celui du scrutin ; null sous 50 % de mots communs. */
export function chooseDossier(links: readonly DossierLink[], scrutinTitle: string): DossierLink | null {
  let best: DossierLink | null = null;
  let bestScore = 0;
  for (const link of links) {
    const score = wordCoverage(link.title, scrutinTitle);
    if (score > bestScore) {
      best = link;
      bestScore = score;
    }
  }
  return bestScore >= 0.5 ? best : null;
}

// ---------------------------------------------------------------------------
// Page du dossier : https://www.assemblee-nationale.fr/dyn/17/dossiers/proteger_mineurs_reseaux_sociaux_17e

export interface TextLink {
  url: string;
  title: string;
  number: string | null;
  kind: TextType;
  /** Lien situé dans un bloc « DepotInitiative » : texte initial déposé à l'AN. */
  deposit: boolean;
  /** Identifiant AN du document (PIONANR5L17B2107), pour reconstituer l'URL du document. */
  documentId: string | null;
}

/** /dyn/17/textes/l17b2107_proposition-loi, l16b1855_projet-loi, l17b1352_proposition-resolution… */
const TEXT_PATH = /^\/dyn\/\d+\/textes\/l\d+b(\d+)_((?:projet|proposition)-(?:loi|resolution)[a-z-]*)$/;

function kindFromSlug(slug: string): TextType {
  if (slug.startsWith('projet-loi')) return 'projet-de-loi';
  if (slug.startsWith('proposition-loi')) return 'proposition-de-loi';
  if (slug.startsWith('proposition-resolution')) return 'proposition-de-resolution';
  return 'autre';
}

/** « Proposition de loi visant à …, n° 2107 » (la date de dépôt suit dans un span voisin) → sans numéro ni date. */
function textTitle(linkText: string): string {
  return cleanText(linkText)
    .replace(/\s*,\s*n°\s*\d+(?:\s*,\s*d[ée]pos[ée]+\s+le\b.*)?$/i, '')
    .replace(/\s*\.\s*$/, '')
    .trim();
}

export interface DossierPage {
  title: string | null;
  /** Textes initiaux (projets, propositions) publiés sur le site de l'AN, dans l'ordre de la page. */
  texts: TextLink[];
}

export function parseDossierPage(html: string): DossierPage {
  const $ = load(html);
  const title = cleanText($('h1').first().text()) || headTitle($, ' - Dossiers législatifs');
  const texts = new Map<string, TextLink>();
  $('a[href*="/textes/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const url = absoluteUrl(href);
    if (!url.startsWith(AN_SITE)) return;
    const m = TEXT_PATH.exec(new URL(url).pathname);
    if (!m?.[1] || !m[2]) return;
    const deposit = $(el)
      .parents('.acte-legislatif-bloc')
      .toArray()
      .some((bloc) => /DepotInitiative/.test($(bloc).attr('data-id') ?? ''));
    const existing = texts.get(url);
    if (existing) {
      // Le même texte est listé dans plusieurs blocs (dépôt, lecture…).
      existing.deposit = existing.deposit || deposit;
      if (!existing.documentId) existing.documentId = $(el).attr('data-document-id') ?? null;
      return;
    }
    texts.set(url, {
      url,
      title: textTitle($(el).text()),
      number: m[1].replace(/^0+(?=\d)/, ''),
      kind: kindFromSlug(m[2]),
      deposit,
      documentId: $(el).attr('data-document-id') ?? null,
    });
  });
  return { title, texts: [...texts.values()] };
}

/**
 * Texte déposé à retenir : le premier texte initial déposé à l'AN ; à défaut (texte venu du Sénat),
 * le premier projet ou proposition publié par l'AN, qui n'aura en général pas d'exposé des motifs.
 */
export function chooseDepositedText(texts: readonly TextLink[]): TextLink | null {
  return texts.find((t) => t.deposit) ?? texts[0] ?? null;
}

/** Formules récurrentes des titres de documents, sans valeur pour reconnaître un texte. */
const TITLE_BOILERPLATE: readonly RegExp[] = [
  /acc[ée]der à la page du document/gi,
  /assembl[ée]e nationale/gi,
  /\bs[ée]nat\b/gi,
  /dans les conditions pr[ée]vues à l[’']article 45, alin[ée]a 3, de la constitution/gi,
  /apr[èe]s engagement de la proc[ée]dure acc[ée]l[ée]r[ée]e/gi,
  /\bT\.A\. n°\s*\d+/gi,
  /\ble \d{1,2}(?:er)? [a-zéû]+ \d{4}\b/gi,
];

/** Titres des textes listés sur une page de dossier (liens et infobulles des boutons « Texte adopté »). */
function dossierTextTitles(html: string): string[] {
  const $ = load(html);
  const titles = new Set<string>();
  const add = (raw: string | undefined): void => {
    let text = raw ?? '';
    for (const pattern of TITLE_BOILERPLATE) text = text.replace(pattern, ' ');
    text = cleanText(text);
    if (text.length >= 20) titles.add(text);
  };
  $('h1').each((_, el) => add($(el).text()));
  $('a[href*="/textes/"]').each((_, el) => {
    add($(el).text());
    add($(el).attr('data-tipsy'));
    add($(el).attr('title'));
  });
  return [...titles];
}

/** Meilleur recouvrement du titre du scrutin par un des titres de textes du dossier. */
export function scoreDossierTexts(html: string, scrutinTitle: string): number {
  let best = 0;
  for (const title of dossierTextTitles(html)) best = Math.max(best, wordCoverage(scrutinTitle, title));
  return best;
}

// ---------------------------------------------------------------------------
// Page du texte : https://www.assemblee-nationale.fr/dyn/17/textes/l17b2107_proposition-loi

export interface TextPage {
  /** Document mis en page, chargé dans l'iframe #docOpaqueIFrame : /dyn/docs/PIONANR5L17B2107.raw */
  documentUrl: string | null;
  title: string | null;
}

export function parseTextPage(html: string): TextPage {
  const $ = load(html);
  const src = $('iframe#docOpaqueIFrame').attr('src') ?? $('iframe[src*="/dyn/docs/"]').attr('src') ?? null;
  return {
    documentUrl: src ? absoluteUrl(src) : null,
    title: cleanText($('h1').first().text()) || null,
  };
}
