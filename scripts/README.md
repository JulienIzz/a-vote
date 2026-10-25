# scripts/

Les outils qui fabriquent `data/` depuis l'open data de l'Assemblée nationale. Point d'entrée :
`pnpm data <commande>` (`cli.ts`). Mode d'emploi côté contenu : `data/README.md`.

```
cli.ts         analyse des options, une commande = un fichier dans steps/
paths.ts       tous les chemins (data/content, data/app, data/cache) et URLs de l'Assemblée
text.ts        normalisations de texte partagées (accents, apostrophes, mots significatifs)
fs.ts          lecture/écriture JSON, test d'existence, chemins relatifs pour les messages
assemblee/     open data (archives, parseurs des scrutins et des organes) et site (pages, documents, contexte)
content/       ce qui concerne le contenu éditorial : thèmes, sélection, classement, brief, gabarit,
               lecture et contrôle d'une fiche, conversion en question pour l'app, votes par famille
steps/         les commandes : import, shortlist, collect, brief, scaffold, check, build,
               plus workspace.ts (chargement commun) et options.ts
```

Règle de dépendance, du bas vers le haut : `data/model` ← `assemblee` ← `content` ← `steps` ← `cli.ts`.
`data/model` n'importe jamais `scripts/` : l'app l'embarque tel quel.

Imports absolus depuis le fichier qui définit l'export (`#scripts/paths.ts`, `#data/model/types.ts`),
pas de fichier `index.ts`.

Conventions : identifiants de code en anglais, sauf les mots du domaine parlementaire sans bon
équivalent (`scrutin`, `dossier`, `fiche`, `famille`, `pour`, `contre`, `abstention`) ; messages
console, commentaires et documentation en français. Chaque module commence par un commentaire qui
dit son rôle et sa place dans la chaîne. `pnpm lint` (Biome) formate et vérifie les imports inutilisés.
