# Sébastien — matrice d’acceptation avant mise en production

Contrôle réalisé le 26 juillet 2026 sur la fonction réellement déployée, les données Supabase et les deux sites locaux. La V1 reste en ligne jusqu’à validation explicite.

| Exigence | Preuve vérifiée | État |
|---|---|---|
| Informations boutique fiables | Horaires du lundi et du mardi au samedi, adresse et téléphones testés sur la fonction déployée ; les formulations ambiguës liées au calendrier ou à l’heure du téléphone sont exclues. | Conforme |
| Pannes courantes et sécurité | Batterie gonflée, chauffe, liquide, charge, écran, batterie, virus, transfert, vitre arrière, PC, console et autres services couverts. Les dangers donnent la consigne de sécurité avant toute question. | Conforme |
| Réseau mobile sans surdiagnostic | Une demande générale de réseau distingue couverture/opérateur, SIM/eSIM, réglage ou logiciel, puis seulement les causes matérielles. Le diagnostic pose trois questions maximum et ne conclut plus « carte mère » sans indice explicite. | Conforme |
| Diagnostic concis | Réponse courte, arrêt immédiat quand l’information suffit et maximum adaptatif d’une à quatre questions selon le risque et la complexité. | Conforme |
| Tarifs connectés | Écran et batterie iPhone lus dans les réglages atelier. Test iPhone 14 : Compatible 45 €, LTPS Prime 65 €, Soft OLED 90 €, ReLife 115 €. Les prix absents ne sont pas inventés. | Conforme |
| Stock connecté | Les smartphones disponibles sont lus en direct, dédupliqués et limités à quatre résultats ; la réservation reste soumise à confirmation humaine. | Conforme |
| Mémoire contrôlée | 127 connaissances publiques ont le statut `validated`, dont 20 nouveaux enrichissements ciblés pour tablette, console et trottinette. Les propositions issues de l’IA restent en `review` ; aucune proposition IA n’est validée automatiquement. | Conforme |
| Progression contrôlée | Huit compétences privées possèdent désormais un niveau et des XP. Smartphone est niveau 5 « Technicien confirmé » ; tablette, console et trottinette sont passées au niveau 2 et restent les prochains domaines prioritaires. Le rang maximal exige 45 000 XP et aucune proposition IA non validée ne compte. | Conforme |
| Retour visiteur sans auto-validation | « Utile / pas utile » alimente seulement les compteurs de qualité. Le texte public ne prétend plus que le visiteur a validé une connaissance. | Conforme |
| Relais humain | WhatsApp et e-mail sont proposés quand un prix, une pièce ou un diagnostic doit être confirmé. Quatre réponses propriétaires ont déjà été reçues, renvoyées au navigateur et promues en mémoire validée. Les anciennes alertes de recette, dont le test « ouvert lundi », ont été classées `dismissed` sans suppression ; les 10 éléments d’apprentissage liés ont été automatiquement rejetés et aucune demande réelle ne reste en attente. | Conforme |
| Mesure commerciale | Sessions, réponses, tarifs, stocks, transferts, WhatsApp et e-mails sont comptés. Les pages et scénarios de test sont exclus : après les audits, le tableau commercial conserve une session et zéro coût IA. | Conforme |
| Budget IA | Cascade déterministe avant IA, modèle `gpt-5-mini`, plafond atomique de 1 000 appels mensuels. Les cinq derniers appels de variance ont coûté ensemble 0,001941 $, soit environ 0,000388 $ par réponse. | Conforme |
| Sécurité publique | La version 77 refuse une origine absente ou étrangère (403) et accepte les domaines/ports autorisés. Les clés privées restent côté serveur. | Conforme |
| Site iPhone unifié | L’ancien chat statique a été retiré. Un seul Sébastien utilise désormais le même cerveau et les mêmes tarifs que Solution Phone. | Conforme |
| Images du stock iPhone | Une bibliothèque locale couvre 52 modèles et générations d’iPhone avec des visuels officiels Apple. La photo réelle du stock reste prioritaire ; en son absence, le visuel correspondant est signalé comme tel. Les 52 iPhone actuellement renvoyés par le catalogue public trouvent tous une photo réelle ou un visuel automatique. | Conforme en préproduction |
| Devis par e-mail | Les formulaires Solution Phone, Assistant et iPhone exigent une adresse e-mail valide, transmettent la panne et placent l’adresse du client dans `Reply-To`. Le formulaire Solution Accessoires sépare désormais e-mail obligatoire et téléphone facultatif. Treize contrôles statiques passent ; la réception et le bouton « Répondre » restent à valider sur les vrais domaines. | Conforme en préproduction |
| Autre pièce iPhone | Le module de tarif propose désormais trois choix visibles : écran, batterie et autre pièce. La demande « autre pièce » conserve le modèle et la panne, puis offre WhatsApp ou e-mail ; l’adresse du client est placée dans `Reply-To`. | Conforme en préproduction |

## Résultats automatisés actuels

- 22 tests unitaires de routage, garde-fous, coût, réponse structurée et cohérence des alertes : réussis.
- 23 scénarios métier sur la fonction déployée : réussis, dont oxydation, chauffe dangereuse et réseau mobile.
- 100 intentions atelier réparties entre smartphone, ordinateur, tablette, console et trottinette : 100 réponses déterministes sur 100 après correction des faux positifs.
- Bibliothèque de 10 000 formulations uniques reliées à ces intentions. Le premier échantillon de 100 phrases sans accents et avec fautes atteint 100 réponses déterministes après correction ; les réponses sont aussi relues sémantiquement pour éviter les succès trompeurs.
- Version 78 déployée : normalisation de `tel`, `ordi`, `bateri`, `chargur` et `trotinette`, avec routes précises pour les pannes de tablette, console et trottinette avant les réponses génériques.
- 3 appels OpenAI réels consécutifs sur une panne Pixel inhabituelle : réponses concises et cohérentes, sans tarif inventé ni transfert prématuré.
- Une fausse alerte thermique produite lors d’un audit de variance est désormais neutralisée automatiquement lorsque la question ne contient aucun signal de danger.
- Vérification TypeScript/Deno de la fonction : réussie.
- Test contradictoire ajouté : une panne PC décrite seulement comme « bruit après une chute » ne déclenche plus le prix d’un écran ; une dalle cassée déclenche bien la fourchette de 100 à 170 €.
- Contrôle d’origine : domaine autorisé 200, origine absente 403, domaine étranger 403.

## Portes restantes avant remplacement de la V1

1. Validation visuelle et fonctionnelle explicite de Sébastien.
2. Basculement contrôlé des domaines vers la V2.
3. Contrôle immédiat sur les vrais domaines : assistant, FormSubmit, WhatsApp, tarifs, stock, SEO et métriques.
4. Observation pendant 14 jours de l’indicateur `contacts devis / sessions`, avec objectif de passer d’environ une à trois demandes quotidiennes.

Décision actuelle : assistant prêt pour la validation utilisateur, mais pas de mise en production automatique.
