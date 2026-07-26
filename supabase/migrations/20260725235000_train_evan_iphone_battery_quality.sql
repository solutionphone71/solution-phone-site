-- Explication des gammes de batteries iPhone affichées dans la base tarifaire.

insert into public.evan_knowledge (
  slug, category, title, question_patterns, keywords, answer,
  recommended_actions, warnings, source, confidence, status, validated_by, validated_at, updated_at
)
values (
  'choisir-qualite-batterie-iphone', 'batterie', 'Choisir la qualité d’une batterie iPhone',
  array['batterie compatible ti ou originale','c est quoi batterie ti reconnue','quelle batterie iphone choisir','différence batterie iphone'],
  array['iphone','batterie','compatible','ti','reconnue','originale','qualité'],
  'La batterie Compatible est l’option économique. Chez Solution Phone, TI reconnue désigne la gamme compatible sélectionnée pour être reconnue par le téléphone sur les modèles concernés ; Originale correspond à une pièce d’origine lorsqu’elle est disponible. L’équipe confirme la compatibilité et l’affichage de l’état de santé avant l’intervention.',
  '["Vérifier le modèle exact","Présenter uniquement les gammes disponibles","Confirmer le prix et la reconnaissance avant intervention"]'::jsonb,
  array['La disponibilité et les fonctions affichées par iOS dépendent du modèle, de la pièce et de la méthode d’installation.'],
  'solution_phone_editorial', 0.94, 'validated', 'Base métier Solution Phone', now(), now()
)
on conflict (slug) do update set
  category=excluded.category,
  title=excluded.title,
  question_patterns=excluded.question_patterns,
  keywords=excluded.keywords,
  answer=excluded.answer,
  recommended_actions=excluded.recommended_actions,
  warnings=excluded.warnings,
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
  ('choisir-qualite-batterie-iphone','quelle différence entre compatible ti reconnue et originale'),
  ('choisir-qualite-batterie-iphone','c est quoi une batterie ti pour iphone'),
  ('choisir-qualite-batterie-iphone','est ce que l iphone reconnaît la nouvelle batterie'),
  ('choisir-qualite-batterie-iphone','je veux une batterie iphone originale'),
  ('choisir-qualite-batterie-iphone','quelle qualité de batterie choisir pour mon iphone'),
  ('choisir-qualite-batterie-iphone','pourquoi il y a trois prix de batterie iphone')
) as training(slug, phrase) on training.slug=knowledge.slug
on conflict (knowledge_id, phrase) do nothing;
