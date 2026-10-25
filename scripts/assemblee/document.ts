/**
 * Extraction du document Word brut (`/dyn/docs/<id>.raw`), dernière maille de la collecte de contexte :
 * `collectContext` (context.ts) lui confie le HTML exporté de Word, une suite de <p> sans titres HTML.
 * Entrée : ce HTML ; sortie : l'exposé des motifs et les articles en clair, que `truncateText` ramène
 * ensuite sous `EXPOSE_MAX_CHARS` / `ARTICLES_MAX_CHARS`.
 */
import { load } from 'cheerio';
import { cleanText, normalizeWords } from '#scripts/assemblee/pages.ts';

export const EXPOSE_MAX_CHARS = 80_000;
export const ARTICLES_MAX_CHARS = 40_000;

// Le corps enchaîne la page de garde (div.assnatSection1), l'exposé des motifs (p.assnat4titreintit
// « EXPOSÉ DES MOTIFS »), puis le dispositif introduit par un titre « proposition de loi » / « projet de
// loi » et des p.assnat9ArticleNum (« Article 1er »). Les classes varient d'un document à l'autre, on se
// fie au texte des blocs.

interface Block {
  text: string;
  norm: string;
}

const PAGE_NUMBER = /^[–—-]\s*\d+\s*[–—-]$/;
const EXPOSE_HEADING = /^expose des motifs$/;
const DISPOSITIF_TITLE = /^(projet|proposition) de (loi|resolution)( organique| constitutionnelle)?$/;
const ARTICLE_HEADING = /^article (1er|premier|unique|liminaire|\d+)\b/;
const DIVISION_HEADING =
  /^(titre|chapitre|livre|partie|section) (premier|premiere|unique|[ivxl]+(?:er|ere)?|\d+(?:er|ere)?)\b/;

function documentBlocks(html: string): Block[] {
  const $ = load(html);
  $('img, script, style').remove();
  // Notes de bas de page, rejetées en fin de document par Word.
  $('div[id^="_ftn"], div[id^="_edn"]').remove();
  const blocks: Block[] = [];
  $('body')
    .find('p, h1, h2, h3, h4, h5, h6, li')
    .each((_, el) => {
      const node = $(el);
      if (node.find('p, h1, h2, h3, h4, h5, h6, li').length > 0) return; // bloc englobant
      if (/footnote|endnote/i.test(node.attr('class') ?? '')) return;
      const text = cleanText(node.text());
      if (!text || PAGE_NUMBER.test(text) || /^_+$/.test(text)) return;
      blocks.push({ text, norm: normalizeWords(text) });
    });
  return blocks;
}

export interface ExtractedDocument {
  expose: string | null;
  articles: string | null;
}

/** Exposé des motifs et articles en clair, paragraphes séparés par des sauts de ligne. */
export function extractDocument(html: string): ExtractedDocument {
  const blocks = documentBlocks(html);
  const exposeStart = blocks.findIndex((b) => EXPOSE_HEADING.test(b.norm));

  // Début du dispositif : son titre (« proposition de loi ») après l'exposé, sinon la première
  // division ou le premier article. Sans exposé, le titre figure aussi sur la page de garde : on
  // ne s'y fie pas et on cherche directement une division ou un article.
  let dispositifStart = -1;
  if (exposeStart >= 0) {
    dispositifStart = blocks.findIndex((b, i) => i > exposeStart && DISPOSITIF_TITLE.test(b.norm));
  }
  if (dispositifStart < 0) {
    dispositifStart = blocks.findIndex(
      (b, i) => i > exposeStart && (ARTICLE_HEADING.test(b.norm) || DIVISION_HEADING.test(b.norm)),
    );
  }

  let expose: string | null = null;
  if (exposeStart >= 0) {
    const end = dispositifStart >= 0 ? dispositifStart : blocks.length;
    const paragraphs = blocks.slice(exposeStart + 1, end).map((b) => b.text);
    expose = paragraphs.length > 0 ? paragraphs.join('\n') : null;
  }

  let articles: string | null = null;
  if (dispositifStart >= 0) {
    const body = blocks.slice(dispositifStart).filter((b, i) => !(i === 0 && DISPOSITIF_TITLE.test(b.norm)));
    if (body.some((b) => ARTICLE_HEADING.test(b.norm))) articles = body.map((b) => b.text).join('\n');
  }
  return { expose, articles };
}

/** Coupe à `max` caractères, de préférence à une fin de paragraphe. */
export function truncateText(text: string, max: number): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false };
  const cut = text.lastIndexOf('\n', max);
  return { text: text.slice(0, cut > max / 2 ? cut : max).trimEnd(), truncated: true };
}
