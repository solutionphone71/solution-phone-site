-- Retire l’ancien nom public « Evan » des réponses métier.

update public.evan_knowledge
set answer = replace(answer, 'Evan', 'L’assistant de Sébastien'),
    updated_at = now()
where answer like '%Evan%'
  and slug <> 'identite-evan';

update public.evan_knowledge
set answer = replace(answer, ': L’assistant de Sébastien', ': l’assistant de Sébastien'),
    updated_at = now()
where answer like '%: L’assistant de Sébastien%';

update public.evan_knowledge
set title = 'Qui est l’assistant de Sébastien ?',
    question_patterns = array[
      'qui est l assistant de sébastien',
      'qui répond sur le site',
      'est ce une vraie personne',
      'comment fonctionne l assistant'
    ],
    keywords = array['assistant','sébastien','solution phone','tarif','équipe','numérique'],
    answer = 'Je suis l’assistant numérique de Sébastien et de l’équipe Solution Phone. Je peux rechercher les tarifs validés, consulter le stock réel et répondre aux questions apprises auprès de l’atelier. Si une réponse nécessite un contrôle, je le dis clairement et je prépare une demande précise pour WhatsApp ou e-mail.',
    updated_at = now()
where slug = 'identite-evan';

insert into public.evan_training_phrases (knowledge_id, phrase)
select id, phrase
from public.evan_knowledge
cross join (values
  ('qui est l assistant de sébastien'),
  ('est ce que je parle à sébastien'),
  ('qui répond à mes questions sur le site'),
  ('comment fonctionne votre assistant numérique')
) as training(phrase)
where slug = 'identite-evan'
on conflict (knowledge_id, phrase) do nothing;
