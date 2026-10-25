/**
 * Dossier de lecture d'un scrutin pour la personne (ou l'assistant) qui rédige la fiche :
 * faits, votes, consigne, thèmes disponibles, sources en clair, et ce qu'il faut aller chercher ailleurs.
 */
import { legislatureLabel, type Scrutin } from '#data/model/types.ts';
import type { ScrutinContext } from '#scripts/assemblee/context.ts';
import { briefTable, type FamilyLine } from '#scripts/content/votes.ts';

export interface BriefInput {
  scrutin: Scrutin;
  context: ScrutinContext;
  families: FamilyLine[];
  themes: ReadonlyArray<{ id: string; label: string }>;
  /** Note libre laissée lors de la sélection (consigne éditoriale). */
  editorialNote: string | null;
}

export function buildBrief(input: BriefInput): string {
  const { scrutin, context, families, themes, editorialNote } = input;
  const parts: string[] = [];

  parts.push(`# Brief ${scrutin.uid}`, '');
  parts.push(
    `Règles de rédaction : \`data/content/REDACTION.md\`. Gabarit à compléter : \`data/content/fiches/${scrutin.uid}.md\`.`,
    '',
  );
  parts.push('## Le scrutin', '');
  parts.push(`- Législature : ${legislatureLabel(scrutin.legislature)}`);
  parts.push(`- Date du vote : ${scrutin.date}`);
  parts.push(`- Intitulé officiel : ${scrutin.title}`);
  if (scrutin.dossierTitle) parts.push(`- Dossier législatif : ${scrutin.dossierTitle}`);
  parts.push(
    `- Nature du vote : ${scrutin.kind}${scrutin.solemn ? ' (scrutin solennel)' : ''}, type de texte : ${scrutin.textType}`,
  );
  parts.push(
    `- Résultat : ${scrutin.result === 'adopte' ? 'adopté' : 'rejeté'} — ${scrutin.totals.pour} pour, ${scrutin.totals.contre} contre, ${scrutin.totals.abstention} abstentions, ${scrutin.totals.votants} votants sur 577 députés`,
  );
  parts.push(`- Page officielle : ${scrutin.sourceUrl}`);
  parts.push('', '## Votes par famille politique', '', briefTable(families));

  if (editorialNote) parts.push('', '## Consigne laissée à la sélection', '', editorialNote);

  parts.push('', '## Thèmes disponibles (identifiant : libellé)', '');
  for (const t of themes) parts.push(`- ${t.id} : ${t.label}`);

  parts.push('', '## Sources récupérées sur assemblee-nationale.fr', '');
  if (context.dossier) parts.push(`- Dossier : ${context.dossier.title} (${context.dossier.url})`);
  if (context.text)
    parts.push(
      `- Texte déposé : ${context.text.title}${context.text.number ? ` (n° ${context.text.number})` : ''}, ${context.text.kind} (${context.text.url})`,
    );
  if (context.compteRenduUrl)
    parts.push(
      `- Compte rendu de la séance (interventions et explications de vote des groupes) : ${context.compteRenduUrl}`,
    );
  if (context.warnings.length > 0) parts.push(`- Limites de la collecte : ${context.warnings.join(' ; ')}`);
  parts.push(
    '',
    '## Ce que le brief ne contient pas',
    '',
    '- Les arguments des opposants : dans le compte rendu de la séance ci-dessus (explications de vote) et le rapport de la commission, accessibles depuis le dossier législatif.',
    "- L'auteur du texte et son groupe, et s'il s'agit d'une niche parlementaire : en tête du dossier législatif.",
    '- Le devenir du texte (Sénat, promulgation, censure) : sur le dossier législatif, ou sur vie-publique.fr.',
    '- Tout argument « Contre » écrit sans ces sources doit être signalé dans « À vérifier avant publication ».',
  );

  if (context.exposeDesMotifs) parts.push('', '### Exposé des motifs du texte déposé', '', context.exposeDesMotifs);
  else
    parts.push(
      '',
      "### Exposé des motifs : introuvable côté Assemblée. S'appuyer sur l'intitulé officiel et, si le texte vient du Sénat, sur senat.fr.",
    );
  if (context.articles) parts.push('', '### Articles du texte déposé (extrait)', '', context.articles);

  return `${parts.join('\n')}\n`;
}
