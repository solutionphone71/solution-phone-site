-- Les réponses iPad et baseband sont désormais couvertes par des connaissances validées.
-- On rattache les anciennes demandes d’apprentissage afin qu’elles ne restent pas en attente.

update public.evan_learning_items as item
set
  status = 'validated',
  knowledge_id = knowledge.id,
  proposed_answer = knowledge.answer,
  category = knowledge.category,
  confidence = knowledge.confidence,
  reviewed_by = 'Base métier Solution Phone',
  reviewed_at = now(),
  updated_at = now(),
  metadata = coalesce(item.metadata, '{}'::jsonb) || jsonb_build_object('resolved_from_existing_knowledge', knowledge.slug)
from public.evan_knowledge as knowledge
where knowledge.slug = 'service-tablette'
  and item.status = 'waiting_answer'
  and lower(item.question) = 'l écran de mon ipad est brisé';

update public.evan_learning_items as item
set
  status = 'validated',
  knowledge_id = knowledge.id,
  proposed_answer = knowledge.answer,
  category = knowledge.category,
  confidence = knowledge.confidence,
  reviewed_by = 'Base métier Solution Phone',
  reviewed_at = now(),
  updated_at = now(),
  metadata = coalesce(item.metadata, '{}'::jsonb) || jsonb_build_object('resolved_from_existing_knowledge', knowledge.slug)
from public.evan_knowledge as knowledge
where knowledge.slug = 'carte-mere-microsoudure'
  and item.status = 'waiting_answer'
  and lower(item.question) = 'vous réparez un baseband iphone';
