# Rédiger une fiche

Une fiche transforme un scrutin de l'Assemblée nationale en une question à laquelle on répond par
oui ou par non. L'app montre ensuite comment chaque famille politique a voté. Ce guide s'applique
à toute personne qui rédige, assistant compris.

## Le flux

```bash
pnpm data brief --only VTANR5L17V8431     # dossier de lecture dans data/cache/briefs/
pnpm data scaffold --only VTANR5L17V8431  # squelette dans data/content/fiches/
# rédiger les champs « À RÉDIGER » du squelette
pnpm data check                           # contrôles de forme
pnpm data build                           # JSON pour l'app dans data/app/
```

Le squelette contient déjà les faits : identifiant, dates, intitulé officiel, résultat, tableau des
votes par famille, liens officiels, et les limites connues de la collecte. Seules les parties
éditoriales sont à écrire.

## Public et ton

Des adultes sans formation juridique ni politique. Vocabulaire courant, phrases courtes, aucun sigle
sans explication, nombres écrits avec des espaces comme séparateurs de milliers.

## Neutralité, règle absolue

- Aucun adjectif évaluatif : pas de « réforme courageuse », « casse sociale », « mesure de bon sens ».
- Aucune ironie, aucune conclusion sur qui a raison.
- Les arguments des deux camps sont présentés avec le même soin et toujours attribués à ceux qui les
  portent : « Selon les auteurs du texte… », « Pour les députés RN… ».
- Quand un camp a peu d'arguments connus, le dire plutôt que d'en inventer.

## Fidélité aux sources

Les mesures viennent du texte et de l'exposé des motifs fournis dans le brief. Ne jamais inventer un
chiffre, une date ou un dispositif. Si les sources manquent (texte déposé au Sénat, dossier
introuvable), s'appuyer sur l'intitulé officiel et le signaler dans « À vérifier avant publication ».

Le brief ne contient que le point de vue des auteurs (exposé des motifs) et les articles. Pour le
reste :

- les arguments des opposants se lisent dans le compte rendu de la séance (lien dans le brief,
  explications de vote) et dans le rapport de la commission, accessible depuis le dossier
  législatif ;
- l'auteur du texte, son groupe et le cadre de l'examen (niche parlementaire ou non) sont en tête
  du dossier législatif ; dans le texte de la fiche, nommer les groupes tels qu'ils s'appelaient
  à la date du vote (« Renaissance » en 2023), le tableau affichant, lui, la famille ;
- le devenir du texte (Sénat, promulgation, censure, décret d'application) se lit sur le dossier
  législatif ou sur vie-publique.fr : chercher le titre du texte sur ce site, et ne rien ajouter
  qui ne soit vérifié.

Tout argument « Contre » écrit sans ces sources doit être listé dans « À vérifier avant
publication ».

## La question

- Une seule phrase, fermée, comprise sans aucun contexte, sans double négation, 140 caractères au plus.
- Elle porte sur le texte entier tel qu'il a été voté, mais se formule autour de sa mesure phare.
- « Oui » doit correspondre à une position claire.

## Le sens, le point le plus important

Le champ `sens` dit si répondre oui à la question revient à voter **pour** ou **contre** le scrutin.
Le vérifier deux fois avant de passer la fiche en « relu ».

| Texte voté | Question | sens |
|---|---|---|
| Loi qui interdit les réseaux sociaux aux moins de 15 ans | Faut-il interdire les réseaux sociaux aux moins de 15 ans ? | pour |
| Résolution demandant l'abrogation de la réforme des retraites | Faut-il abroger la réforme des retraites de 2023 ? | pour |
| Loi qui supprime une aide existante | Faut-il maintenir cette aide ? | contre |

Préférer une question dont le sens est « pour » quand c'est naturel : c'est plus lisible. Ainsi,
pour la loi qui abroge l'obligation vaccinale des soignants, la formulation recommandée est
« Faut-il mettre fin à l'obligation vaccinale des soignants ? » avec le sens « pour », plutôt que
« Faut-il maintenir… ? » avec le sens « contre ».

Méthode de vérification : prendre une famille qui a voté pour le texte et se demander si elle
répondrait oui à la question. Si oui, le sens est « pour » ; sinon, « contre ».

## Particularités à expliquer dans « Contexte »

- Une proposition de résolution n'a pas de force contraignante.
- Un texte de commission mixte paritaire est la version de compromis finale avec le Sénat.
- Une lecture définitive suit un désaccord persistant avec le Sénat.
- Une loi constitutionnelle doit ensuite passer par le Congrès ou un référendum.
- Si la loi a été censurée en tout ou partie par le Conseil constitutionnel, le dire, avec la date.
- Les votes par famille peuvent cacher un vote tactique (un groupe vote contre un texte qu'il
  défend d'ordinaire parce qu'il vient d'un adversaire, souvent lors d'une niche parlementaire) :
  le signaler dans « À vérifier avant publication ».

## Les sections du squelette

| Section | Contenu attendu |
|---|---|
| En-tête `themes` | Proposé d'après les mots-clés de l'intitulé : à vérifier, les faux positifs sont fréquents (« étudiants » déclenche « education »). |
| Titre de niveau 1 | La question, recopiée telle quelle depuis le champ `question` de l'en-tête (`check` vérifie l'égalité). |
| Paragraphe d'introduction | Ce que le texte change, en une phrase. |
| Les grandes mesures | 2 à 6 puces, une disposition par puce, chiffrée quand le texte l'est. |
| Pour | 1 à 4 arguments des partisans, attribués. |
| Contre | 1 à 4 arguments des opposants, attribués, en s'appuyant sur les groupes qui ont voté contre. |
| Contexte | 2 à 4 phrases : origine du texte, stade du vote, devenir connu, mises en garde. |
| Comment les groupes ont voté | Prérempli, ne pas modifier. |
| Pour aller plus loin | Prérempli ; ajouter une fiche vie-publique.fr si elle existe. |
| À vérifier avant publication | Tout ce que le relecteur doit contrôler. Une fois les points traités, remplacer la liste par « Aucun point signalé. ». |

## Statuts

- `brouillon` : créé ou en cours de rédaction. Des champs « À RÉDIGER » peuvent rester.
- `relu` : relu par une personne autre que le rédacteur, sens du vote vérifié, aucun champ à rédiger.
- `publiee` : embarquée dans une version publiée de l'app.

`pnpm data check` ne contrôle que la forme : en-tête complet, sections présentes dans l'ordre,
titre identique à la question, question terminée par un point d'interrogation (avertissement au-delà
de 140 caractères ou en cas de double négation), sens « pour » ou « contre », thèmes connus, sources
présentes, vocabulaire manifestement orienté. Il bloque toute fiche hors brouillon qui contient
encore un champ à rédiger. Il ne juge ni la justesse du sens, ni la neutralité réelle, ni
l'exactitude des mesures : c'est le travail de la relecture.

Un exemple de fiche complète, à prendre comme modèle de forme : `fiches/VTANR5L16V1462.md`.

## Checklist de relecture

1. Le sens du vote est-il juste ? Relire la question, puis le résultat du scrutin et les positions
   des familles : cohérents ?
2. La question se comprend-elle sans avoir lu la fiche ?
3. Chaque mesure est-elle dans le texte ?
4. Le vocabulaire est-il neutre des deux côtés ?
5. Le contexte dit-il où en est le texte aujourd'hui ?
6. Les thèmes de l'en-tête correspondent-ils au fond du texte ?
