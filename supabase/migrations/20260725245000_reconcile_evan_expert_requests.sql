-- Clôture les anciennes demandes expertes désormais couvertes par la base validée.

with mapping(question, slug) as (
  values
    ('quels sont les horaires d ouvertures', 'horaires-solution-phone'),
    ('l écran de mon ipad est brisé', 'service-tablette'),
    ('vous réparez un baseband iphone', 'carte-mere-microsoudure')
)
update public.evan_expert_requests as request
set
  expert_answer = knowledge.answer,
  status = 'answered',
  answered_at = now(),
  learned_knowledge_id = knowledge.id
from mapping
join public.evan_knowledge as knowledge on knowledge.slug = mapping.slug
where request.status = 'pending'
  and lower(request.customer_question) = mapping.question;

update public.evan_conversations as conversation
set status = 'resolved', last_message_at = now()
where conversation.id in (
  select request.conversation_id
  from public.evan_expert_requests as request
  where request.status = 'answered'
    and request.learned_knowledge_id is not null
);
