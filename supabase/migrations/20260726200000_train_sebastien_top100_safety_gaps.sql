-- Premier enrichissement issu du banc de 100 demandes atelier.
-- Les réponses privilégient la sécurité et n'inventent aucun tarif.

insert into public.evan_knowledge (
  slug, category, title, question_patterns, keywords, answer,
  follow_up_questions, recommended_actions, warnings,
  source, confidence, status, validated_by, validated_at, updated_at
)
values
  (
    'liquide-appareil-electrique', 'securite', 'Liquide sur tablette, console ou trottinette',
    array['liquide sur ma console','tablette mouillée','trottinette sous la pluie','appareil électrique tombé dans l eau'],
    array['liquide','eau','humidité','console','tablette','trottinette','sécurité'],
    'Éteignez l’appareil, débranchez le chargeur et ne tentez ni recharge ni rallumage. N’utilisez pas de riz ni de chaleur : un contrôle rapide limite le risque de court-circuit et d’oxydation.',
    '["Quel appareil et quel modèle ?","Quel liquide et depuis combien de temps ?"]'::jsonb,
    '["Couper l’alimentation","Ne pas recharger","Faire contrôler rapidement"]'::jsonb,
    array['Si la batterie chauffe, gonfle, fume ou sent anormalement, éloignez-vous et ne la manipulez pas.'],
    'support_fabricants_et_regle_atelier', 0.97, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'appareil-deforme-securite', 'securite', 'Appareil ou châssis déformé',
    array['tablette tordue','châssis déformé','écran se soulève après une chute','appareil plié'],
    array['tordu','déformé','châssis','écran','soulève','batterie','sécurité'],
    'N’appuyez pas sur la coque et évitez de recharger l’appareil : une déformation peut avoir comprimé l’écran ou la batterie. L’atelier doit contrôler le châssis et vérifier qu’il n’y a pas de gonflement.',
    '["Quel est le modèle exact ?","La déformation suit-elle une chute ou l’écran s’est-il soulevé seul ?"]'::jsonb,
    '["Ne pas forcer la coque","Éviter la charge","Faire contrôler le châssis et la batterie"]'::jsonb,
    array['Une batterie gonflée ne doit pas être pressée, percée ou rechargée.'],
    'regle_securite_atelier', 0.97, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'disque-bruit-donnees', 'informatique', 'Disque dur qui clique ou claque',
    array['disque dur fait clic clic','ordinateur fait des claquements','hdd fait un bruit mécanique','disque claque et pc bloque'],
    array['disque dur','hdd','clic','claquement','bruit','données','récupération'],
    'Éteignez le PC et évitez les redémarrages répétés : un disque qui clique ou claque peut être en panne mécanique et chaque essai peut réduire les chances de récupération. L’équipe contrôle d’abord les données avant de parler remplacement.',
    '["Les données sont-elles sauvegardées ?","Quel est le modèle de l’ordinateur ?"]'::jsonb,
    '["Éteindre le PC","Ne pas relancer de test intensif","Évaluer la récupération des données"]'::jsonb,
    array['Ne lancez pas de réinstallation ou de formatage avant d’avoir sécurisé les données.'],
    'regle_securite_donnees', 0.97, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'mobilite-batterie-danger', 'mobilite', 'Batterie ou chargeur de trottinette dangereux',
    array['batterie trottinette chauffe','chargeur trottinette très chaud','odeur batterie trottinette','trottinette fume en charge'],
    array['trottinette','batterie','chargeur','chauffe','odeur','fumée','sécurité'],
    'Arrêtez la charge et n’utilisez plus la trottinette. Si cela peut se faire sans toucher une zone chaude ou déformée, débranchez le secteur ; éloignez l’ensemble des matières inflammables et faites-le contrôler avant tout nouvel essai.',
    '["Quel est le modèle exact ?","La batterie ou le chargeur est-il déformé, odorant ou brûlant ?"]'::jsonb,
    '["Arrêter la charge","Ne plus rouler","Faire contrôler batterie et chargeur"]'::jsonb,
    array['En présence de fumée ou de crépitements, éloignez-vous et appelez les secours.'],
    'support_fabricants_et_regle_atelier', 0.98, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'mobilite-securite-roulage', 'mobilite', 'Freinage, direction ou pliage de trottinette',
    array['trottinette freine mal','guidon de trottinette bouge','système de pliage a du jeu','direction tremble'],
    array['trottinette','frein','freinage','guidon','direction','pliage','potence','jeu'],
    'Ne roulez plus tant que le freinage, la direction ou le verrouillage de pliage n’a pas été contrôlé. Une simple vis ou un réglage peut suffire, mais une pièce usée ou fissurée doit être identifiée avant de reprendre la route.',
    '["Quel est le modèle exact ?","Le défaut concerne-t-il le freinage, le guidon ou le verrouillage de pliage ?"]'::jsonb,
    '["Cesser de rouler","Contrôler le serrage et l’usure sans démontage risqué","Confirmer la prise en charge"]'::jsonb,
    array['Un jeu dans la potence ou une perte de freinage rend la conduite dangereuse.'],
    'support_fabricants_et_regle_atelier', 0.97, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'mobilite-pneu', 'mobilite', 'Pneu ou crevaison de trottinette',
    array['pneu trottinette crevé','roue se dégonfle','chambre à air trottinette','pression pneu trottinette'],
    array['trottinette','pneu','crevé','crevaison','dégonfle','pression','chambre à air'],
    'Évitez de rouler avec un pneu dégonflé : cela peut abîmer la jante, le moteur ou le pneu. Le devis dépend du modèle, de la roue concernée et du montage avec chambre à air, tubeless ou pneu plein.',
    '["Quel est le modèle exact ?","S’agit-il de la roue avant ou arrière ?"]'::jsonb,
    '["Ne pas rouler sous-gonflé","Identifier le type de pneu","Confirmer le devis"]'::jsonb,
    array['La pression correcte dépend du modèle et du pneu monté.'],
    'support_fabricants_et_regle_atelier', 0.95, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'mobilite-charge-autonomie', 'mobilite', 'Charge ou autonomie de trottinette',
    array['trottinette ne charge plus','autonomie divisée par deux','voyant chargeur reste vert','batterie trottinette se vide vite'],
    array['trottinette','charge','chargeur','batterie','autonomie','voyant vert'],
    'Une charge absente ou une forte perte d’autonomie peut venir du chargeur, du connecteur, de la température, de la batterie ou de son électronique. N’achetez pas une batterie avant contrôle : indiquez le modèle, l’âge et le comportement du voyant pour un diagnostic et un devis précis.',
    '["Quel est le modèle et l’âge de la trottinette ?","Que fait le voyant du chargeur une fois branché ?"]'::jsonb,
    '["Tester uniquement le chargeur adapté","Contrôler connecteur et batterie","Établir le devis après mesure"]'::jsonb,
    array['Ne rechargez pas une batterie gonflée, odorante, humide ou anormalement chaude.'],
    'support_fabricants_et_regle_atelier', 0.95, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'mobilite-moteur-puissance', 'mobilite', 'Moteur ou perte de puissance de trottinette',
    array['roue moteur fait des à-coups','trottinette perd de la puissance','trottinette avance à 10 km h','moteur trottinette fait du bruit'],
    array['trottinette','moteur','roue','à-coups','puissance','vitesse','bruit'],
    'Des à-coups ou une perte de puissance peuvent venir du frein, d’un pneu, d’un câble moteur, d’un capteur, du contrôleur ou de la batterie. Arrêtez de rouler si la roue bloque, chauffe ou fait un bruit mécanique, puis transmettez le modèle et le code erreur éventuel.',
    '["Quel est le modèle exact ?","Un code erreur s’affiche-t-il et la roue tourne-t-elle librement à l’arrêt ?"]'::jsonb,
    '["Ne pas forcer le moteur","Noter le code erreur","Faire contrôler roue, câbles et électronique"]'::jsonb,
    array['Ne roulez pas si la roue se bloque ou si le moteur chauffe anormalement.'],
    'support_fabricants_et_regle_atelier', 0.95, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'mobilite-electronique', 'mobilite', 'Électronique et commandes de trottinette',
    array['code erreur trottinette','écran trottinette éteint','accélérateur ne répond plus','application trottinette ne se connecte plus'],
    array['trottinette','code erreur','afficheur','écran','accélérateur','application','firmware','phare'],
    'Le code exact et le modèle sont indispensables : afficheur, accélérateur, faisceau, contrôleur, éclairage ou logiciel peuvent être concernés. Notez le code sans multiplier les réinitialisations et demandez la confirmation de prise en charge avant de vous déplacer.',
    '["Quel est le modèle exact et le code affiché ?","La trottinette roule-t-elle encore normalement ?"]'::jsonb,
    '["Noter le code erreur","Éviter les mises à jour répétées","Faire confirmer la prise en charge"]'::jsonb,
    array['Ne roulez pas si l’accélérateur, l’afficheur ou l’éclairage compromet la sécurité.'],
    'support_fabricants_et_regle_atelier', 0.94, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'console-drift-manette', 'console', 'Joystick ou drift de manette',
    array['joystick bouge tout seul','drift manette ps5','stick joy con dérive','manette tire toute seule'],
    array['console','manette','joystick','stick','drift','joy-con'],
    'Un déplacement tout seul vient souvent du stick, mais un calibrage ou un réglage doit être écarté avant réparation. Indiquez la console et la manette concernée ; l’équipe confirmera la solution et le devis sans promettre une pièce à distance.',
    '["Quelle console et quelle manette ?","Le défaut existe-t-il dans plusieurs jeux ou dans le test de calibrage ?"]'::jsonb,
    '["Tester le calibrage","Identifier la manette","Confirmer le devis"]'::jsonb,
    array['N’injectez pas de produit liquide dans le joystick.'],
    'support_nintendo_playstation_et_regle_atelier', 0.95, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'ordinateur-surchauffe', 'informatique', 'Ordinateur qui chauffe ou ventile fort',
    array['pc chauffe et ventilateur fort','ordinateur surchauffe','macbook très chaud','ventilateur pc fait beaucoup de bruit'],
    array['ordinateur','pc','macbook','chauffe','surchauffe','ventilateur','poussière'],
    'Une forte chauffe peut venir de la poussière, de la ventilation, de la pâte thermique, d’un logiciel très actif ou d’une batterie. Éteignez le PC s’il devient brûlant ou s’arrête seul ; le modèle et le moment où il chauffe permettent d’orienter le contrôle.',
    '["Quel est le modèle exact ?","Chauffe-t-il au repos, pendant la charge ou seulement en usage intensif ?"]'::jsonb,
    '["Dégager les aérations","Éteindre en cas de chauffe forte","Contrôler ventilation et batterie"]'::jsonb,
    array['N’utilisez pas d’air comprimé puissant dans les aérations sans démontage adapté.'],
    'support_fabricants_et_regle_atelier', 0.95, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'ordinateur-clavier', 'informatique', 'Clavier d’ordinateur défectueux',
    array['touches clavier ne fonctionnent plus','clavier pc écrit tout seul','clavier macbook en panne','liquide sur clavier ordinateur'],
    array['ordinateur','pc','macbook','clavier','touches','liquide'],
    'Quelques touches peuvent être bloquées par un réglage, une saleté, une nappe, le clavier ou un liquide. Testez si possible un clavier USB ; en cas de liquide, éteignez le PC et ne le rechargez plus. Le devis dépend du modèle exact et du type de clavier.',
    '["Quel est le modèle exact ?","La panne suit-elle un liquide et un clavier externe fonctionne-t-il ?"]'::jsonb,
    '["Tester un clavier externe","Couper l’alimentation après liquide","Identifier la référence du clavier"]'::jsonb,
    array['Après un liquide, évitez tout nouvel essai de charge.'],
    'support_fabricants_et_regle_atelier', 0.95, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'ordinateur-usb', 'informatique', 'Ports USB d’ordinateur',
    array['ports usb ne marchent plus','ordinateur ne reconnaît plus les clés usb','prise usb pc cassée','usb macbook non détecté'],
    array['ordinateur','pc','macbook','usb','port','connecteur','périphérique'],
    'Testez deux périphériques fiables et, si possible, plusieurs ports. Si tous échouent, le logiciel, l’alimentation USB ou la carte mère peuvent être concernés ; si un port est tordu ou bouge, ne forcez plus la fiche et faites établir un devis.',
    '["Quel est le modèle exact ?","Tous les ports et plusieurs accessoires sont-ils concernés ?"]'::jsonb,
    '["Tester plusieurs périphériques","Ne pas forcer un port abîmé","Faire diagnostiquer le port ou la carte"]'::jsonb,
    array['Débranchez immédiatement un accessoire si le port chauffe ou sent anormalement.'],
    'support_fabricants_et_regle_atelier', 0.95, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'ordinateur-webcam', 'informatique', 'Webcam d’ordinateur non détectée',
    array['webcam pc non détectée','caméra macbook ne marche plus','ordinateur ne trouve plus la webcam','image webcam noire'],
    array['ordinateur','pc','macbook','webcam','caméra','confidentialité','pilote'],
    'Vérifiez le cache physique, l’autorisation caméra et une seconde application. Si la webcam reste absente ou si la panne suit un choc ou un écran remplacé, la nappe ou le module doit être contrôlé ; le modèle exact permet de confirmer la réparation.',
    '["Quel est le modèle exact ?","La caméra est-elle absente partout ou seulement dans une application ?"]'::jsonb,
    '["Vérifier cache et autorisations","Tester une seconde application","Contrôler nappe et module"]'::jsonb,
    array['Aucun démontage n’est nécessaire avant le diagnostic.'],
    'support_fabricants_et_regle_atelier', 0.94, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'ordinateur-charniere-coque', 'informatique', 'Charnière ou coque d’ordinateur cassée',
    array['charnière pc cassée','coque ordinateur s ouvre','écran arrache la coque du portable','macbook charnière dure'],
    array['ordinateur','pc','macbook','charnière','coque','châssis','écran'],
    'Évitez d’ouvrir et fermer l’écran : une charnière arrachée peut casser la coque, la dalle ou les câbles. La réparation dépend du modèle et de l’état des fixations ; envoyez une photo ou passez au diagnostic pour un devis précis.',
    '["Quel est le modèle exact ?","La charnière est-elle dure, desserrée ou arrachée de la coque ?"]'::jsonb,
    '["Limiter les mouvements de l’écran","Contrôler coque et câbles","Établir un devis sur photo ou diagnostic"]'::jsonb,
    array['Ne forcez pas l’écran au-delà du point de résistance.'],
    'regle_atelier', 0.95, 'validated', 'Sébastien · Solution Phone', now(), now()
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
  ('liquide-appareil-electrique','du liquide est entré dans ma console'),
  ('liquide-appareil-electrique','ma tablette a pris l eau'),
  ('liquide-appareil-electrique','j ai roulé sous la pluie et ma trottinette ne démarre plus'),
  ('appareil-deforme-securite','ma tablette est tordue après une chute'),
  ('appareil-deforme-securite','le châssis de mon ipad est déformé'),
  ('disque-bruit-donnees','mon disque dur fait clic clic'),
  ('disque-bruit-donnees','le pc claque et se bloque'),
  ('mobilite-batterie-danger','la batterie de ma trottinette chauffe et sent bizarre'),
  ('mobilite-batterie-danger','le chargeur de trottinette devient brûlant'),
  ('mobilite-securite-roulage','ma trottinette freine mal'),
  ('mobilite-securite-roulage','le guidon bouge et le pliage a du jeu'),
  ('mobilite-pneu','le pneu de ma xiaomi est crevé'),
  ('mobilite-pneu','la roue de trottinette se dégonfle'),
  ('mobilite-charge-autonomie','le voyant du chargeur reste vert'),
  ('mobilite-charge-autonomie','l autonomie de ma trottinette a baissé de moitié'),
  ('mobilite-moteur-puissance','la roue moteur donne des à coups'),
  ('mobilite-moteur-puissance','ma trottinette a perdu toute sa puissance'),
  ('mobilite-electronique','ma trottinette affiche une clé rouge'),
  ('mobilite-electronique','l accélérateur ne répond plus'),
  ('console-drift-manette','le joystick bouge tout seul'),
  ('console-drift-manette','ma manette ps5 a du drift'),
  ('ordinateur-surchauffe','mon pc chauffe et le ventilateur tourne très fort'),
  ('ordinateur-surchauffe','mon macbook devient brûlant'),
  ('ordinateur-clavier','plusieurs touches du clavier ne marchent plus'),
  ('ordinateur-clavier','mon clavier pc écrit tout seul'),
  ('ordinateur-usb','mes ports usb ne reconnaissent plus rien'),
  ('ordinateur-usb','la prise usb du pc est tordue'),
  ('ordinateur-webcam','la webcam de mon portable n est plus détectée'),
  ('ordinateur-webcam','la caméra de mon macbook reste noire'),
  ('ordinateur-charniere-coque','la charnière est cassée et la coque s ouvre'),
  ('ordinateur-charniere-coque','l écran de mon pc arrache la coque')
) as training(slug, phrase) on training.slug = knowledge.slug
on conflict (knowledge_id, phrase) do nothing;
