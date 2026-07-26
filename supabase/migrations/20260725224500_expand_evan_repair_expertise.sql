-- Extension de l'expertise pratique d'Evan sans ajouter de tarif non validé.
-- Chaque réponse reste courte, prudente et renvoie vers l'équipe pour le devis précis.

insert into public.evan_knowledge (
  slug, category, title, question_patterns, keywords, answer,
  follow_up_questions, recommended_actions, warnings,
  source, confidence, status, validated_by, validated_at, updated_at
)
values
  (
    'choisir-qualite-ecran', 'ecran', 'Choisir la qualité d’un écran de remplacement',
    array['quelle qualité écran choisir','ltps prime ou soft oled','c est quoi relife','écran original ou compatible'],
    array['écran','qualité','ltps','prime','soft oled','oled','relife','origine','compatible'],
    'LTPS Prime est une solution LCD compatible, lumineuse et économique. Soft OLED apporte des noirs profonds et un confort proche de l’origine ; ReLife réutilise une dalle Apple d’origine reconditionnée avec une vitre neuve. Le meilleur choix dépend du modèle, du budget et de la disponibilité.',
    '["Quel est le modèle exact ?","Privilégiez-vous le prix ou le rendu le plus proche de l’origine ?"]'::jsonb,
    '["Présenter uniquement les qualités réellement disponibles","Faire valider le choix avant intervention"]'::jsonb,
    array['Les appellations commerciales peuvent varier selon le fournisseur ; la référence exacte est confirmée sur le devis.'],
    'solution_phone_editorial', 0.94, 'validated', 'Base métier Solution Phone', now(), now()
  ),
  (
    'reparations-prises-en-charge', 'atelier', 'Réparations prises en charge',
    array['qu est ce que vous réparez','quelles réparations faites vous','vous changez quelles pièces','tout ce que vous réparez'],
    array['réparation','pièces','écran','batterie','charge','caméra','audio','boutons','vitre arrière','réseau','carte mère'],
    'Solution Phone étudie notamment les écrans, batteries, connecteurs de charge, vitres arrière, caméras, microphones, haut-parleurs, boutons, problèmes réseau, dégâts liquides et certaines pannes de carte mère. La prise en charge exacte dépend du modèle, de la panne et des pièces disponibles.',
    '["Quel appareil souhaitez-vous faire réparer ?","Quel est le symptôme principal ?"]'::jsonb,
    '["Identifier le modèle et le symptôme","Confirmer la réparation et le devis avant intervention"]'::jsonb,
    array['Evan ne promet jamais une réparation avant contrôle lorsque la carte mère, un liquide ou la biométrie peuvent être concernés.'],
    'solution_phone_editorial', 0.94, 'validated', 'Base métier Solution Phone', now(), now()
  ),
  (
    'carte-mere-microsoudure', 'carte_mere', 'Carte mère et micro-soudure',
    array['réparez vous les cartes mères','faites vous de la microsoudure','panne carte mère téléphone','baseband iphone en panne'],
    array['carte mère','microsoudure','micro soudure','composant','baseband','court circuit','oxydation'],
    'Une panne de carte mère peut parfois être traitée en micro-soudure, mais elle exige un diagnostic physique. L’équipe confirme la faisabilité, le risque, le délai et le devis avant toute intervention ; aucun résultat ne doit être promis à distance.',
    '["Quel est le modèle exact ?","Le téléphone a-t-il subi un choc, du liquide ou une réparation récente ?"]'::jsonb,
    '["Éteindre l’appareil si possible","Préserver les données","Faire contrôler la carte mère"]'::jsonb,
    array['Ne pas multiplier les tentatives de charge si l’appareil chauffe, sent le brûlé ou a été oxydé.'],
    'solution_phone_editorial', 0.95, 'validated', 'Base métier Solution Phone', now(), now()
  ),
  (
    'service-tablette', 'tablette', 'Réparation de tablette et iPad',
    array['réparez vous les tablettes','écran ipad cassé','batterie tablette à changer','tablette ne charge plus'],
    array['tablette','ipad','galaxy tab','écran','batterie','connecteur','charge'],
    'Solution Phone peut étudier les écrans, batteries et problèmes de charge de nombreuses tablettes et iPad. Le modèle exact est indispensable : la méthode, la disponibilité des pièces et le devis varient fortement selon la référence.',
    '["Quelle est la marque et la référence exacte ?","L’image et le tactile fonctionnent-ils encore ?"]'::jsonb,
    '["Identifier la référence exacte","Contrôler l’état du châssis","Confirmer le devis avant commande"]'::jsonb,
    array['Ne pas continuer à charger une tablette déformée ou dont l’écran se soulève.'],
    'solution_phone_editorial', 0.94, 'validated', 'Base métier Solution Phone', now(), now()
  ),
  (
    'console-port-hdmi', 'console', 'Port HDMI de console',
    array['prix port hdmi ps5','console plus d image hdmi','prise hdmi xbox cassée','réparation connecteur hdmi console'],
    array['console','ps5','ps4','xbox','switch','hdmi','image','connecteur','port'],
    'Une console sans image peut avoir un câble, un réglage, un port HDMI ou un circuit vidéo défectueux. Testez un autre câble et une autre entrée ; si le port est tordu ou bouge, arrêtez les essais et faites confirmer le diagnostic et le devis par Solution Informatique.',
    '["Quel est le modèle de la console ?","Le port est-il tordu ou l’écran affiche-t-il parfois une image ?"]'::jsonb,
    '["Tester un autre câble et une autre entrée","Inspecter le port sans le forcer","Faire diagnostiquer la console"]'::jsonb,
    array['Ne pas forcer le câble dans un port HDMI abîmé.'],
    'solution_phone_editorial', 0.94, 'validated', 'Base métier Solution Phone', now(), now()
  ),
  (
    'haut-parleur-externe', 'audio', 'Haut-parleur externe faible ou muet',
    array['haut parleur téléphone ne marche plus','son très faible téléphone','pas de son en mode haut parleur','musique sans son smartphone'],
    array['haut parleur','son','audio','faible','muet','musique','sonnerie','grille'],
    'Un son faible ou étouffé vient souvent d’une grille obstruée, mais il peut aussi s’agir du haut-parleur ou d’une nappe. Comparez une sonnerie, une vidéo et un appel en mode haut-parleur ; l’équipe contrôlera la grille avant de proposer une pièce.',
    '["Le son est-il faible partout ou seulement pendant les appels ?","Le téléphone a-t-il reçu du liquide ?"]'::jsonb,
    '["Comparer plusieurs sources audio","Contrôler la grille","Remplacer uniquement après diagnostic"]'::jsonb,
    array['Ne pas injecter de liquide ni d’air comprimé puissant dans la grille.'],
    'solution_phone_editorial', 0.94, 'validated', 'Base métier Solution Phone', now(), now()
  ),
  (
    'reparer-ou-remplacer', 'conseil', 'Réparer ou remplacer l’appareil',
    array['est ce que ça vaut le coup de réparer','réparer ou changer de téléphone','téléphone trop vieux pour réparer','réparation rentable'],
    array['réparer','remplacer','changer','rentable','valeur','ancien','devis','conseil'],
    'La bonne décision dépend du coût de la réparation, de l’âge et de l’état général de l’appareil, mais aussi de l’importance de vos données. Solution Phone annonce le devis avant intervention et peut vous dire franchement si une réparation paraît peu intéressante.',
    '["Quel est le modèle et la panne ?","L’appareil répond-il encore à vos besoins ?"]'::jsonb,
    '["Comparer le devis à la valeur et à l’état de l’appareil","Tenir compte des données à récupérer","Laisser le client décider sans pression"]'::jsonb,
    array['Ne pas promettre qu’une réparation est rentable sans connaître le modèle et le diagnostic.'],
    'solution_phone_editorial', 0.95, 'validated', 'Base métier Solution Phone', now(), now()
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
  ('choisir-qualite-ecran','quelle différence entre ltps prime soft oled et relife'),
  ('choisir-qualite-ecran','je veux un écran proche de l original'),
  ('choisir-qualite-ecran','soft oled ou écran lcd pour mon iphone'),
  ('choisir-qualite-ecran','relife c est vraiment un écran apple'),
  ('choisir-qualite-ecran','quel écran choisir selon mon budget'),
  ('reparations-prises-en-charge','vous réparez quoi sur un téléphone'),
  ('reparations-prises-en-charge','est ce que vous changez les caméras et les boutons'),
  ('reparations-prises-en-charge','faites vous les vitres arrière et connecteurs'),
  ('reparations-prises-en-charge','quelles pièces de smartphone remplacez vous'),
  ('reparations-prises-en-charge','est ce que vous réparez toutes les pannes'),
  ('carte-mere-microsoudure','mon téléphone a une panne de carte mère'),
  ('carte-mere-microsoudure','faites vous la micro soudure sur iphone'),
  ('carte-mere-microsoudure','iphone sans réseau problème baseband'),
  ('carte-mere-microsoudure','téléphone oxydé réparation carte mère'),
  ('carte-mere-microsoudure','court circuit sur la carte mère du téléphone'),
  ('service-tablette','vous changez les écrans ipad'),
  ('service-tablette','batterie de tablette à remplacer'),
  ('service-tablette','ma galaxy tab ne charge plus'),
  ('service-tablette','écran tactile de tablette cassé'),
  ('service-tablette','réparez vous les ipad et tablettes samsung'),
  ('console-port-hdmi','ma ps5 ne donne plus d image'),
  ('console-port-hdmi','prix pour changer le port hdmi xbox'),
  ('console-port-hdmi','prise hdmi ps4 tordue'),
  ('console-port-hdmi','console écran noir avec câble hdmi'),
  ('console-port-hdmi','connecteur vidéo de ma console cassé'),
  ('haut-parleur-externe','le haut parleur de mon téléphone grésille'),
  ('haut-parleur-externe','je n ai plus de son sur les vidéos'),
  ('haut-parleur-externe','sonnerie très faible même au maximum'),
  ('haut-parleur-externe','pas de son en mode haut parleur'),
  ('haut-parleur-externe','grille audio téléphone bouchée'),
  ('reparer-ou-remplacer','mon téléphone est ancien est ce rentable de le réparer'),
  ('reparer-ou-remplacer','vaut il mieux réparer ou acheter un autre téléphone'),
  ('reparer-ou-remplacer','la réparation coûte elle plus cher que le téléphone'),
  ('reparer-ou-remplacer','dites moi franchement si ça vaut le coup'),
  ('reparer-ou-remplacer','je ne veux pas payer une réparation inutile')
) as training(slug, phrase) on training.slug = knowledge.slug
on conflict (knowledge_id, phrase) do nothing;
