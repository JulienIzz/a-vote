/** Fixtures partagées par les tests de content/ : le scrutin n° 8431 (XVIIe, 21 juillet 2026), vrais chiffres. */
import type { Scrutin } from '#data/model/types.ts';
import type { ScrutinContext } from '#scripts/assemblee/context.ts';
import { PLACEHOLDER } from '#scripts/content/fiche.ts';
import { renderScaffold } from '#scripts/content/template.ts';
import type { FamilyLine } from '#scripts/content/votes.ts';

export const scrutin: Scrutin = {
  uid: 'VTANR5L17V8431',
  legislature: 17,
  numero: 8431,
  date: '2026-07-21',
  title: "l'ensemble de la proposition de loi visant à protéger les mineurs (texte de la commission mixte paritaire).",
  kind: 'ensemble',
  textType: 'proposition-de-loi',
  voteType: 'SPS',
  solemn: true,
  result: 'adopte',
  dossierRef: 'DLR5L17N53187',
  dossierTitle: 'Protéger les mineurs des risques des réseaux sociaux',
  totals: { pour: 279, contre: 81, abstention: 66, nonVotants: 2, votants: 426, exprimes: 360 },
  groups: [],
  sourceUrl: 'https://www.assemblee-nationale.fr/dyn/17/scrutins/8431',
};

export const context: ScrutinContext = {
  uid: scrutin.uid,
  legislature: 17,
  collectedAt: '2026-10-25T00:00:00.000Z',
  scrutinUrl: scrutin.sourceUrl,
  compteRenduUrl: 'https://www.assemblee-nationale.fr/dyn/17/comptes-rendus/seance/x',
  dossier: { url: 'https://www.assemblee-nationale.fr/dyn/17/dossiers/x', title: 'Dossier X' },
  text: {
    url: 'https://www.assemblee-nationale.fr/dyn/17/textes/l17b2107_proposition-loi',
    title: 'Proposition de loi n° 2107',
    number: '2107',
    kind: 'proposition-de-loi',
  },
  exposeDesMotifs: 'Mesdames, Messieurs, les réseaux sociaux exposent les mineurs…',
  articles: null,
  sources: [],
  warnings: ['articles introuvables'],
};

export const families: FamilyLine[] = [
  { id: 'lfi', label: 'La France insoumise', pour: 0, contre: 63, abstention: 0, members: 71, net: -1 },
  { id: 'rn', label: 'Rassemblement national', pour: 0, contre: 2, abstention: 14, members: 122, net: -0.125 },
];

export const sources = [
  'https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip',
  scrutin.sourceUrl,
  context.dossier?.url ?? '',
  context.text?.url ?? '',
  'https://www.assemblee-nationale.fr/dyn/docs/PIONANR5L17B2107.raw',
];

/** Le gabarit tel que `scaffold` l'écrit. */
export const skeleton = renderScaffold({ scrutin, context, families, themes: ['numerique'], toCheck: [], sources });

/** Le gabarit entièrement rédigé. */
export const filled = skeleton
  .replace(`question: "${PLACEHOLDER}"`, 'question: "Faut-il interdire les réseaux sociaux aux moins de 15 ans ?"')
  .replace(`sens: "${PLACEHOLDER}"`, 'sens: "pour"')
  .replace(`# ${PLACEHOLDER}`, '# Faut-il interdire les réseaux sociaux aux moins de 15 ans ?')
  .replace(
    `${PLACEHOLDER} : ce que le texte change, en une phrase.`,
    'Le texte interdit l’inscription des moins de 15 ans sur les réseaux sociaux.',
  )
  .replace(
    `- ${PLACEHOLDER}\n- ${PLACEHOLDER}`,
    '- Interdiction d’inscription avant 15 ans.\n- Vérification de l’âge par les plateformes.',
  )
  .replace(
    /- À RÉDIGER \(argument attribué : « Selon les auteurs du texte… »\)/,
    '- Selon les auteurs, protéger la santé mentale des adolescents.',
  )
  .replace(
    /- À RÉDIGER \(argument attribué aux groupes qui ont voté contre\)/,
    '- Pour les députés LFI, une mesure inefficace.',
  )
  .replace(
    `${PLACEHOLDER} : origine du texte, stade du vote, devenir connu, mises en garde.`,
    'Texte de commission mixte paritaire adopté le 21 juillet 2026.',
  );
