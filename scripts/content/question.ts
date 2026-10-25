/**
 * Conversion d'une fiche rédigée en question embarquée par l'app (data/app/questions.json).
 * Fonction pure : la fiche lue, le scrutin normalisé et les votes par famille en entrée, sans accès disque.
 */
import type { AppQuestion } from '#data/model/app-data.ts';
import type { SourceLink } from '#data/model/sources.ts';
import { toSourceLinks } from '#data/model/sources.ts';
import type { Scrutin } from '#data/model/types.ts';
import {
  bulletsOf,
  frontList,
  frontString,
  type ParsedFiche,
  parseStatut,
  remainingPlaceholders,
  SECTIONS,
} from '#scripts/content/fiche.ts';
import type { FamilyLine } from '#scripts/content/votes.ts';

export interface QuestionInput {
  parsed: ParsedFiche;
  /** Scrutin normalisé correspondant à l'uid de la fiche, undefined s'il est inconnu. */
  scrutin: Scrutin | undefined;
  families: FamilyLine[];
  knownThemes: ReadonlySet<string>;
  /** Embarquer aussi les brouillons. */
  drafts: boolean;
}

export type QuestionConversion =
  | { ok: true; question: AppQuestion }
  | { ok: false; reason: 'inconnue' | 'illisible' | 'incomplete' | 'sens' | 'brouillon'; detail: string };

export function ficheToQuestion(input: QuestionInput): QuestionConversion {
  const { parsed, scrutin, families, knownThemes, drafts } = input;
  if (!scrutin) return { ok: false, reason: 'inconnue', detail: 'uid absent des scrutins normalisés' };
  if (parsed.unreadable.length > 0)
    return { ok: false, reason: 'illisible', detail: `en-tête illisible : ${parsed.unreadable.join(' | ')}` };
  const leftovers = remainingPlaceholders(parsed);
  if (leftovers.length > 0) return { ok: false, reason: 'incomplete', detail: `à rédiger : ${leftovers.join(', ')}` };
  const question = frontString(parsed, 'question');
  const sens = frontString(parsed, 'sens');
  if (!question || (sens !== 'pour' && sens !== 'contre'))
    return { ok: false, reason: 'sens', detail: `question ou sens invalide (sens : ${sens ?? 'absent'})` };
  const statut = parseStatut(parsed);
  if (statut === 'brouillon' && !drafts)
    return { ok: false, reason: 'brouillon', detail: 'passer en « relu », ou --drafts' };

  // Les sources de l'en-tête, complétées par les liens que la rédaction a ajoutés dans « Pour aller plus loin ».
  const sources = toSourceLinks(frontList(parsed, 'sources') ?? [scrutin.sourceUrl]);
  for (const link of markdownLinks(parsed.sections.get(SECTIONS.links))) {
    if (!sources.some((s) => s.url === link.url)) sources.push(link);
  }
  return {
    ok: true,
    question: {
      uid: scrutin.uid,
      legislature: scrutin.legislature,
      date: scrutin.date,
      question: question.trim(),
      sens,
      themes: (frontList(parsed, 'themes') ?? []).filter((t) => knownThemes.has(t)),
      statut,
      summary: parsed.intro,
      measures: bulletsOf(parsed.sections.get(SECTIONS.measures)),
      pour: bulletsOf(parsed.sections.get(SECTIONS.pour)),
      contre: bulletsOf(parsed.sections.get(SECTIONS.contre)),
      context: parsed.sections.get(SECTIONS.context) ?? '',
      officialTitle: scrutin.title,
      result: scrutin.result,
      totals: {
        pour: scrutin.totals.pour,
        contre: scrutin.totals.contre,
        abstention: scrutin.totals.abstention,
        votants: scrutin.totals.votants,
      },
      urls: {
        scrutin: scrutin.sourceUrl,
        dossier: frontString(parsed, 'dossier_url'),
        texte: frontString(parsed, 'texte_url'),
      },
      sources,
      votes: families.map((f) => ({
        familyId: f.id,
        pour: f.pour,
        contre: f.contre,
        abstention: f.abstention,
        members: f.members,
      })),
    },
  };
}

/** Les liens Markdown « - [libellé](url) » d'une section. */
export function markdownLinks(body: string | undefined): SourceLink[] {
  return [...(body ?? '').matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => ({
    label: (m[1] ?? '').trim(),
    url: m[2] ?? '',
  }));
}
