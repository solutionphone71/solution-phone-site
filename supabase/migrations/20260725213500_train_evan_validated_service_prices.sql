-- Tarifs et règles explicitement validés par Sébastien pour Evan.
-- Les estimations restent indicatives ; le modèle et le diagnostic déterminent le devis final.

insert into public.evan_knowledge (
  slug, category, title, question_patterns, keywords, answer,
  recommended_actions, warnings, source, confidence, status, validated_by, validated_at, updated_at
)
values
  (
    'prix-ecran-ordinateur', 'informatique', 'Remplacement d’écran d’ordinateur',
    array['prix écran ordinateur','combien coûte un écran de pc portable','écran ordinateur cassé tarif','changer dalle ordinateur'],
    array['ordinateur','pc','portable','mac','écran','dalle','cassé','prix','tarif'],
    'Le remplacement d’un écran d’ordinateur coûte généralement entre 100 et 170 €. Le tarif précis dépend de la marque, du modèle et de la référence de la dalle ; une photo de l’étiquette sous l’appareil permet de préparer le devis.',
    '["Demander la référence exacte de l’appareil","Vérifier la dalle avant commande","Confirmer le prix avant intervention"]'::jsonb,
    array['Ne pas forcer une charnière si l’écran se décolle ou est fissuré.'],
    'owner', 0.98, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'prix-nettoyage-virus-pc', 'informatique', 'Nettoyage de virus sur PC',
    array['prix nettoyage virus pc','ordinateur infecté tarif','enlever virus ordinateur','publicités sur mon pc'],
    array['ordinateur','pc','virus','malware','publicité','nettoyage','prix','tarif'],
    'Un nettoyage de virus sur PC coûte généralement entre 40 et 60 €. Le tarif précis dépend de l’état du système et du temps nécessaire ; ne payez aucun faux message d’alerte affiché à l’écran.',
    '["Contrôler le système avant suppression","Préserver les données du client","Confirmer le tarif selon l’état du PC"]'::jsonb,
    array['Ne pas saisir de mot de passe ou de carte bancaire après une alerte suspecte.'],
    'owner', 0.98, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'prix-disque-windows', 'informatique', 'Disque dur et réinstallation de Windows',
    array['prix changement disque dur windows','ssd et réinstallation windows tarif','ordinateur disque dur hs','remplacer disque et réinstaller windows'],
    array['ordinateur','pc','disque','ssd','windows','réinstallation','prix','tarif'],
    'Le changement du disque avec réinstallation de Windows est proposé à partir de 120 €. Le prix final dépend du disque choisi et d’une éventuelle récupération de données, contrôlée avant toute réinstallation.',
    '["Contrôler l’état du disque","Évaluer la récupération des données","Choisir la capacité avec le client"]'::jsonb,
    array['Éteindre le PC si le disque claque ou disparaît afin de limiter le risque de perte de données.'],
    'owner', 0.98, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'prix-batterie-pc-mac', 'informatique', 'Batterie de PC portable ou Mac',
    array['prix batterie pc portable','changer batterie mac tarif','batterie ordinateur ne tient plus','batterie macbook gonflée'],
    array['ordinateur','pc','portable','mac','macbook','batterie','autonomie','prix','tarif'],
    'Le remplacement d’une batterie de PC portable ou de Mac est proposé à partir de 70 €. Le modèle exact et la référence de la batterie doivent être vérifiés avant de confirmer le devis.',
    '["Identifier le modèle exact","Contrôler l’état de la batterie","Confirmer disponibilité et prix"]'::jsonb,
    array['Arrêter de charger l’appareil si le clavier ou le pavé tactile se soulève.'],
    'owner', 0.98, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'prix-batterie-android', 'batterie', 'Batterie Samsung et autres marques Android',
    array['prix batterie samsung','changer batterie android','batterie samsung compatible ou originale','tarif batterie xiaomi honor huawei'],
    array['samsung','android','xiaomi','honor','huawei','oppo','batterie','compatible','originale','prix','tarif'],
    'Pour un téléphone Android, une batterie compatible est proposée à partir de 30 € et une batterie d’origine constructeur à partir de 45 €, pièce et main-d’œuvre comprises. Le tarif précis dépend du modèle et de la disponibilité de la référence.',
    '["Demander la marque et le modèle exacts","Proposer compatible ou origine selon disponibilité","Confirmer le prix avant intervention"]'::jsonb,
    array['Ne plus recharger une batterie gonflée, déformée ou anormalement chaude.'],
    'owner', 0.98, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'prix-connecteur-charge', 'charge', 'Nettoyage ou remplacement du connecteur de charge',
    array['mon connecteur charge mal','prix connecteur de charge','câble ne tient plus téléphone','téléphone charge seulement en bougeant le câble'],
    array['téléphone','connecteur','charge','usb-c','lightning','nettoyage','remplacement','prix','tarif'],
    'Quand un téléphone charge mal, un nettoyage du connecteur à 10 € suffit dans environ 90 % des cas constatés en boutique. Si la pièce est réellement défectueuse, le remplacement commence à 25 € selon le modèle ; rien n’est remplacé avant contrôle et accord.',
    '["Tester un autre câble fiable","Contrôler et nettoyer le port","Remplacer uniquement si le nettoyage ne suffit pas"]'::jsonb,
    array['Ne jamais introduire d’objet métallique ou de liquide dans le connecteur.'],
    'owner', 0.98, 'validated', 'Sébastien · Solution Phone', now(), now()
  )
on conflict (slug) do update set
  category = excluded.category,
  title = excluded.title,
  question_patterns = excluded.question_patterns,
  keywords = excluded.keywords,
  answer = excluded.answer,
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
  ('prix-ecran-ordinateur','combien coûte le remplacement de l’écran de mon ordinateur'),
  ('prix-ecran-ordinateur','mon écran de pc portable est cassé ça coûte combien'),
  ('prix-ecran-ordinateur','prix pour changer la dalle de mon ordinateur'),
  ('prix-ecran-ordinateur','écran ordinateur noir mais il fonctionne sur un écran externe'),
  ('prix-nettoyage-virus-pc','combien pour enlever un virus de mon pc'),
  ('prix-nettoyage-virus-pc','mon ordinateur affiche plein de publicités'),
  ('prix-nettoyage-virus-pc','tarif nettoyage malware ordinateur'),
  ('prix-nettoyage-virus-pc','j’ai une fausse alerte de sécurité sur mon pc'),
  ('prix-disque-windows','prix pour changer le disque dur et remettre windows'),
  ('prix-disque-windows','mon ssd est mort il faut réinstaller windows'),
  ('prix-disque-windows','combien pour un nouveau disque avec windows'),
  ('prix-disque-windows','ordinateur très lent changement disque dur'),
  ('prix-batterie-pc-mac','combien coûte une batterie de pc portable'),
  ('prix-batterie-pc-mac','prix remplacement batterie macbook'),
  ('prix-batterie-pc-mac','mon ordinateur ne tient plus la charge'),
  ('prix-batterie-pc-mac','le pavé tactile se soulève batterie mac'),
  ('prix-batterie-android','combien coûte une batterie samsung'),
  ('prix-batterie-android','prix batterie compatible android'),
  ('prix-batterie-android','je veux une batterie samsung originale'),
  ('prix-batterie-android','tarif changement batterie xiaomi'),
  ('prix-connecteur-charge','mon téléphone charge seulement si je bouge le câble'),
  ('prix-connecteur-charge','le câble ne rentre plus complètement dans mon téléphone'),
  ('prix-connecteur-charge','combien coûte un nettoyage du connecteur'),
  ('prix-connecteur-charge','prix remplacement port usb c téléphone'),
  ('prix-connecteur-charge','mon iphone charge mal connecteur sale')
) as training(slug, phrase) on training.slug = knowledge.slug
on conflict (knowledge_id, phrase) do nothing;
