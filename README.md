# a-vote

Comparer ses opinions avec les votes réels des groupes politiques à l'Assemblée nationale.
Un site responsive pose vingt-cinq questions tirées de scrutins vulgarisés, montre après chaque réponse
comment chaque groupe a voté, puis calcule un taux d'accord par famille politique.

```
data/       tout ce qui alimente le site : modèle typé, contenu éditorial, JSON compilés
scripts/    les outils qui fabriquent ce contenu depuis l'open data de l'Assemblée (voir scripts/README.md)
src/        le site, en modules métier (domain, infra, view) et sa coquille Vite + React (voir src/README.md)
```

## Démarrage

Prérequis : Node ≥ 22 et pnpm.

```bash
pnpm install
pnpm data import       # télécharge l'open data AN (≈ 50 Mo) et le normalise
pnpm data build        # compile data/app/ (ajouter --drafts pour inclure les fiches en relecture)
pnpm dev               # le site sur http://localhost:5173
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

`pnpm build` produit `dist/`, publié sur Netlify (`netlify.toml`). Le mode d'emploi pour actualiser
le contenu est dans [data/README.md](data/README.md), les règles d'écriture des fiches dans
[data/content/REDACTION.md](data/content/REDACTION.md), la méthode de calcul présentée aux
utilisateurs dans [data/content/METHODE.md](data/content/METHODE.md).

## Principes

- **Des votes, pas des programmes.** Chaque question correspond à un scrutin réel ; le site montre
  le décompte par famille politique et lie les pages officielles.
- **Transparence.** Chaque fiche liste ses sources, la méthode de calcul est publiée dans le site,
  le code est ouvert.
- **Neutralité.** Vocabulaire neutre, arguments des deux camps attribués à ceux qui les portent,
  relecture humaine avant publication. Tant que les fiches sont en relecture, le site les signale.
- **Tout en local.** Pas de serveur ni de service tiers : les données se mettent à jour sur une
  machine, se relisent, puis se commitent. Les réponses des utilisateurs restent dans leur navigateur.

## Formule de score

`data/model/scoring.ts`, partagé entre les outils et le site. Pour une question, l'accord avec une
famille est la part de ses votants du même côté que l'utilisateur, l'abstention comptant pour
moitié et les absents étant ignorés. Chaque question pèse selon la participation de la famille
(plein poids dès 25 % des membres). Le score final est la moyenne pondérée des accords.

## Licence

Code sous licence MIT. Les données proviennent de l'Assemblée nationale, Licence Ouverte 2.0.
