/**
 * Commande `build` : compile les fiches relues, les votes, la méthode et les sources en JSON pour l'app,
 * dans data/app/. Ne lit que data/content/ et data/cache/normalized/ : jamais le réseau.
 * Les questions sont coupées en deux : un index léger (questions.json), chargé d'emblée, et le texte long
 * de chaque fiche (fiches/<uid>.json), que l'app ne charge qu'à l'affichage de la question.
 */
import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import type {
  AppCandidates,
  AppDataset,
  AppFamily,
  AppMethode,
  AppQuestion,
  AppQuestionDetail,
  AppQuestionIndex,
  AppSources,
  AppTheme,
} from '#data/model/app-data.ts';
import { legislatureRoman } from '#data/model/types.ts';
import { frontString } from '#scripts/content/fiche.ts';
import { ficheToQuestion, type QuestionConversion } from '#scripts/content/question.ts';
import { familyLines } from '#scripts/content/votes.ts';
import { exists, readJson, rel, writeJson } from '#scripts/fs.ts';
import {
  APP_DIR,
  APP_FICHES_DIR,
  CANDIDATS_FILE,
  LEGISLATURES,
  MANIFEST_FILE,
  METHODE_FILE,
  ORGANES_SOURCE,
  ROOT_DIR,
  scrutinsSource,
} from '#scripts/paths.ts';
import type { ImportManifest } from '#scripts/steps/import.ts';
import { loadFiches, loadWorkspace } from '#scripts/steps/workspace.ts';

export interface BuildOptions {
  /** Embarque aussi les fiches encore en brouillon (pour développer l'app). */
  drafts: boolean;
}

const LICENCE = 'Licence Ouverte 2.0 (Etalab)';

export async function runBuild(options: BuildOptions): Promise<void> {
  const ws = await loadWorkspace();
  const fiches = await loadFiches();
  const questions: AppQuestion[] = [];
  const rejected = new Map<string, string[]>();
  for (const { file, parsed } of fiches) {
    const uid = frontString(parsed, 'uid') ?? file.replace(/\.md$/, '');
    const scrutin = ws.scrutins.get(uid);
    const result: QuestionConversion = ficheToQuestion({
      parsed,
      scrutin,
      families: scrutin ? familyLines(scrutin, ws.index, ws.mapping) : [],
      knownThemes: ws.knownThemes,
      drafts: options.drafts,
    });
    if (result.ok) questions.push(result.question);
    else rejected.set(result.reason, [...(rejected.get(result.reason) ?? []), `${file} (${result.detail})`]);
  }
  questions.sort((a, b) => b.date.localeCompare(a.date));

  const families: AppFamily[] = ws.mapping.families.map((f) => ({
    id: f.id,
    label: f.label,
    shortLabel: f.shortLabel,
    color: f.color,
  }));
  const themes: AppTheme[] = ws.themesFile.themes.map((t) => ({ id: t.id, label: t.label }));
  await mkdir(APP_DIR, { recursive: true });
  // Le dossier est recréé à chaque build : une fiche retirée ne laisse pas de JSON orphelin.
  await rm(APP_FICHES_DIR, { recursive: true, force: true });
  await mkdir(APP_FICHES_DIR);
  const index: AppQuestionIndex[] = [];
  for (const question of questions) {
    const { measures, pour, contre, context, sources, ...entry } = question;
    const detail: AppQuestionDetail = { uid: question.uid, measures, pour, contre, context, sources };
    index.push(entry);
    await writeJson(path.join(APP_FICHES_DIR, `${question.uid}.json`), detail);
  }
  await writeJson(path.join(APP_DIR, 'questions.json'), index);
  await writeJson(path.join(APP_DIR, 'families.json'), families);
  await writeJson(path.join(APP_DIR, 'themes.json'), themes);
  await writeJson(path.join(APP_DIR, 'methode.json'), await buildMethode());
  await writeJson(path.join(APP_DIR, 'sources.json'), await buildSources());
  await writeJson(path.join(APP_DIR, 'candidats.json'), await buildCandidats());
  console.log(
    `${questions.length} question(s) embarquée(s) → ${rel(APP_DIR)}/questions.json + fiches/ (+ families, themes, methode, sources, candidats)`,
  );
  const labels: Record<string, string> = {
    incomplete: 'incomplète(s), laissée(s) de côté',
    brouillon: 'brouillon(s) complet(s) non embarqué(s) (passer en « relu », ou --drafts)',
    sens: 'au sens invalide',
    illisible: 'à l’en-tête illisible',
    inconnue: 'sans scrutin normalisé correspondant',
  };
  for (const [reason, files] of rejected)
    console.log(`${files.length} fiche(s) ${labels[reason] ?? reason} : ${files.join(', ')}`);
}

/** Les candidatures à la présidentielle, recopiées sans le commentaire de data/content/candidats.json. */
async function buildCandidats(): Promise<AppCandidates> {
  const { election, checkedAt, candidates, pending } = await readJson<AppCandidates>(CANDIDATS_FILE);
  return { election, checkedAt, candidates, pending };
}

/** La méthode de calcul affichée dans l'app, depuis data/content/METHODE.md. */
async function buildMethode(): Promise<AppMethode> {
  const markdown = await readFile(METHODE_FILE, 'utf8');
  const title = /^# (.+)$/m.exec(markdown)?.[1]?.trim() ?? 'Comment ça marche';
  return { title, markdown: markdown.trim() };
}

function datasetName(url: string): string {
  const legislature = LEGISLATURES.find((l) => url === scrutinsSource(l).url);
  if (legislature) return `Scrutins de la ${legislatureRoman(legislature)} législature`;
  if (url === ORGANES_SOURCE.url) return 'Acteurs, mandats et organes depuis 1997 (groupes politiques)';
  return url;
}

/** Les jeux de données et leur date d'import, pour la page « D'où viennent les données ». */
async function buildSources(): Promise<AppSources> {
  const manifest = (await exists(MANIFEST_FILE)) ? await readJson<ImportManifest>(MANIFEST_FILE) : null;
  const pkg = await readJson<{ repository?: string | { url?: string } }>(path.join(ROOT_DIR, 'package.json'));
  const repository = typeof pkg.repository === 'string' ? pkg.repository : (pkg.repository?.url ?? null);
  const known = [ORGANES_SOURCE.url, ...LEGISLATURES.map((l) => scrutinsSource(l).url)];
  const datasets: AppDataset[] = known.map((url) => {
    const archive = manifest?.archives.find((a) => a.url === url);
    return {
      name: datasetName(url),
      url,
      licence: LICENCE,
      bytes: archive?.bytes ?? null,
      modifiedAt: archive?.modifiedAt ?? null,
    };
  });
  return {
    importedAt: manifest?.importedAt ?? null,
    datasets,
    website: 'https://www.assemblee-nationale.fr',
    repository,
  };
}
