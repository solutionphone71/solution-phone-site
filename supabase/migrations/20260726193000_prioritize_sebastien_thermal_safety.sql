-- Place la consigne de sécurité en tête pour qu'elle reste visible même dans une réponse courte.

update public.evan_knowledge
set
  answer = 'Si l’appareil devient brûlant, sent anormalement, fume ou se déforme, débranchez-le et ne le rechargez plus. Éteignez-le si cela peut se faire sans pression ni manipulation risquée, éloignez-le des matières inflammables et apportez-le rapidement à l’atelier.',
  question_patterns = array[
    'mon téléphone sent le brûlé',
    'mon smartphone est brûlant',
    'il y a une odeur anormale pendant la charge',
    'mon téléphone fume',
    'le téléphone chauffe très fort pendant la charge'
  ],
  keywords = array['chauffe','brûlant','odeur','brûlé','fumée','charge','sécurité'],
  updated_at = now(),
  validated_at = now(),
  validated_by = 'Sébastien · Solution Phone'
where slug = 'chauffe-pendant-charge'
  and status = 'validated';

insert into public.evan_training_phrases (knowledge_id, phrase)
select knowledge.id, training.phrase
from public.evan_knowledge as knowledge
join (values
  ('chauffe-pendant-charge','mon iphone chauffe et sent le brûlé'),
  ('chauffe-pendant-charge','une odeur de brûlé sort du téléphone'),
  ('chauffe-pendant-charge','mon smartphone fume pendant la charge'),
  ('chauffe-pendant-charge','le téléphone est brûlant au toucher')
) as training(slug, phrase) on training.slug = knowledge.slug
where knowledge.status = 'validated'
on conflict (knowledge_id, phrase) do nothing;
