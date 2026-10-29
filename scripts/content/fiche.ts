/**
 * Lecture et contrôle d'une fiche Markdown : en-tête YAML simplifié (une clé par ligne), titre,
 * introduction et sections. Chaîne : scaffold écrit le gabarit → rédaction → check vérifie → build convertit.
 */
import { STATUTS, type Statut } from '#data/model/types.ts';

/** Marqueur laissé par le gabarit dans chaque champ à rédiger. */
export const PLACEHOLDER = 'À RÉDIGER';

/** Sections du corps d'une fiche, dans l'ordre, avec leur titre affiché. */
export const SECTIONS = {
  measures: 'Les grandes mesures',
  pour: 'Pour',
  contre: 'Contre',
  context: 'Contexte',
  votes: 'Comment les groupes ont voté',
  links: 'Pour aller plus loin',
  toCheck: 'À vérifier avant publication',
} as const;
export const SECTION_TITLES: readonly string[] = Object.values(SECTIONS);

/** Clés obligatoires de l'en-tête. */
export const REQUIRED_FRONT_KEYS = [
  'uid',
  'legislature',
  'date',
  'titre_officiel',
  'question',
  'sens',
  'themes',
  'statut',
  'scrutin_url',
  'sources',
] as const;

export type FrontValue = string | number | null | string[];

export interface ParsedFiche {
  front: Map<string, FrontValue>;
  /** Titre de niveau 1 : la question. */
  title: string | null;
  /** Texte entre le titre et la première section : le résumé en une phrase. */
  intro: string;
  /** Corps des sections de niveau 2, par titre. */
  sections: Map<string, string>;
  /** Lignes d'en-tête impossibles à lire. */
  unreadable: string[];
}

function parseScalar(raw: string): FrontValue {
  const value = raw.trim();
  if (value === '' || value === 'null' || value === '~') return null;
  if (value.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'string')) return parsed as string[];
    } catch {
      // liste écrite à la main : [a, b]
    }
    return value
      .slice(1, value.endsWith(']') ? -1 : undefined)
      .split(',')
      .map((v) => v.trim().replace(/^["']|["']$/g, ''))
      .filter((v) => v.length > 0);
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value.startsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed === 'string') return parsed;
    } catch {
      // guillemets non équilibrés : on garde le texte brut
    }
  }
  return value.replace(/^["']|["']$/g, '');
}

export function parseFiche(markdown: string): ParsedFiche {
  const front = new Map<string, FrontValue>();
  const unreadable: string[] = [];
  const sections = new Map<string, string>();
  let title: string | null = null;

  const lines = markdown.split(/\r?\n/);
  let i = 0;
  if (lines[0]?.trim() === '---') {
    i = 1;
    while (i < lines.length && lines[i]?.trim() !== '---') {
      const line = lines[i] ?? '';
      const match = /^([A-Za-z0-9_-]+):\s?(.*)$/.exec(line);
      if (match?.[1]) front.set(match[1], parseScalar(match[2] ?? ''));
      else if (line.trim() !== '') unreadable.push(line);
      i += 1;
    }
    i += 1;
  }

  let current: string | null = null;
  const buffer: string[] = [];
  const introLines: string[] = [];
  const flush = (): void => {
    if (current !== null) sections.set(current, buffer.join('\n').trim());
    buffer.length = 0;
  };
  for (; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (/^# /.test(line) && title === null) {
      title = line.slice(2).trim();
      continue;
    }
    const heading = /^## (.+)$/.exec(line);
    if (heading?.[1]) {
      flush();
      current = heading[1].trim();
      continue;
    }
    if (current !== null) buffer.push(line);
    else if (title !== null) introLines.push(line);
  }
  flush();
  return { front, title, intro: introLines.join('\n').trim(), sections, unreadable };
}

export function frontString(fiche: ParsedFiche, key: string): string | null {
  const v = fiche.front.get(key);
  return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : null;
}

export function frontList(fiche: ParsedFiche, key: string): string[] | null {
  const v = fiche.front.get(key);
  return Array.isArray(v) ? v : null;
}

/** Statut de la fiche ; brouillon par défaut ou si la valeur est inconnue. */
export function parseStatut(fiche: ParsedFiche): Statut {
  const s = frontString(fiche, 'statut');
  return STATUTS.includes(s as Statut) ? (s as Statut) : 'brouillon';
}

const hasPlaceholder = (v: FrontValue | undefined): boolean =>
  typeof v === 'string' ? v.includes(PLACEHOLDER) : Array.isArray(v) && v.some((x) => x.includes(PLACEHOLDER));

/** Noms des champs (en-tête, titre, introduction, sections) qui contiennent encore « À RÉDIGER ». */
export function remainingPlaceholders(fiche: ParsedFiche): string[] {
  const names: string[] = [];
  for (const [key, value] of fiche.front) if (hasPlaceholder(value)) names.push(key);
  if (fiche.title?.includes(PLACEHOLDER)) names.push('titre');
  if (fiche.intro.includes(PLACEHOLDER)) names.push('introduction');
  for (const [name, body] of fiche.sections) if (body.includes(PLACEHOLDER)) names.push(name);
  return names;
}

/** Puces (« - … ») d'une section. */
export const bulletsOf = (body: string | undefined): string[] =>
  (body ?? '')
    .split('\n')
    .filter((l) => l.trim().startsWith('- '))
    .map((l) => l.trim().slice(2).trim());

export interface CheckOptions {
  knownThemes: ReadonlySet<string>;
  selectedUids: ReadonlySet<string>;
  /** Nom de fichier attendu : <uid>.md. */
  fileName: string;
}

/** Vocabulaire manifestement orienté, à signaler. */
const EVALUATIVE =
  /\b(courageu(x|se)|scandaleu(x|se)|casse sociale|bon sens|dangereu(x|se) pour la démocratie|enfin)\b/i;

/** Contrôles de forme. Les « problèmes » bloquent la publication, les « avertissements » sont à relire. */
export function checkFiche(fiche: ParsedFiche, options: CheckOptions): { problems: string[]; warnings: string[] } {
  const problems: string[] = [];
  const warnings: string[] = [];
  const draft = parseStatut(fiche) === 'brouillon';
  const flag = (message: string): void => void (draft ? warnings : problems).push(message);

  for (const line of fiche.unreadable) problems.push(`Ligne d'en-tête illisible : ${line}`);
  const uid = frontString(fiche, 'uid');
  if (!uid) problems.push('En-tête : « uid » manquant.');
  else {
    if (`${uid}.md` !== options.fileName)
      problems.push(`En-tête : uid ${uid} ne correspond pas au nom du fichier ${options.fileName}.`);
    if (!options.selectedUids.has(uid)) warnings.push(`${uid} n'est pas (ou plus) dans data/content/selection.json.`);
  }
  for (const key of REQUIRED_FRONT_KEYS) if (!fiche.front.has(key)) problems.push(`En-tête : « ${key} » manquant.`);
  const statut = frontString(fiche, 'statut');
  if (statut !== null && !STATUTS.includes(statut as Statut))
    problems.push(`En-tête : statut « ${statut} » inconnu (${STATUTS.join(', ')}).`);

  const leftovers = remainingPlaceholders(fiche);
  if (leftovers.length > 0) flag(`Champs encore à rédiger : ${leftovers.join(', ')}.`);

  const question = frontString(fiche, 'question') ?? '';
  if (!question.includes(PLACEHOLDER)) {
    if (question.trim() === '') problems.push('La question est vide.');
    else {
      if (!question.trim().endsWith('?')) problems.push("La question ne se termine pas par un point d'interrogation.");
      if (question.length > 140)
        warnings.push(`La question fait ${question.length} caractères (140 maximum souhaités).`);
      if (/\bne\b.*\bpas\b.*\bne\b.*\bpas\b/i.test(question))
        warnings.push('La question contient une double négation.');
      if (fiche.title !== null && fiche.title.trim() !== question.trim())
        problems.push("Le titre de niveau 1 ne reprend pas la question de l'en-tête.");
    }
  }
  const sens = frontString(fiche, 'sens') ?? '';
  if (!sens.includes(PLACEHOLDER) && sens !== 'pour' && sens !== 'contre')
    problems.push(`En-tête : sens « ${sens} » invalide (pour ou contre).`);

  const themes = frontList(fiche, 'themes');
  if (themes) {
    const unknown = themes.filter((t) => !options.knownThemes.has(t));
    if (unknown.length > 0) problems.push(`Thèmes inconnus : ${unknown.join(', ')}.`);
    if (themes.length === 0 && !draft) problems.push('Aucun thème attribué.');
  } else if (fiche.front.has('themes')) problems.push('En-tête : « themes » doit être une liste.');

  const sources = (frontList(fiche, 'sources') ?? []).filter((u) => /^https?:\/\//.test(u));
  if (sources.length === 0) flag('Aucune source (en-tête « sources ») : chaque fiche doit lier ses sources.');

  for (const section of SECTION_TITLES)
    if (!fiche.sections.has(section)) problems.push(`Section manquante : « ${section} ».`);
  const measures = fiche.sections.get(SECTIONS.measures) ?? '';
  const count = bulletsOf(measures).length;
  if (!measures.includes(PLACEHOLDER) && count < 2)
    warnings.push(`« ${SECTIONS.measures} » liste ${count} point(s), au moins deux attendus.`);
  for (const section of [SECTIONS.pour, SECTIONS.contre]) {
    const body = fiche.sections.get(section) ?? '';
    if (!body.includes(PLACEHOLDER) && bulletsOf(body).length === 0)
      warnings.push(`« ${section} » ne contient aucun argument.`);
  }
  for (const [name, body] of fiche.sections) {
    if (name !== SECTIONS.toCheck && EVALUATIVE.test(body))
      warnings.push(`« ${name} » contient un vocabulaire possiblement orienté.`);
  }
  return { problems, warnings };
}

/** Une fiche réduite à ce qui permet de repérer deux lectures du même texte. */
export interface FicheDossier {
  uid: string;
  /** En-tête `dossier_url` ; null si le scrutin n'a pas de dossier connu. */
  dossier: string | null;
}

/**
 * Fiches qui partagent un dossier législatif : deux lectures du même texte (première lecture et
 * texte final, par exemple), donc presque toujours la même question posée deux fois à l'utilisateur.
 * Un groupe est toléré si chacune de ses fiches est dans `allowed` (`allowSameDossier` de la sélection).
 */
export function sameDossierGroups(
  fiches: readonly FicheDossier[],
  allowed: ReadonlySet<string>,
): Array<{ dossier: string; uids: string[] }> {
  const byDossier = new Map<string, string[]>();
  for (const { uid, dossier } of fiches) if (dossier) byDossier.set(dossier, [...(byDossier.get(dossier) ?? []), uid]);
  return [...byDossier.entries()]
    .filter(([, uids]) => uids.length > 1 && !uids.every((uid) => allowed.has(uid)))
    .map(([dossier, uids]) => ({ dossier, uids }));
}
