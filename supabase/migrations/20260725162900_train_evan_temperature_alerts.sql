insert into public.evan_training_phrases (knowledge_id, phrase)
select knowledge.id, training.phrase
from public.evan_knowledge as knowledge
cross join (
  values
    ('mon iphone affiche température trop élevée'),
    ('alerte température iphone'),
    ('iphone doit refroidir avant utilisation'),
    ('mon téléphone affiche une alerte de température')
) as training(phrase)
where knowledge.slug = 'telephone-chauffe'
on conflict (knowledge_id, phrase) do nothing;
