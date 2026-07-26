-- Réponses plus directes pour l’assistant de Sébastien : QualiRépar et transferts.
update public.evan_knowledge
set
  question_patterns = array[
    'c est quoi qualirepar',
    'comment fonctionne qualirepar',
    'comment avoir les 25 euros',
    'comment marche la remise de 25 euros',
    'le bonus est il deduit',
    'faut il faire une demarche'
  ],
  keywords = array['qualirepar','quali repar','25 euros','25 eur','bonus','remise','deduction','aide reparation'],
  updated_at = now()
where slug = 'bonus-qualirepar';

update public.evan_knowledge
set
  answer = 'Le transfert standard entre deux smartphones coûte 30 €. Il peut inclure les photos, contacts et WhatsApp lorsque les appareils et les comptes sont compatibles ; l’équipe vérifie la faisabilité avant de commencer.',
  updated_at = now()
where slug = 'services-transfert-sauvegarde';
