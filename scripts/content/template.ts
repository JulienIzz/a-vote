/**
 * Gabarit d'une fiche : en-tête, tableau des votes et liens préremplis, champs éditoriaux « À RÉDIGER ».
 * Chaîne : collect (contexte) → scaffold écrit ce gabarit → rédaction → check.
 */
import { toSourceLinks } from '#data/model/sources.ts';
import type { Scrutin } from '#data/model/types.ts';
import type { ScrutinContext } from '#scripts/assemblee/context.ts';
import { PLACEHOLDER, SECTIONS } from '#scripts/content/fiche.ts';
import { type FamilyLine, ficheTable } from '#scripts/content/votes.ts';

export interface ScaffoldInput {
  scrutin: Scrutin;
  context: ScrutinContext;
  families: FamilyLine[];
  /** Thèmes proposés par le classifieur, à vérifier. */
  themes: string[];
  /** Points à vérifier connus d'avance (limites de la collecte, consigne de sélection). */
  toCheck: string[];
  /** Toutes les URL consultées : archive open data, scrutin, dossier, texte, document brut. */
  sources: string[];
}

/** Scalaire YAML sûr : la syntaxe JSON des chaînes est du YAML valide. */
const yaml = (value: string | number | null | string[]): string =>
  Array.isArray(value) ? `[${value.map((v) => JSON.stringify(v)).join(', ')}]` : JSON.stringify(value);

export const ficheFileName = (uid: string): string => `${uid}.md`;

export function renderScaffold(input: ScaffoldInput): string {
  const { scrutin, context, families, themes, toCheck, sources } = input;
  const links = toSourceLinks(sources);
  const front: Array<[string, string | number | null | string[]]> = [
    ['uid', scrutin.uid],
    ['legislature', scrutin.legislature],
    ['numero', scrutin.numero],
    ['date', scrutin.date],
    ['titre_officiel', scrutin.title],
    ['question', PLACEHOLDER],
    ['sens', PLACEHOLDER],
    ['themes', themes],
    ['resultat', scrutin.result],
    ['votants', scrutin.totals.votants],
    ['statut', 'brouillon'],
    ['scrutin_url', scrutin.sourceUrl],
    ['dossier_url', context.dossier?.url ?? null],
    ['texte_url', context.text?.url ?? null],
    ['sources', links.map((l) => l.url)],
  ];
  const section = (title: string, body: string): string[] => [`## ${title}`, '', body, ''];
  const result = `Scrutin du ${scrutin.date}, ${scrutin.result === 'adopte' ? 'adopté' : 'rejeté'} : ${scrutin.totals.pour} pour, ${scrutin.totals.contre} contre, ${scrutin.totals.abstention} abstentions.`;

  return [
    '---',
    ...front.map(([key, value]) => `${key}: ${yaml(value)}`),
    '---',
    '',
    `# ${PLACEHOLDER}`,
    '',
    `${PLACEHOLDER} : ce que le texte change, en une phrase.`,
    '',
    ...section(SECTIONS.measures, `- ${PLACEHOLDER}\n- ${PLACEHOLDER}`),
    ...section(SECTIONS.pour, `- ${PLACEHOLDER} (argument attribué : « Selon les auteurs du texte… »)`),
    ...section(SECTIONS.contre, `- ${PLACEHOLDER} (argument attribué aux groupes qui ont voté contre)`),
    ...section(SECTIONS.context, `${PLACEHOLDER} : origine du texte, stade du vote, devenir connu, mises en garde.`),
    ...section(SECTIONS.votes, `${result}\n\n${ficheTable(families)}`),
    ...section(SECTIONS.links, links.map((l) => `- [${l.label}](${l.url})`).join('\n')),
    ...section(
      SECTIONS.toCheck,
      toCheck.length > 0 ? toCheck.map((item) => `- ${item}`).join('\n') : 'Aucun point signalé.',
    ),
  ].join('\n');
}
