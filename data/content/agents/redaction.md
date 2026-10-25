# Consignes communes aux rédacteurs de fiches a-vote

<!-- Brief donné à chaque sous-agent rédacteur, avec la liste de ses fiches. Procédure : data/README.md,
« Ajouter les scrutins du mois ». -->

Projet : le dépôt a-vote, depuis sa racine (site qui montre des scrutins de l'Assemblée nationale
reformulés en question oui/non, puis comment chaque famille politique a voté).

Tu rédiges les fiches qu'on t'a attribuées, et seulement celles-là. D'autres rédacteurs travaillent
en parallèle sur d'autres fiches du même dossier : ne touche à aucun autre fichier.

## À lire d'abord

1. `data/content/REDACTION.md` : les règles d'écriture. Elles priment sur tout le reste.
2. Deux fiches modèles déjà rédigées : `data/content/fiches/VTANR5L16V1462.md` (forme de base) et
   `data/content/fiches/VTANR5L17V8431.md` (niveau d'exigence attendu : texte réellement voté,
   compte rendu de séance, devenir du texte, liens ajoutés dans « Pour aller plus loin »).
3. Pour chaque fiche : le brief `data/cache/briefs/<uid>.md` (faits, votes, exposé des motifs,
   articles du texte DÉPOSÉ) et le squelette `data/content/fiches/<uid>.md`.

## Ce qu'il faut rédiger dans chaque squelette

Remplir tous les « À RÉDIGER » : `question`, `sens`, titre de niveau 1 (identique à `question`),
paragraphe d'introduction, grandes mesures, Pour, Contre, Contexte, et réécrire « À vérifier avant
publication ». Corriger l'en-tête `themes` si besoin (liste des thèmes valides dans le brief).
Ne pas modifier le tableau « Comment les groupes ont voté » ni les champs factuels de l'en-tête
(uid, date, votants, résultat, URLs). `statut` reste `brouillon`.

## Aller au-delà du brief (obligatoire)

Le brief ne contient que le texte DÉPOSÉ et l'exposé des motifs des auteurs. Le texte VOTÉ (après
commission, CMP, amendements) en diffère souvent beaucoup. Pour chaque fiche :

- le dossier législatif (lien dans l'en-tête) : auteur, groupe, procédure, niche parlementaire,
  étapes, texte adopté (« T.A. n° … ») ;
- le texte adopté : les mesures décrites doivent être celles du texte voté. Les pages HTML longues
  sont tronquées par WebFetch ; l'open data propose une version HTML du texte adopté et les PDF se
  lisent bien en les téléchargeant avec `curl -sL` dans un dossier temporaire du type
  `$TMPDIR/avote-<uid>/` puis `pdftotext -layout fichier.pdf -` ;
- le compte rendu de la séance du vote (lien dans le brief) : explications de vote des groupes,
  source principale des arguments « Contre » et « Pour » des groupes ;
- le devenir du texte : Sénat, CMP, promulgation, censure du Conseil constitutionnel (avec date et
  numéro de décision), via le dossier législatif, vie-publique.fr, legifrance.gouv.fr ou
  conseil-constitutionnel.fr. Ne rien affirmer qui ne soit vérifié ; si tu ne trouves pas,
  le dire dans « À vérifier avant publication ».

Ajoute dans « Pour aller plus loin » ET dans l'en-tête `sources` chaque page réellement consultée
qui fonde la fiche (texte adopté, compte rendu, décision, loi, fiche vie-publique). La transparence
des sources est un principe central du projet : aucune affirmation sans source listée.

Vérifie la date du jour (`date`) : un texte voté il y a quelques mois peut avoir eu des suites
récentes (CMP, promulgation, décision du Conseil constitutionnel). Ne te fie pas à ta mémoire pour les faits ; tout doit venir des sources consultées.

## Points d'attention

- `sens` : la règle la plus importante. Méthode : prendre une famille qui a voté POUR le scrutin
  (tableau des votes) et se demander si elle répondrait « oui » à la question. Si oui → « pour ».
  Préférer une question dont le sens est « pour ». Attention aux scrutins REJETÉS : le sens reste
  défini par rapport au vote pour le texte, pas par rapport au résultat.
- Neutralité absolue, arguments attribués aux groupes qui les portent, noms des groupes tels qu'ils
  s'appelaient à la date du vote.
- Question : une phrase fermée, compréhensible sans contexte, 140 caractères au plus, qui porte
  sur la mesure phare du texte tel que voté.
- « À vérifier avant publication » : lister honnêtement ce que le relecteur doit contrôler (sources
  lues partiellement, chiffres non vérifiés, vote tactique possible, devenir incertain, choix des
  thèmes). Garder une ligne « Sens du vote : … » qui explique le raisonnement, comme dans les
  modèles. Reprendre la consigne de sélection si le brief en contient une.

## Leçons des relectures précédentes (à appliquer)

- La question doit SÉPARER le vote : un groupe qui a voté contre doit répondre « non ». Si un
  groupe opposé au texte soutient en fait la mesure choisie (il s'opposait à un autre volet),
  choisis une autre mesure ou décris le texte entier en clair. Jamais « Faut-il adopter la loi X ? »
  sans dire ce qu'elle fait : la question doit se comprendre sans connaître le nom de la loi.
- Termes neutres repris du texte de loi plutôt que des formules qui préjugent (« les jeunes qui se
  disent mineurs » → « les jeunes dont la minorité est contestée »).
- Chaque citation et chaque chiffre attribué doivent l'être au bon orateur, vérifié dans le
  compte rendu. N'écris pas qu'un groupe n'a « aucun argument » sans avoir lu toute la séance,
  explications de vote comprises (souvent dans une séance ultérieure de la même journée).
- Motifs de censure du Conseil constitutionnel : distinguer cavaliers (absence de lien) et
  censures au fond, article par article.
- Numéros d'articles et d'alinéas : les recopier exactement depuis le texte voté.
- Toute URL de `sources` figure dans « Pour aller plus loin » et inversement.
- `check` signale « bon sens », « enfin » et d'autres mots orientés même dans une citation.
- Vérifie les apostrophes : aucun « qu.aucun » ou « l.application ».
- Thème « institutions » : il est ajouté à tort aux résolutions dont l'intitulé cite « l'article
  34-1 de la Constitution ». Le retirer si le texte ne porte pas sur les institutions.
- Les totaux du tableau peuvent être inférieurs à ceux du scrutin : ce sont les non-inscrits,
  exclus volontairement. Ce n'est pas une erreur.
- Si un autre scrutin du même texte a déjà une fiche (autre lecture), lis-la : décris ce que
  CETTE lecture contenait, et garde des questions cohérentes entre les deux.

## Contrôle

Après chaque fiche, depuis la racine du dépôt : `pnpm data check 2>&1 | grep -E "<uid>|problème"`.
Corriger jusqu'à obtenir ✓ sans avertissement pour tes fiches. Ne lance ni `build`, ni `format`,
ni aucune commande git ; ne modifie ni `selection.json`, ni le code, ni les autres fiches.

## Compte rendu final (ta réponse)

Pour chaque fiche, en quelques lignes : uid, question retenue, sens et justification en une
phrase, sources externes effectivement lues, et les points les plus fragiles. Pas de recopie de
la fiche.
