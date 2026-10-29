# Les données d'a-vote

Tout ce que l'app affiche vient de ce dossier. Ce guide explique ce qu'il contient et comment
l'actualiser, à la main ou en conversation avec Claude.

```
data/
  model/      types TypeScript et calculs partagés avec l'app (score, familles, sources)
  content/    ce qui est maintenu à la main et versionné
    families.json   groupes parlementaires → familles politiques stables
    themes.json     thèmes et mots-clés
    selection.json  les scrutins retenus et écartés, et la date jusqu'où tout a été examiné
    fiches/         une fiche Markdown par scrutin retenu
    REDACTION.md    règles d'écriture des fiches
    agents/         consignes des sous-agents qui rédigent et relisent les fiches avec Claude
    METHODE.md      la méthode de calcul, affichée dans l'app
    candidats.json  les candidatures à la présidentielle et leurs programmes, vérifiées à la main (onglet « Présidentielle 2027 »)
  app/        JSON compilés par `pnpm data build`, versionnés, importés par les modules de src/ (couche infra)
  cache/      tout ce qui se régénère, ignoré par git : archives open data, scrutins normalisés,
              pages du site, contextes, briefs, shortlist
```

Les scripts qui alimentent ce dossier sont dans `scripts/` et s'appellent avec `pnpm data <commande>`.

## Le cycle complet

```
import → shortlist → sélection → collect → brief → scaffold → rédaction → check → build
```

| Commande | Ce qu'elle fait | Entrées | Sorties |
|---|---|---|---|
| `pnpm data download` | Télécharge les archives open data sans les traiter | — | `cache/archives/` |
| `pnpm data import` | Télécharge si besoin, puis normalise scrutins et groupes ; affiche le nombre de groupes, la répartition des scrutins et le taux de positions majoritaires officielles contredites par le décompte | archives AN | `cache/normalized/` |
| `pnpm data shortlist` | Classe les scrutins candidats (votes d'ensemble, solennels) par pouvoir discriminant et thème ; `--new` ne garde que les textes pas encore tranchés | normalized, `content/themes.json`, `content/families.json`, `content/selection.json` avec `--new` | `cache/shortlist/candidates.md` et `.json` |
| sélection | Choisir les textes à la main, voir ci-dessous | shortlist | `content/selection.json` |
| `pnpm data collect` | Va chercher sur assemblee-nationale.fr le dossier, le texte déposé et l'exposé des motifs | selection | `cache/context/` |
| `pnpm data brief` | Écrit un dossier de lecture par texte : faits, votes, exposé des motifs et articles en clair, lien vers le compte rendu de séance. Il ne contient ni les arguments des opposants ni le devenir du texte : le brief dit où les trouver | context | `cache/briefs/` |
| `pnpm data scaffold` | Crée les squelettes de fiches manquants, faits et votes préremplis | context | `content/fiches/` |
| rédaction | Remplir les champs « À RÉDIGER » en suivant `content/REDACTION.md` | brief | fiche |
| `pnpm data check` | Vérifie la forme de chaque fiche : en-tête, sections, titre = question, sens, thèmes, sources ; une ligne ✓ par fiche conforme | fiches | rapport |
| `pnpm data build` | Compile les fiches relues, les votes, la méthode et les sources pour l'app ; `--drafts` embarque aussi les brouillons complets pour développer | fiches, normalized | `app/` |

Options communes : `-l 16,17` pour limiter aux législatures, `--only uid1,uid2` et `--limit 5` pour
cibler des textes. `--force` dépend de la commande : `import` retélécharge les archives, `collect`
reconsulte le site au lieu du cache, `scaffold` réécrit les squelettes encore vides. `brief`
régénère toujours. Une fiche rédigée n'est jamais écrasée.

## Cas pratiques

### Ajouter un scrutin à l'app

1. Trouver son identifiant (`VTANR5L17V8431` : législature 17, scrutin n° 8431). La page officielle
   `https://www.assemblee-nationale.fr/dyn/17/scrutins/8431` le donne ; `cache/shortlist/candidates.md`
   liste les candidats classés après `pnpm data shortlist`.
2. L'ajouter dans `content/selection.json`, avec une note sur l'angle attendu :
   ```json
   { "uid": "VTANR5L17V8431", "note": "angle : interdiction aux moins de 15 ans" }
   ```
3. `pnpm data collect --only VTANR5L17V8431`, puis `pnpm data brief --only VTANR5L17V8431` et
   `pnpm data scaffold --only VTANR5L17V8431`.
4. Rédiger `content/fiches/VTANR5L17V8431.md` avec le brief sous les yeux, en suivant
   `content/REDACTION.md`. Vérifier deux fois le champ `sens`.
5. `pnpm data check`, faire relire, passer `statut` à `relu`, puis `pnpm data build` et commiter
   `content/` et `app/`.

En conversation avec Claude, la demande « ajoute le scrutin 8431 de la XVIIe à l'app » suffit :
il enchaîne ces étapes et soumet la fiche à relecture.

### Ajouter les scrutins du mois

En conversation avec Claude, la demande « récupère les nouveaux scrutins et propose-les-moi » suffit.
Les étapes :

1. `pnpm data import --force` retélécharge les archives (elles changent chaque jour). Les fiches
   existantes ne bougent pas.
2. `pnpm data shortlist --new` ne liste que les textes dont aucune lecture n'est dans
   `content/selection.json`, retenue (`selected`) ou écartée (`rejected`), et votés après
   `reviewedThrough`. En fin de `cache/shortlist/candidates.md`, une section signale les nouvelles
   lectures de textes déjà tranchés (vote définitif d'un texte retenu en première lecture, par
   exemple) : remplacer le scrutin retenu, ajouter cette lecture ou l'écarter. `pnpm data check`
   bloque deux fiches du même dossier (même `dossier_url`), qui poseraient deux fois la même
   question ; on ne les garde ensemble que si elles portent sur des mesures différentes, en mettant
   `"allowSameDossier": true` sur chacune dans `selected`.
3. Trancher chaque candidat : les textes retenus vont dans `selected`, les autres dans `rejected`,
   pour qu'ils ne reviennent pas. Puis mettre `reviewedThrough` à la date de l'import.
4. `pnpm data collect`, `brief` et `scaffold` avec `--only` sur les nouveaux identifiants.
5. Rédaction et relecture par sous-agents, chacun recevant la liste de ses fiches (cinq au plus) et
   ses consignes :
   - rédacteurs (Sonnet) : `content/agents/redaction.md` ;
   - relecteurs (Haiku), qui ne modifient rien : `content/agents/verification.md`.

   Claude transmet chaque rapport de relecture au rédacteur de la fiche pour correction. Les
   relecteurs se trompent parfois sur l'attribution des citations : en cas de désaccord, la
   vérifier soi-même dans le compte rendu de séance. Toute leçon nouvelle d'une relecture
   s'ajoute aux consignes.
6. `pnpm data check`, relecture humaine (`statut: relu`), `pnpm data build`, puis commiter
   `content/` et `app/`.

### Ajouter une législature

1. Ajouter son numéro dans `LEGISLATURES` et ses libellés dans `legislatureLabel` et
   `legislatureRoman` (`data/model/types.ts`).
2. Dans `content/families.json`, rattacher chaque nouveau groupe à une famille par son
   abréviation officielle (`libelleAbrev`), lisible dans `cache/normalized/groups.json` après
   `pnpm data import` ; `pnpm data shortlist` signale ceux qui ne sont rattachés nulle part.
3. `pnpm data import` puis `pnpm data shortlist`.

### Ajouter ou renommer un groupe politique

Un groupe peut changer d'identifiant en cours de législature (les socialistes en 2023, l'UDR trois
fois en 2024-2025). Ajouter la nouvelle abréviation dans la liste de sa famille, dans
`content/families.json`. Les familles sont listées dans l'ordre d'affichage, de la gauche vers la
droite de l'hémicycle, avec une couleur.

### Ajouter un thème

Dans `content/themes.json`, ajouter un identifiant, un libellé et des mots-clés. Les mots-clés sont
comparés aux titres sans tenir compte des accents ni de la casse ; une étoile finale accepte toute
terminaison (`agricol*`), sinon le mot doit être entier. Les thèmes des fiches existantes ne sont
pas recalculés : ils se corrigent dans l'en-tête de chaque fiche.

### Corriger une fiche

Modifier le Markdown, lancer `pnpm data check`, puis `pnpm data build`. Si la correction touche la
question ou le sens, repasser le statut à `brouillon` jusqu'à relecture.

### Retirer un scrutin

Le déplacer de `selected` à `rejected` dans `content/selection.json` et supprimer sa fiche. `pnpm data check` signale les fiches
qui ne sont plus dans la sélection.

## Conventions

- `data/model/` est du TypeScript sous `data/` parce que l'app l'importe tel quel : types, formule
  de score, familles. Il n'importe jamais `scripts/`. On importe chaque fichier directement
  (`#data/model/scoring.ts`), il n'y a pas d'index.
- Identifiants de code en anglais, sauf les mots du domaine parlementaire (`scrutin`, `dossier`,
  `fiche`, `famille`, `pour`, `contre`, `abstention`) ; messages, commentaires et docs en français.
  L'en-tête des fiches est en français (`titre_officiel`, `scrutin_url`), les JSON de `app/` en
  anglais (`officialTitle`, `result`).

- Une fiche par scrutin, nommée par son identifiant. Son en-tête `sources` liste toutes les pages
  d'où elle vient ; `check` refuse une fiche hors brouillon sans source.
- Statuts : `brouillon` (en cours), `relu` (sens vérifié par une autre personne, aucun champ à
  rédiger), `publiee` (embarquée dans une version publiée).
- `app/` se régénère entièrement à chaque `build` ; ne pas l'éditer à la main. `build` n'embarque
  que les fiches `relu` ou `publiee`, sauf avec `--drafts`.
- Les non-votants sont des absents et ne comptent jamais dans les scores. Les non-inscrits sont
  hors calcul.

## Ce qu'il faut savoir sur les données

- Les votes viennent de l'open data officiel (Licence Ouverte 2.0) : pour chaque scrutin, le
  décompte par groupe et la liste nominative. Les groupes de la XVIe ne sont présents que dans le
  référentiel historique depuis 1997, pas dans l'archive « députés actifs ».
- Le champ officiel de position majoritaire n'est jamais utilisé : `pnpm data import` affiche la
  part des votes de groupe où il contredit le décompte (environ 3 %), et tout est recalculé
  depuis les décomptes.
- 14 scrutins de la XVIIe ont tous leurs groupes référencés `PO0` et sont inexploitables.
- Les scrutins de la XVIe n'ont pas de référence de dossier ; la collecte passe par le compte rendu
  de séance. Le vote du Congrès de mars 2024 n'a pas de page de scrutin.
- Les textes déposés au Sénat n'ont pas d'exposé des motifs côté Assemblée : la rédaction s'appuie
  sur les articles, ou sur senat.fr.

## Méthode de la shortlist

Candidats : votes sur l'ensemble d'un texte et scrutins solennels, hors motions, procédure et lois
de règlement du budget. Pour chaque famille : score net dans [-1, 1], participation et poids de
fiabilité (plein dès 25 % de participation). La discriminance est l'écart-type pondéré des scores
nets entre familles. Score = discriminance × participation globale (pleine à partir de 35 % des
577 sièges) × type de texte (loi 1, résolution 0,8, autre 0,7) × nature du vote (ensemble 1,
solennel 0,9, autre 0,7) × thème (1 si reconnu, 0,6 sinon). Un seul scrutin par texte : les autres
lectures sont rattachées dans `otherReadings`.
