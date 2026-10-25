import type { GroupVote, Legislature, Position, Scrutin, TextType, VoteKind } from '#data/model/types.ts';
import { asArray, type RawGroupe, type RawScrutinFile, toInt } from '#scripts/assemblee/raw-types.ts';
import { scrutinPageUrl } from '#scripts/paths.ts';
import { tidyTitle } from '#scripts/text.ts';

export function classifyKind(title: string): VoteKind {
  const t = tidyTitle(title).toLowerCase();
  if (t.startsWith("l'ensemble")) return 'ensemble';
  if (t.startsWith('le sous-amendement') || t.startsWith('les sous-amendements')) return 'sous-amendement';
  if (t.startsWith("l'amendement") || t.startsWith('les amendements')) return 'amendement';
  if (t.startsWith("l'article")) return 'article';
  if (t.startsWith('la motion') || t.includes('motion de censure') || t.includes('motion de rejet')) return 'motion';
  // Texte entier mis aux voix sans le mot « ensemble » : résolutions, Congrès (projet de loi constitutionnelle).
  if (
    t.startsWith('la proposition de résolution') ||
    t.startsWith('le projet de loi') ||
    t.startsWith('la proposition de loi')
  )
    return 'ensemble';
  if (t.startsWith('la demande de')) return 'procedure';
  return 'autre';
}

export function classifyTextType(title: string): TextType {
  const t = tidyTitle(title).toLowerCase();
  if (t.includes('projet de loi')) return 'projet-de-loi';
  if (t.includes('proposition de loi')) return 'proposition-de-loi';
  if (t.includes('proposition de résolution') || t.includes('proposition de resolution'))
    return 'proposition-de-resolution';
  if (t.includes('déclaration du gouvernement')) return 'declaration-du-gouvernement';
  return 'autre';
}

function parsePosition(value: string | null | undefined): Position | null {
  const v = (value ?? '').toLowerCase();
  return v === 'pour' || v === 'contre' || v === 'abstention' ? v : null;
}

function parseGroup(raw: RawGroupe): GroupVote {
  const counts = raw.vote?.decompteVoix;
  return {
    groupRef: raw.organeRef,
    members: toInt(raw.nombreMembresGroupe),
    pour: toInt(counts?.pour),
    contre: toInt(counts?.contre),
    abstention: toInt(counts?.abstentions),
    nonVotants: toInt(counts?.nonVotants),
    officialMajority: parsePosition(raw.vote?.positionMajoritaire),
  };
}

export function parseScrutin(file: RawScrutinFile, legislature: Legislature): Scrutin {
  const s = file.scrutin;
  const title = tidyTitle(s.titre ?? s.objet?.libelle ?? '');
  const dossier = s.objet?.dossierLegislatif;
  const dossierRef = typeof dossier === 'string' ? dossier : (dossier?.dossierRef ?? null);
  const dossierTitle = dossier && typeof dossier === 'object' && dossier.libelle ? tidyTitle(dossier.libelle) : null;
  const totals = s.syntheseVote?.decompte;
  const voteType = s.typeVote?.codeTypeVote ?? 'SPO';
  const numero = toInt(s.numero);

  return {
    uid: s.uid,
    legislature,
    numero,
    date: s.dateScrutin,
    title,
    kind: voteType === 'MOC' ? 'motion' : classifyKind(title),
    textType: classifyTextType(title),
    voteType,
    solemn: voteType === 'SPS',
    result: (s.sort?.code ?? '').toLowerCase().startsWith('adopt') ? 'adopte' : 'rejete',
    dossierRef,
    dossierTitle,
    totals: {
      pour: toInt(totals?.pour),
      contre: toInt(totals?.contre),
      abstention: toInt(totals?.abstentions),
      nonVotants: toInt(totals?.nonVotants),
      votants: toInt(s.syntheseVote?.nombreVotants),
      exprimes: toInt(s.syntheseVote?.suffragesExprimes),
    },
    groups: asArray(s.ventilationVotes?.organe?.groupes?.groupe).map(parseGroup),
    sourceUrl: scrutinPageUrl(legislature, numero),
  };
}
