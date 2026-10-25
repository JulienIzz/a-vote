/** Une question brute complète, pour les tests des modules questions, votes et scores. */
import type { AppQuestion } from '#data/model/app-data.ts';

export const rawQuestion: AppQuestion = {
  uid: 'VTANR5L17V8431',
  legislature: 17,
  date: '2026-07-21',
  question: 'Faut-il interdire les réseaux sociaux aux moins de 15 ans ?',
  sens: 'pour',
  themes: ['numerique', 'enfance-jeunesse'],
  statut: 'relu',
  summary: 'Le texte interdit l’inscription des moins de 15 ans sur les réseaux sociaux.',
  measures: ['Interdiction d’inscription avant 15 ans.', 'Vérification de l’âge par les plateformes.'],
  pour: ['Selon les auteurs, protéger la santé mentale des adolescents.'],
  contre: ['Pour les députés LFI, une mesure inefficace.'],
  context: 'Texte de commission mixte paritaire adopté le 21 juillet 2026.',
  officialTitle:
    "l'ensemble de la proposition de loi visant à protéger les mineurs (texte de la commission mixte paritaire).",
  result: 'adopte',
  totals: { pour: 279, contre: 81, abstention: 66, votants: 426 },
  urls: {
    scrutin: 'https://www.assemblee-nationale.fr/dyn/17/scrutins/8431',
    dossier: 'https://www.assemblee-nationale.fr/dyn/17/dossiers/proteger_mineurs_reseaux_sociaux_17e',
    texte: 'https://www.assemblee-nationale.fr/dyn/17/textes/l17b2107_proposition-loi',
  },
  sources: [
    { label: 'Le scrutin sur assemblee-nationale.fr', url: 'https://www.assemblee-nationale.fr/dyn/17/scrutins/8431' },
    {
      label: 'Le dossier législatif',
      url: 'https://www.assemblee-nationale.fr/dyn/17/dossiers/proteger_mineurs_reseaux_sociaux_17e',
    },
  ],
  votes: [
    { familyId: 'lfi', pour: 0, contre: 63, abstention: 0, members: 71 },
    { familyId: 'soc', pour: 30, contre: 0, abstention: 28, members: 68 },
    { familyId: 'epr', pour: 83, contre: 0, abstention: 0, members: 91 },
    { familyId: 'rn', pour: 0, contre: 2, abstention: 14, members: 122 },
  ],
};

export const rawQuestionDraft: AppQuestion = {
  ...rawQuestion,
  uid: 'VTANR5L16V1462',
  date: '2023-05-04',
  question: 'Faut-il mettre fin à l’obligation vaccinale des soignants ?',
  themes: ['sante'],
  statut: 'brouillon',
  votes: [{ familyId: 'lfi', pour: 52, contre: 0, abstention: 0, members: 75 }],
};
