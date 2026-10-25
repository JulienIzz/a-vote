# Comment ça marche

A voté vous pose des questions tirées de vrais votes de l'Assemblée nationale, puis compare vos
réponses à ce qu'ont voté les députés. Rien ne repose sur des programmes, des promesses ou des
déclarations : seulement sur les votes, tels que l'Assemblée les publie elle-même.

## En bref

- Chaque question correspond à un scrutin réel de l'Assemblée nationale, sources à l'appui.
- Votre accord avec une famille politique, c'est la part de ses députés qui ont voté comme vous.
- Les votes et les calculs ne passent par aucune IA. Les fiches sont rédigées avec son aide.
- Vos réponses restent dans votre navigateur.

## Les données

Les votes viennent de l'open data officiel de l'Assemblée nationale, publié sous Licence Ouverte
2.0 : pour chaque scrutin, le décompte des « pour », « contre » et « abstention » de chaque groupe
politique, avec le nom de chaque député qui a voté. Les textes et leurs exposés des motifs viennent
du site assemblee-nationale.fr. Chaque question indique les pages exactes qui ont servi à la
rédiger. Le code qui télécharge, trie et calcule est public.

Les positions majoritaires publiées par l'Assemblée ne sont pas reprises telles quelles : elles
sont recalculées à partir des décomptes, car elles sont parfois erronées.

## Les questions

### Comment elles sont choisies

Un scrutin n'est retenu que s'il porte sur un texte entier (une loi, une proposition de résolution)
ou s'il s'agit d'un vote solennel. Les motions de censure, les motions de rejet et les votes de
procédure sont écartés : ils ne disent rien du fond. Parmi ces scrutins, un classement automatique
privilégie ceux qui divisent réellement les groupes et ceux où beaucoup de députés ont voté. Le
choix final est fait à la main, avec le souci d'équilibrer les thèmes.

Chaque parcours tire au hasard 25 de ces questions, en alternant les thèmes. Une fois vos résultats
affichés, vous pouvez en ajouter 10 autres, jamais posées dans ce parcours, et recommencer tant qu'il
en reste : le score est alors recalculé sur l'ensemble de vos réponses.

Chaque fiche est rédigée avec l'aide d'une IA puis relue par une personne, avec une règle absolue :
le vocabulaire doit être neutre et les arguments des deux camps présentés avec le même soin.

### Dans quel sens va la question

Chaque question est formulée pour qu'on y réponde par oui ou par non. Pour chacune, la fiche
précise si répondre « oui » revient à voter pour ou contre le scrutin. Par exemple, pour une loi qui
interdit les réseaux sociaux aux moins de 15 ans, la question « Faut-il interdire les réseaux
sociaux aux moins de 15 ans ? » se lit dans le sens du vote : « oui » correspond à un vote pour.
Pour une loi qui supprime une obligation, la question peut être tournée dans l'autre sens, et c'est
alors indiqué. Cette correspondance est vérifiée deux fois avant publication, parce qu'une erreur
inverserait tout le résultat.

## Le calcul de votre accord

### Groupes et familles politiques

Les députés votent au sein de groupes parlementaires, dont le nom et la composition changent à
chaque législature. Pour comparer les votes de 2022 à aujourd'hui, le site regroupe les groupes
successifs en familles stables : par exemple Renaissance, devenu Ensemble pour la République, forme
une seule famille. Les députés non inscrits, qui n'appartiennent à aucun groupe, ne sont pas
comptés.

### Question par question

Pour une question, le site regarde comment les députés de chaque famille ont voté, et calcule la
part de ceux qui sont du même côté que vous :

```
accord = (votes du même côté que vous + abstentions ÷ 2) ÷ (pour + contre + abstentions)
```

- Les députés absents ne comptent pas : une absence n'est pas une position.
- Une abstention compte pour moitié : c'est un refus de trancher, ni un accord ni un désaccord.
- Un groupe divisé donne un accord intermédiaire, au lieu d'être ramené à sa position
  majoritaire. Si la moitié d'un groupe a voté pour et l'autre moitié contre, l'accord est de 50 %,
  quelle que soit votre réponse.

Exemple réel : sur la loi protégeant les mineurs des réseaux sociaux (21 juillet 2026), le groupe
socialiste a voté 30 pour, 0 contre, 28 abstentions. Si vous répondez « oui », votre accord avec
cette famille est (30 + 14) ÷ 58, soit 76 %. Avec la règle de la position majoritaire, il aurait
été de 100 %, ce qui aurait caché que la moitié du groupe ne s'est pas prononcée.

### Le poids de chaque question

Beaucoup de scrutins sont votés par une minorité de députés. Quand moins d'un quart des membres
d'une famille a voté, le résultat de cette famille sur cette question compte moins : son poids
baisse proportionnellement, jusqu'à zéro si personne n'a voté. Au-delà d'un quart, le poids est
plein. Le site signale ces votes peu suivis.

Vous pouvez aussi passer une question qui ne vous parle pas : elle n'entre alors pas dans le
calcul.

### Le score final

Le score d'accord avec une famille est la moyenne de vos accords question par question, pondérée
par le poids de chaque question. Il s'affiche en pourcentage. Si une famille n'a voté sur aucune
des questions auxquelles vous avez répondu, aucun score n'est affiché pour elle.

## Transparence et utilisation de l'IA

Ce qui ne passe jamais par une IA :

- **Les votes.** Les décomptes sont repris tels quels de l'open data de l'Assemblée nationale.
- **Le tri des scrutins.** Le classement qui propose des textes est un calcul statistique, décrit
  plus haut.
- **Les scores.** Ils viennent de la formule décrite plus haut, la même pour tout le monde, calculée
  dans votre navigateur.
- **Vos réponses.** Le site n'appelle aucune IA et n'envoie vos réponses nulle part : elles restent
  dans votre navigateur.

Ce qui est fait avec l'aide d'une IA :

- **La rédaction des fiches.** La question, la description, les grandes mesures, les arguments pour
  et contre et le contexte sont rédigés avec l'aide de Claude, le modèle d'IA d'Anthropic, à partir
  des documents officiels : texte déposé, exposé des motifs, dossier législatif, compte rendu des
  débats.

## Les limites

- Un vote peut être tactique : un groupe vote parfois contre un texte qu'il défend d'ordinaire
  parce qu'il vient d'un adversaire politique. Les fiches le signalent quand c'est connu.
- Un vote sur un texte entier mêle souvent plusieurs mesures. La fiche en résume les principales
  pour que vous jugiez l'ensemble.
- Les résultats dépendent des questions proposées. Une autre sélection donnerait d'autres scores :
  le site mesure votre proximité avec les votes sur ces sujets-là, pas une position politique
  générale.
