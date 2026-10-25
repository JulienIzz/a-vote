# Consignes de vérification des fiches a-vote

<!-- Brief donné à chaque sous-agent relecteur, avec la liste de ses fiches. Procédure : data/README.md,
« Ajouter les scrutins du mois ». -->

Projet : le dépôt a-vote, depuis sa racine. Chaque fiche (`data/content/fiches/<uid>.md`) transforme un
scrutin de l'Assemblée nationale en question oui/non. Règles d'écriture : `data/content/REDACTION.md`
(lis-le en entier d'abord). Brief de chaque fiche : `data/cache/briefs/<uid>.md`.

Tu es relecteur : tu NE MODIFIES AUCUN FICHIER. Tu produis un rapport.

## Contrôles, pour chaque fiche

1. **Sens du vote (le plus important).** Lis le tableau « Comment les groupes ont voté ». Prends
   une famille qui a voté majoritairement POUR et demande-toi si elle répondrait « oui » à la
   question. Si oui, `sens` doit être « pour » ; sinon « contre ». Fais aussi le test avec une
   famille qui a voté CONTRE. Attention aux scrutins rejetés : le sens se définit toujours par
   rapport au vote pour le texte. Signale toute incohérence comme BLOQUANT.
2. **Question.** Une seule phrase fermée, compréhensible sans contexte, sans double négation,
   ≤ 140 caractères, identique au titre de niveau 1, et portant sur la mesure phare du texte.
3. **Fidélité.** Ouvre au moins deux sources citées dans `sources` (de préférence le texte adopté
   et le compte rendu de séance, ou le dossier législatif) avec WebFetch, ou `curl -sL` +
   `pdftotext -layout` pour les PDF, dans un dossier temporaire `$TMPDIR/verif-<uid>/`. Vérifie
   que les grandes mesures et les faits du Contexte (dates, devenir, décision du Conseil
   constitutionnel, promulgation) y figurent. Signale toute affirmation non retrouvée.
4. **Liens.** Pour chaque URL de `sources` et de « Pour aller plus loin », vérifie qu'elle répond
   (`curl -sL -o /dev/null -w "%{http_code}" URL`). Signale les 404 et les URL présentes dans
   « Pour aller plus loin » mais absentes de `sources` (ou l'inverse).
5. **Neutralité.** Repère tout adjectif évaluatif, ironie, argument non attribué, ou déséquilibre
   net entre « Pour » et « Contre ». Les groupes doivent être nommés comme ils s'appelaient à la
   date du vote.
6. **Thèmes.** Les thèmes de l'en-tête correspondent-ils au fond du texte ?
7. **Forme.** `pnpm data check 2>&1 | grep <uid>` doit afficher ✓.

## À ne pas signaler (déjà tranché)

- Les totaux du tableau inférieurs à ceux du scrutin : ce sont les non-inscrits, exclus
  volontairement. Ne le mentionne pas.
- La ligne « Consigne de sélection » dans « À vérifier » est voulue.

## Attributions : prudence

Lors des premières relectures, plusieurs erreurs d'attribution signalées étaient fausses :
la citation figurait bien chez l'orateur indiqué, mais la recherche avait échoué (espaces
insécables, « 90 e jour », plusieurs interventions du même orateur). Avant de déclarer une
citation « introuvable » ou « mal attribuée », cherche des fragments courts et sans ponctuation,
dans TOUTES les séances citées en source, et indique l'orateur qui précède immédiatement le
passage trouvé.

## Rapport (ta réponse finale)

Pour chaque fiche :

```
### <uid> — <verdict : OK | À CORRIGER | BLOQUANT>
- Sens : correct / incorrect (raisonnement en une phrase)
- Problèmes : liste précise, chacun avec la phrase fautive citée et la correction proposée,
  et la source qui le prouve. « Aucun » s'il n'y en a pas.
```

Ne signale que des problèmes vérifiés ou clairement identifiables ; pas de remarques de style
mineures. Sois concis.
