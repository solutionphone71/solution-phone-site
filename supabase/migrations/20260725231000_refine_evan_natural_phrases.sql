-- Formulations naturelles révélées par le test de régression client.

insert into public.evan_training_phrases (knowledge_id, phrase)
select knowledge.id, training.phrase
from public.evan_knowledge as knowledge
join (values
  ('prix-nettoyage-virus-pc','mon pc affiche des pubs tout seul'),
  ('prix-nettoyage-virus-pc','des fenêtres de pub s ouvrent sur mon ordinateur'),
  ('prix-connecteur-charge','mon câble ne tient plus dans le port'),
  ('haut-parleur-externe','le son de mes vidéos est très faible'),
  ('service-console','ma switch surchauffe'),
  ('sans-rendez-vous','je dois prendre rendez vous')
) as training(slug, phrase) on training.slug = knowledge.slug
on conflict (knowledge_id, phrase) do nothing;
