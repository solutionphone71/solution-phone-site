-- Information métier validée : ancienneté de Solution Phone à Mâcon.

insert into public.evan_knowledge (
  slug, category, title, question_patterns, keywords, answer,
  source, confidence, status, validated_by, validated_at, updated_at
)
values (
  'histoire-solution-phone', 'boutique', 'Histoire de Solution Phone',
  array['depuis quand existe solution phone','depuis combien de temps êtes vous à mâcon','quelle est votre expérience','année de création solution phone'],
  array['depuis','2014','ancienneté','expérience','création','histoire','mâcon'],
  'Solution Phone est installé à Mâcon depuis 2014. L’équipe vous accueille au 21 rue Gambetta et assure sur place le diagnostic, la réparation et le suivi après intervention.',
  'solution_phone_owner', 0.99, 'validated', 'Sébastien · Solution Phone', now(), now()
)
on conflict (slug) do update set
  category=excluded.category,
  title=excluded.title,
  question_patterns=excluded.question_patterns,
  keywords=excluded.keywords,
  answer=excluded.answer,
  source=excluded.source,
  confidence=excluded.confidence,
  status=excluded.status,
  validated_by=excluded.validated_by,
  validated_at=excluded.validated_at,
  updated_at=excluded.updated_at;

insert into public.evan_training_phrases (knowledge_id, phrase)
select knowledge.id, training.phrase
from public.evan_knowledge as knowledge
join (values
  ('histoire-solution-phone','depuis quand existe votre magasin'),
  ('histoire-solution-phone','vous êtes à mâcon depuis quelle année'),
  ('histoire-solution-phone','combien d années d expérience avez vous'),
  ('histoire-solution-phone','solution phone existe depuis quand'),
  ('histoire-solution-phone','ça fait longtemps que vous réparez des téléphones')
) as training(slug, phrase) on training.slug=knowledge.slug
on conflict (knowledge_id, phrase) do nothing;
