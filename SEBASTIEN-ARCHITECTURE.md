# Sébastien — architecture de production

## Principe retenu

Sébastien fonctionne en cascade. Il ne demande une IA que lorsqu’une réponse validée, un tarif vivant, un stock vivant ou un parcours de diagnostic ne suffit pas.

1. Faits boutique déterministes : horaires, adresse et contacts.
2. Tarifs et stocks lus en direct dans l’application Solution Phone.
3. Mémoire Supabase : uniquement les connaissances dont le statut est `validated`.
4. Diagnostic guidé : une à quatre questions selon le risque et l’information manquante.
5. Transfert humain : WhatsApp ou e-mail dès qu’un prix, une pièce ou un diagnostic n’est pas suffisamment sûr.
6. IA de secours : reformulation et classement des demandes inconnues, jamais validation automatique d’un diagnostic ou d’un prix. La couche est déjà intégrée et s’active uniquement lorsqu’une clé `OPENAI_API_KEY` est présente dans les secrets Supabase.
7. Banc d’entraînement : 100 intentions métier servent de références et génèrent 10 000 formulations de clients. Les tests automatiques utilisent `page = automated-eval`, sans crédit OpenAI, mémoire, métrique commerciale ni notification WhatsApp.
8. Progression par compétence : une vue privée attribue des XP et des niveaux séparés en smartphone, tablette, informatique, console, trottinette, service client, sécurité et commerce. Seules les connaissances validées, leurs formulations et les retours de qualité comptent ; une proposition IA en révision ne rapporte aucun XP.

## Règles de réponse

- Répondre en deux phrases au maximum avant une éventuelle question.
- Ne jamais annoncer une pièce comme certaine sans contrôle.
- Ne jamais fabriquer un prix : utiliser la base ou annoncer qu’il doit être confirmé.
- Pour la charge, commencer par le nettoyage à 10 € avant le remplacement dès 25 €.
- Pour un danger potentiel (batterie gonflée, forte chauffe, liquide), donner d’abord la consigne de sécurité.
- Une réponse produite par une IA reste dans `evan_learning_items` tant que Sébastien ou l’équipe ne l’a pas validée.
- Ne jamais apprendre automatiquement à partir d’un message client.
- Une réponse de Sébastien reçue sur le WhatsApp privé est validée comme réponse propriétaire, mémorisée et renvoyée dans la conversation web si le client garde la page ouverte.
- Une demande de relais classée `dismissed` retire automatiquement l’élément correspondant de la file d’apprentissage ; elle ne peut plus rester artificiellement en attente.

## Couche IA recommandée

Modèle retenu : `gpt-5-mini`, appelé uniquement après échec des quatre premières couches. Ce n’est pas le modèle le moins cher du catalogue : c’est le point d’équilibre retenu parce qu’il a déjà réussi les audits métier, les garde-fous et les parcours de diagnostic de Solution Phone. La sortie JSON est contrôlée côté serveur, puis chaque proposition est enregistrée dans `evan_learning_items` avec le statut `review` jusqu’à validation humaine.

Entrée maximale recommandée : la question nettoyée, le contexte appareil, les cinq meilleures réponses validées et les règles ci-dessus. Ne pas envoyer l’historique commercial, l’IMEI, les coordonnées client ou les tables complètes.

Sortie structurée attendue :

```json
{
  "intent": "repair|price|stock|shop_info|other",
  "answer": "réponse courte",
  "needs_human": true,
  "suggested_question": null,
  "safety": null
}
```

L’IA ne doit jamais écrire directement dans `evan_knowledge`. Elle peut uniquement proposer un élément dans `evan_learning_items` avec le statut `review`.

Une nouvelle connaissance suit toujours le cycle : question réelle ou audit → proposition → validation métier → règle de priorité → tests propres, fautes et cas contradictoires → déploiement. Une hausse de couverture n’est acceptée que si le sens des réponses a aussi été contrôlé.

La réponse est limitée à 320 jetons au niveau de l’API. Le corps de réponse est plafonné à 260 caractères et l’ensemble visible, question éventuelle comprise, à 320 caractères. Cette marge sert au raisonnement minimal et au JSON structuré sans permettre une réponse bavarde.

## Budget

Objectif : moins de 10 € par mois.

- La majorité des demandes est traitée sans jeton.
- Plafond initial : 1 000 appels IA par mois.
- Une réponse IA doit rester courte et ne doit pas recevoir plus de contexte que nécessaire.
- Arrêt automatique de la couche IA lorsque le plafond mensuel est atteint ; le transfert humain reste disponible.

Mesure réelle du 26 juillet 2026 : trois réponses réussies ont coûté 0,001419 $, soit environ 0,000473 $ par réponse. À longueur de réponse comparable, 1 000 appels représenteraient environ 0,47 $ ; le plafond technique reste malgré tout fixé à 1 000 appels mensuels.

Comparaison officielle au 26 juillet 2026, par million de jetons :

| Modèle | Entrée | Entrée en cache | Sortie | Décision |
|---|---:|---:|---:|---|
| `gpt-5-nano` | 0,05 $ | 0,005 $ | 0,40 $ | Cinq fois moins cher, mais réservé à un futur test comparatif de qualité. |
| `gpt-4o-mini` | 0,15 $ | 0,075 $ | 0,60 $ | Peu d’intérêt : plus ancien et l’économie absolue reste minime. |
| `gpt-5-mini` | 0,25 $ | 0,025 $ | 2,00 $ | Retenu : déjà validé sur les cas Solution Phone. |
| `gpt-5.6-luna` | 1,00 $ | 0,10 $ | 6,00 $ | Plus récent, mais surdimensionné et plus cher pour ce secours très encadré. |

Sources officielles : [GPT-5 nano](https://developers.openai.com/api/docs/models/gpt-5-nano), [GPT-4o mini](https://developers.openai.com/api/docs/models/gpt-4o-mini), [GPT-5 mini](https://developers.openai.com/api/docs/models/gpt-5-mini), [GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna).

Le choix ne repose donc pas sur le prix facial seul. Avec environ 0,47 $ pour 1 000 réponses observées, passer immédiatement à `gpt-5-nano` économiserait moins de 0,40 $ par mois au plafond prévu, tout en introduisant un risque de réponses moins fiables. `gpt-5-mini` reste le meilleur compromis actuel ; `gpt-5-nano` ne remplacera ce modèle qu’après un test A/B démontrant les mêmes résultats sur les garde-fous, les questions difficiles et la concision.

Le calcul de coût est lié au modèle réellement configuré : si le modèle change, la télémétrie applique automatiquement son tarif au lieu de continuer à compter comme `gpt-5-mini`.

## Mesure

Les événements anonymisés sont enregistrés dans `evan_events`. Le tableau quotidien privé `private.evan_conversion_daily` mesure :

- sessions avec Sébastien ;
- réponses, prix et stocks affichés ;
- transferts proposés ;
- clics WhatsApp et e-mail ;
- taux de passage vers un contact devis.

Indicateur principal : `quote_contacts / sessions`. L’objectif commercial est de passer d’environ une demande de devis par jour à trois, sans augmenter les réponses approximatives.

La vue privée `private.sebastien_performance_daily` réunit dans un seul tableau la conversion, les retours utiles, le nombre d’appels IA, les transferts humains, les erreurs et le coût quotidien. Le plafond mensuel est réservé de manière atomique avant chaque appel : même avec plusieurs visiteurs simultanés, le nombre d’appels autorisé ne peut pas être dépassé.

La vue privée `private.sebastien_skill_progress` matérialise son évolution « façon Sims ». Le niveau maximal « Encyclopédie Solution Phone » exige 45 000 XP et ne peut donc pas être obtenu par quelques synonymes ajoutés artificiellement. Le relevé sert surtout à choisir le prochain entraînement : les domaines les moins couverts passent en priorité.

## Garde-fous automatiques

- Les fonctions publiques refusent toute origine absente ou extérieure aux domaines Solution Phone, Réparation iPhone Mâcon, Solution Accessoires et aux ports locaux de validation.
- Toute sortie IA qui annonce un prix, un stock ou un délai non issu des données connectées est rejetée.
- Toute alerte de chauffe, fumée, odeur, gonflement, liquide ou oxydation est neutralisée si la question du client ne contient aucun signal correspondant ; une vérification courte et sûre la remplace.
- Toute mention visible de ChatGPT, OpenAI, de la base de données ou d’une référence interne est rejetée.
- Les propositions IA restent au statut `review` ; la recherche publique ne lit que `evan_knowledge.status = 'validated'`.
- Les erreurs d’API comptent dans le plafond mensuel afin d’éviter une boucle coûteuse en cas de mauvaise configuration.

## État d’activation

- Clé OpenAI stockée dans les secrets Supabase, jamais dans le navigateur : actif.
- Limite mensuelle atomique et journal privé des coûts : actifs.
- Mémoire IA en statut `review`, sans validation automatique : active.
- Vingt et un tests unitaires de garde-fous et de routage : réussis.
- Vingt-trois tests métier de bout en bout sur la fonction déployée : réussis.
- Le réseau mobile possède une route dédiée : causes fréquentes d’abord, trois questions maximum, carte mère uniquement lorsqu’un indice la justifie.
- Trois appels OpenAI de variance consécutifs : réponses cohérentes sur une panne inhabituelle, sans prix inventé, alerte hors sujet ni transfert prématuré.
- Relais WhatsApp privé : messages livrés et statuts de lecture reçus.
- Retour humain temps réel : après une demande inconnue, la page vérifie pendant environ 80 secondes si Sébastien a répondu sur le WhatsApp privé. La réponse validée revient automatiquement au client ; sans réponse, WhatsApp et e-mail restent proposés.
- Mesures de conversion : trafic de test exclu et e-mail compté uniquement après envoi réussi.
- Priorité des connaissances : la version 78 choisit désormais une fiche précise de tablette, console ou trottinette avant la fiche générique du service correspondant.
- Catalogue public : tarifs et appareils vendables passent par une fonction filtrée ; aucune table interne n’est lue directement par la V2.
- Fermeture des anciens droits Supabase : migration prête et testée en transaction, à appliquer seulement lors du basculement V2 après confirmation que l’ERP utilise une clé `service_role` côté serveur.
- Mise en production du site : toujours soumise à la validation visuelle de Sébastien et à un essai FormSubmit réel depuis le domaine.

## Socle partagé avec Zahira, collègue IA de l’équipe

Le projet Mac mini avec écran tactile est un outil interne pour l’équipe, pas une borne destinée aux clients. Zahira pourra aider les techniciens à consulter les stocks et tarifs, rechercher une procédure, analyser un rapport Panic Full, retrouver une connaissance validée et utiliser les outils de l’atelier.

Sébastien et Zahira partagent le même socle de données, mais restent deux assistants séparés :

- **Sébastien, côté client** : réponses courtes, tarifs publics, stock vendable, qualification de panne, devis et passage à l’équipe ;
- **Zahira, côté atelier** : accès authentifié, procédures détaillées, diagnostics techniques, astuces internes, historique de réparation et commandes locales du Mac mini.

Les connaissances sont classées `public` ou `internal`. Sébastien ne peut lire que les contenus publics validés ; Zahira peut lire les contenus internes autorisés au rôle du technicien. Une réponse de l’IA ou d’un membre de l’équipe reste en révision jusqu’à validation humaine. Les clés privées restent sur le serveur : aucune clé OpenAI ni clé Supabase privilégiée n’est installée sur le Mac mini ou exposée dans le navigateur.
