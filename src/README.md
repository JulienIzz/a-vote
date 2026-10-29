# src/

Le site, organisé en modules métier. Chaque module a son `domain`, son `infra` et, quand il a
quelque chose à montrer, son `view` (composants React). La coquille du site vit dans `src/app/`.

```
src/main.tsx          point d'entrée : réhydrate les réponses sauvegardées puis monte React
src/app/App.tsx       la coquille : en-tête, routes, pied de page
src/app/container.ts  le câblage : dépôts embarqués et store des réponses, instanciés une fois
src/app/pages/        les pages du tunnel, qui composent les vues des modules :
                      accueil → question (puis récap de la question) → résultats ; la méthode ;
                      et l'onglet des candidatures à la présidentielle
src/app/styles.css    la feuille de style, mobile d'abord
```

Pile : Vite, React, react-router, react-markdown. `pnpm dev` pour développer, `pnpm build` pour
produire `dist/`.

```
src/modules/
  questions/    une question de l'app : texte, sens, résumé, mesures, arguments, sources, faits du scrutin ;
                composition d'un jeu de questions équilibré entre thèmes
  votes/        les familles politiques et leur vote sur chaque question : position, participation, fiabilité
  answers/      les réponses de l'utilisateur et sa progression : transitions pures, store, persistance locale
  scores/       l'accord avec chaque famille à partir des réponses et des votes, avec un niveau de confiance
  methodology/  la méthode de calcul et la provenance des données, pour les écrans de transparence
  candidates/   les candidatures déclarées à la présidentielle et le lien vers leur programme
```

## Un module

```
<module>/
  domain/   les types tels que l'interface les consomme, les méthodes métier (fonctions pures),
            les ports (ce que le domaine attend de l'infra), un store si l'état vit côté client
  infra/    les mappers du JSON brut (data/app, typé par data/model) vers le domaine,
            les dépôts en mémoire, la source de données embarquée, les adaptateurs de persistance
  view/     les composants React du module (un hook pour le store, une carte, un tableau…)
```

## Règles

- `domain` n'importe rien de `infra` ni de `view`. `infra` et `view` n'importent que `domain`.
- Entre modules, uniquement via les `domain` : `scores` lit les types d'`answers` et de `votes`,
  jamais leurs mappers ni leurs sources de données.
- `questions` et `votes` lisent le même `questions.json`, chacun avec son mapper : une question ne
  porte pas ses votes, c'est l'écran qui compose les deux.
- `questions.json` n'est qu'un index (de quoi tirer un jeu, poser la question, calculer les scores) ;
  le texte long de chaque fiche est dans `data/app/fiches/<uid>.json`, que Vite découpe en un fichier
  par question. `questionRepository.detail(id)` le charge à l'affichage, et `QuestionPage` précharge
  celui de la question suivante. Les résultats et la méthode (avec react-markdown) se chargent aussi à part.
- Les formules élémentaires (accord, poids, cohésion, position) restent dans `data/model`, partagées
  avec les scripts et alignées sur `data/content/METHODE.md`. Les modules les composent, sans les redéfinir.
- Les types bruts de `data/model/app-data.ts` sont le contrat des JSON ; ils ne sortent pas d'`infra`.
- Imports absolus, depuis le fichier qui définit l'export : `#src/modules/votes/domain/vote.ts`,
  `#data/model/scoring.ts` (champ `imports` de package.json, compris par Node, TypeScript, Vite et Metro).
- Pas de fichier `index.ts` : chaque fichier exporte ce qui doit l'être, et c'est tout.
- Chaque méthode métier et chaque mapper a un test vitest à côté de lui.

## Le tunnel

`HomePage` tire un jeu de vingt-cinq questions (`buildDeck`, équilibré entre thèmes) et le confie au store des
réponses. `QuestionPage` affiche la question, enregistre la réponse, puis montre le récap : le vote
de chaque famille et son accord avec la réponse. `ResultsPage` calcule les scores (`computeScores`) et
le détail question par question, et propose de prolonger le parcours de dix questions jamais posées
(`buildDeck` avec `exclude`, puis `extendDeck` : les réponses sont gardées), tant qu'il en reste. Les réponses sont sauvegardées dans le navigateur (localStorage) à
chaque changement, pour reprendre un parcours. `container.ts` porte le réglage `INCLUDE_DRAFTS`
(`false` : seules les fiches relues ou publiées sont proposées).
