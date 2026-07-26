-- Enrichissement contrôlé des trois compétences les moins couvertes.
-- Les réponses restent prudentes, concises et sans tarif inventé.

insert into public.evan_knowledge (
  slug, category, title, question_patterns, keywords, answer,
  follow_up_questions, recommended_actions, warnings,
  source, confidence, status, validated_by, validated_at, updated_at
)
values
  (
    'tablette-charge-lente-absente', 'tablette', 'Tablette qui charge lentement ou plus du tout',
    array['ipad ne charge plus','tablette charge très lentement','galaxy tab ne prend pas la charge','aucune recharge en cours ipad'],
    array['tablette','ipad','galaxy tab','charge','chargeur','câble','connecteur'],
    'Testez une prise, un câble et un chargeur adaptés, puis regardez si le port contient des débris sans y introduire d’objet métallique. Si la charge reste absente ou instable, le connecteur, la batterie ou le circuit de charge doivent être contrôlés avant devis.',
    '["Quel est le modèle exact ?","La tablette affiche-t-elle un symbole de charge avec un autre câble et un autre chargeur ?"]'::jsonb,
    '["Tester une alimentation adaptée","Contrôler visuellement le port","Faire diagnostiquer avant remplacement"]'::jsonb,
    array['Ne branchez rien si le port est humide, brûlé ou anormalement chaud.'],
    'assistance_officielle_apple_samsung_et_regle_atelier', 0.97, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'tablette-batterie-autonomie', 'tablette', 'Autonomie ou batterie de tablette',
    array['batterie ipad se vide vite','tablette ne tient plus la journée','prix batterie galaxy tab','ipad s éteint avec de la batterie'],
    array['tablette','ipad','galaxy tab','batterie','autonomie','remplacement'],
    'Une faible autonomie peut venir de l’usure, d’une application, du réseau, de la luminosité ou de la batterie. Indiquez le modèle et l’âge de la tablette : l’équipe vérifiera l’état de la batterie et confirmera le prix de la pièce et de la main-d’œuvre.',
    '["Quel est le modèle et l’âge de la tablette ?","La batterie chute-t-elle surtout au repos, en usage ou pendant la charge ?"]'::jsonb,
    '["Consulter l’usage batterie si disponible","Écarter une application très active","Confirmer le devis selon la référence"]'::jsonb,
    array['Si l’écran se soulève ou si la tablette gonfle ou chauffe fortement, ne la rechargez plus.'],
    'assistance_officielle_apple_samsung_et_regle_atelier', 0.96, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'tablette-ecran-tactile', 'tablette', 'Écran, vitre ou tactile de tablette',
    array['vitre ipad cassée','tactile tablette appuie tout seul','tablette a du son écran noir','écran galaxy tab fissuré'],
    array['tablette','ipad','galaxy tab','écran','vitre','tactile','affichage'],
    'Une vitre fissurée, un tactile autonome et un écran noir ne désignent pas forcément la même pièce. Le modèle exact et un contrôle de l’affichage permettent de savoir si la vitre, le bloc écran, une connexion ou la carte est concerné et d’établir le bon devis.',
    '["Quel est le modèle exact ?","Voyez-vous encore une image et le tactile répond-il sur toute la surface ?"]'::jsonb,
    '["Identifier la référence exacte","Tester image et tactile","Établir le devis après contrôle"]'::jsonb,
    array['N’appuyez pas sur une dalle fissurée et évitez l’usage si le châssis ou la batterie est déformé.'],
    'regle_diagnostic_atelier', 0.96, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'tablette-demarrage-mise-a-jour', 'tablette', 'Tablette bloquée au démarrage ou en mise à jour',
    array['ipad bloqué sur la pomme','tablette reste sur le logo','mise à jour ipad échoue','galaxy tab redémarre en boucle'],
    array['tablette','ipad','galaxy tab','logo','démarrage','mise à jour','boucle'],
    'Laissez d’abord la tablette sur un chargeur adapté, puis tentez uniquement le redémarrage forcé prévu par son fabricant. Si elle reste sur le logo ou boucle après une mise à jour, l’atelier contrôle le logiciel, le stockage et l’alimentation en protégeant les données autant que possible.',
    '["Quel est le modèle exact ?","Le problème a-t-il commencé après une mise à jour, une chute ou une batterie vide ?"]'::jsonb,
    '["Assurer une charge suffisante","Tenter un seul redémarrage forcé adapté","Diagnostiquer avant restauration"]'::jsonb,
    array['Une restauration peut effacer les données : ne la lancez pas avant d’avoir évalué la sauvegarde.'],
    'assistance_officielle_apple_samsung_et_regle_donnees', 0.96, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'tablette-wifi-reseau', 'tablette', 'Wi-Fi ou réseau mobile de tablette',
    array['ipad se déconnecte du wifi','tablette 4g sans réseau','galaxy tab ne trouve plus le wifi','sim reconnue mais pas internet tablette'],
    array['tablette','ipad','galaxy tab','wifi','réseau','4g','5g','sim','esim'],
    'Si les autres appareils se connectent, redémarrez la tablette et la box puis oubliez et reconnectez le réseau. Pour une tablette 4G/5G, précisez si la SIM fonctionne ailleurs : réglage, opérateur, antenne ou logiciel peuvent être en cause avant toute réparation matérielle.',
    '["Quel est le modèle exact et est-il Wi-Fi ou cellulaire ?","Le défaut existe-t-il sur plusieurs réseaux ou avec une autre SIM ?"]'::jsonb,
    '["Comparer avec un autre réseau","Tester la SIM si le modèle est cellulaire","Diagnostiquer avant remplacement"]'::jsonb,
    array['Ne réinitialisez pas entièrement la tablette sans sauvegarde.'],
    'assistance_fabricants_et_regle_diagnostic', 0.95, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'tablette-code-donnees', 'tablette', 'Code oublié et données de tablette',
    array['code ipad oublié garder photos','tablette verrouillée récupérer données','ipad indisponible photos','mot de passe galaxy tab oublié'],
    array['tablette','ipad','galaxy tab','code','verrouillé','indisponible','photos','données'],
    'Un code oublié ne peut pas être contourné proprement. Selon le modèle, la solution officielle peut exiger un effacement puis une restauration depuis une sauvegarde ; avant toute action, l’équipe vérifie avec vous le compte, les sauvegardes disponibles et la preuve de propriété.',
    '["Quel est le modèle exact ?","Disposez-vous du compte associé et d’une sauvegarde iCloud, Google ou ordinateur ?"]'::jsonb,
    '["Vérifier le compte et la propriété","Chercher une sauvegarde","Expliquer le risque d’effacement"]'::jsonb,
    array['Ne promettez jamais une récupération de données chiffrées sans le code.'],
    'assistance_officielle_apple_google_et_regle_donnees', 0.98, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'tablette-accessoire-stylet', 'tablette', 'Stylet ou clavier de tablette',
    array['apple pencil ne se connecte plus','stylet tablette ne charge plus','clavier ipad ne marche plus','s pen non détecté'],
    array['tablette','ipad','apple pencil','s pen','stylet','clavier','bluetooth','charge'],
    'Vérifiez la compatibilité avec le modèle, la charge, le Bluetooth et les contacts propres, puis testez l’accessoire sur une autre tablette compatible si possible. Le défaut peut venir de l’accessoire, de sa batterie, du connecteur ou de la tablette ; apportez les deux au diagnostic.',
    '["Quel est le modèle de la tablette et de l’accessoire ?","L’accessoire est-il détecté ou totalement absent ?"]'::jsonb,
    '["Vérifier la compatibilité","Tester la charge et la détection","Apporter tablette et accessoire"]'::jsonb,
    array['N’utilisez pas de liquide directement sur les contacts.'],
    'assistance_fabricants_et_regle_atelier', 0.94, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'tablette-audio-camera-boutons', 'tablette', 'Son, caméra ou boutons de tablette',
    array['son ipad grésille','caméra tablette floue','bouton marche tablette enfoncé','volume galaxy tab ne marche plus'],
    array['tablette','ipad','galaxy tab','son','haut-parleur','caméra','bouton','volume'],
    'Un son faible peut venir d’une grille ou du haut-parleur ; une caméra floue d’un verre, d’un logiciel ou du module ; un bouton bloqué de la nappe ou du mécanisme. Précisez le modèle et le symptôme pour que l’équipe confirme la prise en charge et le devis.',
    '["Quel est le modèle exact ?","Le défaut est-il apparu après une chute, du liquide ou une réparation ?"]'::jsonb,
    '["Écarter saleté et réglage","Identifier le composant concerné","Confirmer la prise en charge"]'::jsonb,
    array['Après un liquide, éteignez la tablette et ne la rechargez pas.'],
    'regle_diagnostic_atelier', 0.94, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'console-alimentation-demarrage', 'console', 'Console qui ne s’allume plus',
    array['ps5 ne s allume plus','xbox ne démarre plus','console aucun voyant','playstation s éteint immédiatement'],
    array['console','ps5','ps4','xbox','alimentation','démarrage','voyant'],
    'Testez une prise murale et le câble d’origine sans multiprise, puis laissez la console débranchée quelques minutes. Si aucun voyant n’apparaît ou si elle s’éteint aussitôt, alimentation, bouton, court-circuit ou carte peuvent être concernés : le modèle exact est nécessaire avant devis.',
    '["Quelle console et quelle version ?","Y a-t-il un voyant, un bip ou une extinction immédiate ?"]'::jsonb,
    '["Tester prise et câble","Noter voyant et bip","Diagnostiquer alimentation et carte"]'::jsonb,
    array['Après liquide, odeur ou crépitement, ne rebranchez pas la console.'],
    'assistance_officielle_playstation_xbox_et_regle_atelier', 0.96, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'console-surchauffe-ventilation', 'console', 'Console bruyante ou en surchauffe',
    array['ps5 surchauffe et s éteint','console ventilateur très bruyant','xbox chauffe beaucoup','playstation message de surchauffe'],
    array['console','ps5','ps4','xbox','surchauffe','ventilateur','bruit','poussière'],
    'Éteignez la console si elle affiche une alerte ou coupe seule. Placez-la dans un espace dégagé et vérifiez que les aérations ne sont pas obstruées ; si le bruit ou la chauffe persiste, ventilation, poussière ou refroidissement doivent être contrôlés.',
    '["Quelle console et quelle version ?","Chauffe-t-elle dès le démarrage ou seulement en jeu ?"]'::jsonb,
    '["Éteindre après alerte","Dégager les aérations","Faire contrôler le refroidissement"]'::jsonb,
    array['Débranchez la console avant tout nettoyage extérieur et n’injectez pas d’air comprimé puissant.'],
    'assistance_officielle_playstation_et_regle_atelier', 0.97, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'console-lecteur-disque', 'console', 'Console qui ne lit plus les disques',
    array['ps5 ne lit plus les jeux','xbox disque non reconnu','lecteur console fait du bruit','disque bloqué playstation'],
    array['console','ps5','ps4','xbox','lecteur','disque','jeu','blu-ray'],
    'Nettoyez doucement un disque fiable et testez-en un second compatible. Si plusieurs disques échouent, le mécanisme, la lentille, le logiciel ou l’association du lecteur peuvent être en cause ; ne forcez pas un disque bloqué et demandez un diagnostic avant devis.',
    '["Quelle console et quelle version ?","Plusieurs disques propres échouent-ils et le lecteur fait-il un bruit anormal ?"]'::jsonb,
    '["Tester un second disque","Ne pas forcer le mécanisme","Diagnostiquer le lecteur"]'::jsonb,
    array['Une réinitialisation complète peut effacer les données et ne doit pas être la première étape.'],
    'assistance_officielle_playstation_xbox_et_regle_atelier', 0.96, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'console-mode-securise-mise-a-jour', 'console', 'Mode sans échec ou mise à jour de console',
    array['ps5 bloquée mode sans échec','mise à jour console échoue','playstation réparation stockage boucle','xbox code erreur mise à jour'],
    array['console','ps5','ps4','xbox','mode sans échec','mise à jour','stockage','code erreur'],
    'Notez le code exact et commencez par l’option la moins destructive : redémarrage, câble ou mise à jour officielle. Certaines options de réinitialisation effacent les données ; si la console revient toujours en mode sécurisé, l’équipe contrôle le stockage et le logiciel avant toute restauration.',
    '["Quelle console et quel code erreur ?","Avez-vous une sauvegarde et quelle option a déjà été essayée ?"]'::jsonb,
    '["Noter le code erreur","Utiliser uniquement la mise à jour officielle","Préserver les données avant réinitialisation"]'::jsonb,
    array['Réinitialiser ou réinstaller le système peut supprimer toutes les données utilisateur.'],
    'assistance_officielle_playstation_xbox_et_regle_donnees', 0.97, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'console-switch-charge-dock', 'console', 'Nintendo Switch qui ne charge plus ou n’affiche plus sur le dock',
    array['switch ne charge plus','switch aucune image dock','station accueil switch ne marche plus','nintendo switch voyant charge absent'],
    array['nintendo','switch','charge','chargeur','dock','station','usb-c','télévision'],
    'Testez l’adaptateur adapté directement sur la Switch puis, séparément, le dock et un autre câble HDMI. Si elle charge en direct mais pas sur le dock, ou inversement, apportez la console, son alimentation et le dock : le connecteur, l’alimentation ou la station doivent être distingués.',
    '["Quel modèle de Switch utilisez-vous ?","Charge-t-elle directement hors du dock et l’image apparaît-elle sur son écran ?"]'::jsonb,
    '["Tester la charge directe","Tester le dock séparément","Apporter console, dock et alimentation"]'::jsonb,
    array['N’utilisez pas un port USB-C tordu, humide ou qui chauffe.'],
    'assistance_officielle_nintendo_et_regle_atelier', 0.97, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'console-switch-cartouche', 'console', 'Nintendo Switch qui ne reconnaît plus les cartouches',
    array['switch ne lit plus les cartouches','jeu switch non reconnu','lecteur cartouche switch cassé','carte de jeu nintendo erreur'],
    array['nintendo','switch','cartouche','carte de jeu','lecteur','jeu'],
    'Éteignez la Switch, retirez puis remettez une cartouche propre et testez un second jeu compatible. Si aucune cartouche n’est reconnue, le lecteur ou sa connexion doit être contrôlé ; ne soufflez pas et n’introduisez rien dans le logement.',
    '["Quel modèle de Switch utilisez-vous ?","Plusieurs cartouches fonctionnelles donnent-elles la même erreur ?"]'::jsonb,
    '["Tester une seconde cartouche","Ne rien introduire dans le lecteur","Faire diagnostiquer le logement"]'::jsonb,
    array['Ne nettoyez pas le logement avec un liquide ou un objet métallique.'],
    'assistance_officielle_nintendo_et_regle_atelier', 0.96, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'console-wifi-stockage', 'console', 'Wi-Fi ou stockage de console',
    array['console se déconnecte du wifi','stockage ps5 plein','xbox manque de place','switch ne trouve pas réseau sans fil'],
    array['console','ps5','xbox','switch','wifi','réseau','stockage','ssd'],
    'Pour le Wi-Fi, comparez avec un autre réseau et redémarrez box et console. Pour le stockage, ne commandez pas un disque au hasard : le type compatible, l’espace réellement libre et la sauvegarde doivent être vérifiés selon la console avant installation ou devis.',
    '["Quelle console et quel problème : réseau ou stockage ?","Le Wi-Fi échoue-t-il ailleurs, ou quel espace souhaitez-vous ajouter ?"]'::jsonb,
    '["Comparer avec un autre réseau","Vérifier le stockage compatible","Sauvegarder avant intervention"]'::jsonb,
    array['Une initialisation ou un formatage peut supprimer jeux locaux et sauvegardes non synchronisées.'],
    'assistance_officielle_nintendo_playstation_xbox', 0.94, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'mobilite-demarrage-alimentation', 'mobilite', 'Trottinette qui ne s’allume plus',
    array['trottinette ne s allume plus','xiaomi aucun voyant','ninebot démarre puis s éteint','trottinette complètement morte'],
    array['trottinette','xiaomi','ninebot','démarrage','alimentation','voyant','batterie'],
    'Vérifiez seulement que le chargeur adapté et la prise fonctionnent, puis notez le voyant et tout code erreur. Batterie déchargée, connecteur, afficheur, câblage, contrôleur ou protection électronique peuvent être en cause : la batterie ne doit pas être condamnée sans mesure.',
    '["Quelle marque et quel modèle ?","Que fait le voyant du chargeur et un code erreur s’affiche-t-il ?"]'::jsonb,
    '["Tester la prise et le chargeur adapté","Noter voyant et code","Mesurer avant remplacement"]'::jsonb,
    array['Ne chargez pas après infiltration d’eau, odeur, gonflement ou chauffe anormale.'],
    'manuel_fabricant_segway_xiaomi_et_regle_atelier', 0.96, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'mobilite-eau-oxydation', 'mobilite', 'Trottinette exposée à l’eau',
    array['trottinette sous forte pluie ne démarre plus','eau dans trottinette électrique','xiaomi mouillée ne s allume plus','ninebot a pris l eau'],
    array['trottinette','eau','pluie','humidité','oxydation','charge'],
    'Éteignez-la, ne la branchez pas et ne tentez pas de la rallumer. Séchez seulement l’extérieur sans chaleur ; l’eau peut atteindre la batterie, le contrôleur ou les connecteurs, donc un contrôle est nécessaire avant toute recharge ou remise en circulation.',
    '["Quel est le modèle exact ?","A-t-elle été immergée ou exposée à la pluie, et depuis combien de temps ?"]'::jsonb,
    '["Couper l’alimentation","Ne pas recharger","Faire contrôler avant usage"]'::jsonb,
    array['En cas de chauffe, odeur, fumée ou crépitement, éloignez-vous et appelez les secours.'],
    'manuel_fabricant_et_regle_securite_atelier', 0.98, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'mobilite-frein-reglage', 'mobilite', 'Frein de trottinette faible ou bruyant',
    array['frein trottinette ne freine plus','disque trottinette frotte','frein xiaomi fait du bruit','levier frein trottinette mou'],
    array['trottinette','frein','disque','plaquette','câble','réglage','bruit'],
    'Ne roulez plus si la puissance de freinage a diminué. Un frottement léger peut venir d’un réglage, mais câble, plaquettes, disque, étrier ou frein électronique doivent être contrôlés ; indiquez le modèle et la roue concernée pour confirmer la prise en charge.',
    '["Quel est le modèle exact ?","Le frein manque-t-il de puissance, frotte-t-il ou le levier est-il mou ?"]'::jsonb,
    '["Cesser de rouler si freinage faible","Identifier le type de frein","Contrôler avant réglage ou remplacement"]'::jsonb,
    array['Un freinage insuffisant rend la trottinette dangereuse à utiliser.'],
    'manuel_fabricant_et_regle_securite_atelier', 0.97, 'validated', 'Sébastien · Solution Phone', now(), now()
  )
on conflict (slug) do update set
  category = excluded.category,
  title = excluded.title,
  question_patterns = excluded.question_patterns,
  keywords = excluded.keywords,
  answer = excluded.answer,
  follow_up_questions = excluded.follow_up_questions,
  recommended_actions = excluded.recommended_actions,
  warnings = excluded.warnings,
  source = excluded.source,
  confidence = excluded.confidence,
  status = excluded.status,
  validated_by = excluded.validated_by,
  validated_at = excluded.validated_at,
  updated_at = excluded.updated_at;

insert into public.evan_training_phrases (knowledge_id, phrase)
select knowledge.id, training.phrase
from public.evan_knowledge as knowledge
join (values
  ('tablette-charge-lente-absente','mon ipad ne prend plus la charge'),
  ('tablette-charge-lente-absente','ma galaxy tab charge toute doucement'),
  ('tablette-charge-lente-absente','la tablette dit aucune recharge en cours'),
  ('tablette-batterie-autonomie','la batterie de mon ipad se vide trop vite'),
  ('tablette-batterie-autonomie','combien pour changer batterie tablette samsung'),
  ('tablette-batterie-autonomie','ma tablette s éteint alors qu il reste de la batterie'),
  ('tablette-ecran-tactile','la vitre de mon ipad est fissurée'),
  ('tablette-ecran-tactile','le tactile de ma tablette appuie tout seul'),
  ('tablette-ecran-tactile','ma tablette sonne mais écran noir'),
  ('tablette-demarrage-mise-a-jour','mon ipad reste bloqué sur la pomme'),
  ('tablette-demarrage-mise-a-jour','la mise à jour de la tablette échoue'),
  ('tablette-demarrage-mise-a-jour','ma galaxy tab redémarre en boucle'),
  ('tablette-wifi-reseau','mon ipad perd le wifi tout le temps'),
  ('tablette-wifi-reseau','ma tablette 4g reconnaît la sim sans réseau'),
  ('tablette-wifi-reseau','la galaxy tab ne voit plus ma box'),
  ('tablette-code-donnees','j ai oublié le code de mon ipad et je veux mes photos'),
  ('tablette-code-donnees','ma tablette est verrouillée comment garder les données'),
  ('tablette-code-donnees','ipad indisponible sans perdre les photos'),
  ('tablette-accessoire-stylet','mon apple pencil ne charge plus'),
  ('tablette-accessoire-stylet','le s pen n est plus détecté'),
  ('tablette-accessoire-stylet','le clavier de mon ipad ne fonctionne plus'),
  ('tablette-audio-camera-boutons','le son de ma tablette grésille'),
  ('tablette-audio-camera-boutons','la caméra de mon ipad reste floue'),
  ('tablette-audio-camera-boutons','le bouton marche de la tablette est enfoncé'),
  ('console-alimentation-demarrage','ma ps5 ne s allume plus du tout'),
  ('console-alimentation-demarrage','la xbox démarre puis s éteint'),
  ('console-alimentation-demarrage','ma console ne fait aucun voyant'),
  ('console-surchauffe-ventilation','ma playstation chauffe et se coupe'),
  ('console-surchauffe-ventilation','le ventilateur de la ps5 fait beaucoup de bruit'),
  ('console-surchauffe-ventilation','ma xbox affiche une surchauffe'),
  ('console-lecteur-disque','ma ps5 ne reconnaît plus aucun jeu'),
  ('console-lecteur-disque','le lecteur de la xbox fait un bruit bizarre'),
  ('console-lecteur-disque','un disque est bloqué dans la playstation'),
  ('console-mode-securise-mise-a-jour','ma ps5 reste en mode sans échec'),
  ('console-mode-securise-mise-a-jour','la mise à jour de ma console ne passe pas'),
  ('console-mode-securise-mise-a-jour','la playstation boucle sur réparation stockage'),
  ('console-switch-charge-dock','ma switch ne charge ni sur le dock ni au câble'),
  ('console-switch-charge-dock','la switch charge mais plus d image sur la télé'),
  ('console-switch-charge-dock','le dock de ma nintendo switch ne fonctionne plus'),
  ('console-switch-cartouche','ma switch ne lit plus les cartouches'),
  ('console-switch-cartouche','aucun jeu nintendo n est reconnu'),
  ('console-switch-cartouche','le lecteur de carte switch est cassé'),
  ('console-wifi-stockage','ma console se déconnecte sans arrêt du wifi'),
  ('console-wifi-stockage','je veux mettre plus de stockage dans ma ps5'),
  ('console-wifi-stockage','ma switch ne trouve plus mon réseau'),
  ('mobilite-demarrage-alimentation','ma trottinette ne donne plus aucun signe de vie'),
  ('mobilite-demarrage-alimentation','ma xiaomi démarre puis s éteint'),
  ('mobilite-demarrage-alimentation','la ninebot ne s allume plus du tout'),
  ('mobilite-eau-oxydation','ma trottinette a pris une grosse pluie'),
  ('mobilite-eau-oxydation','de l eau est entrée dans ma xiaomi'),
  ('mobilite-eau-oxydation','ma ninebot mouillée ne démarre plus'),
  ('mobilite-frein-reglage','ma trottinette freine très mal'),
  ('mobilite-frein-reglage','le disque de frein frotte et fait du bruit'),
  ('mobilite-frein-reglage','le levier de frein de ma xiaomi est tout mou')
) as training(slug, phrase) on training.slug = knowledge.slug
on conflict (knowledge_id, phrase) do nothing;
