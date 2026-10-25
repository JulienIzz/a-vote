/** Point d'entrée `pnpm data <commande>` : analyse des options, puis délégation à scripts/steps/<commande>.ts. */
import { parseArgs } from 'node:util';
import { parseLegislatures } from '#scripts/paths.ts';

const USAGE = `Usage : pnpm data <commande> [options]

Open data
  download     Télécharge les archives de l'Assemblée dans data/cache/archives/
  import       Télécharge si besoin, puis normalise scrutins et groupes dans data/cache/normalized/
  shortlist    Classe les scrutins candidats par thème et discriminance dans data/cache/shortlist/

Fiches
  collect      Rassemble le contexte (dossier, exposé des motifs) des textes sélectionnés dans data/cache/context/
  brief        Écrit un dossier de lecture par texte sélectionné dans data/cache/briefs/
  scaffold     Crée les squelettes de fiches manquants dans data/content/fiches/
  check        Vérifie les fiches (en-tête, sections, sens, thèmes, sources, champs à rédiger)
  build        Compile les fiches relues et les votes dans data/app/ pour l'app (--drafts : brouillons inclus)

Options, par commande
  import, shortlist, collect, brief, scaffold
      -l, --legislature 16,17   législatures à traiter (défaut : toutes)
  import --force                retélécharge les archives (elles changent chaque jour)
  shortlist --top 150 --themes a,b --all-kinds
  shortlist --new               seulement les textes pas encore tranchés dans selection.json
  collect, brief, scaffold
      --only uid1,uid2          ne traite que ces scrutins
      --limit 5                 ne traite que les N premiers
  collect --force               reconsulte le site au lieu du cache (brief --force : idem)
  scaffold --force              réécrit les gabarits encore vides (jamais une fiche rédigée)
  build --drafts                embarque aussi les brouillons complets
`;

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      legislature: { type: 'string', short: 'l' },
      force: { type: 'boolean', default: false },
      top: { type: 'string' },
      themes: { type: 'string' },
      'all-kinds': { type: 'boolean', default: false },
      new: { type: 'boolean', default: false },
      only: { type: 'string' },
      limit: { type: 'string' },
      drafts: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  const command = positionals[0];
  if (values.help || !command) {
    console.log(USAGE);
    return;
  }
  const common = { legislatures: parseLegislatures(values.legislature), force: values.force };
  const only = values.only
    ? values.only
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean)
    : null;
  const limit = values.limit ? Number(values.limit) : null;
  if (limit !== null && (!Number.isInteger(limit) || limit <= 0))
    throw new Error(`Option --limit invalide : ${values.limit}`);
  const scoped = { ...common, only, limit };

  switch (command) {
    case 'download': {
      const { runDownload } = await import('./steps/import.ts');
      await runDownload(common);
      break;
    }
    case 'import': {
      const { runImport } = await import('./steps/import.ts');
      await runImport(common);
      break;
    }
    case 'shortlist': {
      const { runShortlist } = await import('./steps/shortlist.ts');
      await runShortlist({
        legislatures: common.legislatures,
        top: values.top ? Number(values.top) : 150,
        themes: values.themes ? values.themes.split(',').map((t) => t.trim()) : null,
        allKinds: values['all-kinds'],
        onlyNew: values.new,
      });
      break;
    }
    case 'collect': {
      const { runCollect } = await import('./steps/collect.ts');
      await runCollect(scoped);
      break;
    }
    case 'brief': {
      const { runBrief } = await import('./steps/brief.ts');
      await runBrief(scoped);
      break;
    }
    case 'scaffold': {
      const { runScaffold } = await import('./steps/scaffold.ts');
      await runScaffold(scoped);
      break;
    }
    case 'check': {
      const { runCheck } = await import('./steps/check.ts');
      await runCheck();
      break;
    }
    case 'build': {
      const { runBuild } = await import('./steps/build.ts');
      await runBuild({ drafts: values.drafts });
      break;
    }
    default:
      console.error(`Commande inconnue : ${command}\n`);
      console.log(USAGE);
      process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
