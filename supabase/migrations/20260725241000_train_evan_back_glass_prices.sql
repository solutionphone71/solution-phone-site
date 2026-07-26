-- Tarifs métier validés par Solution Phone : remplacement des vitres arrière.

insert into public.evan_knowledge (
  slug, category, title, question_patterns, keywords, answer,
  recommended_actions, warnings, source, confidence, status, validated_by, validated_at, updated_at
)
values
  (
    'prix-vitre-arriere-iphone', 'vitre_arriere', 'Prix vitre arrière iPhone',
    array['prix vitre arrière iphone','combien coûte le dos cassé iphone','remplacement face arrière iphone'],
    array['iphone','apple','vitre arrière','face arrière','dos cassé','prix'],
    'Le remplacement de la vitre arrière d’un iPhone est proposé à partir de 40 €, pièce et main-d’œuvre incluses. Le tarif exact dépend du modèle, de la matière du dos, de l’état du châssis et des lentilles photo. Pour un prix précis, l’équipe vérifie le modèle par WhatsApp ou par e-mail.',
    '["Identifier le modèle exact","Vérifier le châssis et les lentilles","Confirmer le prix avant intervention"]'::jsonb,
    array['Il s’agit d’un tarif de départ ; ne pas annoncer 40 € comme prix fixe pour tous les modèles.'],
    'solution_phone_owner', 0.98, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'prix-vitre-arriere-android', 'vitre_arriere', 'Prix vitre arrière Samsung et Android',
    array['prix vitre arrière samsung','prix dos cassé android','remplacement face arrière xiaomi'],
    array['samsung','android','xiaomi','honor','huawei','oppo','pixel','vitre arrière','dos cassé','prix'],
    'Le remplacement de la vitre arrière d’un Samsung ou d’un autre smartphone Android est proposé à partir de 35 €, pièce et main-d’œuvre incluses. Le tarif exact dépend de la marque, du modèle, de la matière du dos, de l’état du châssis et des lentilles photo. Pour un prix précis, l’équipe vérifie la référence par WhatsApp ou par e-mail.',
    '["Identifier la marque et le modèle exacts","Vérifier le châssis et les lentilles","Confirmer le prix avant intervention"]'::jsonb,
    array['Il s’agit d’un tarif de départ ; ne pas annoncer 35 € comme prix fixe pour tous les modèles.'],
    'solution_phone_owner', 0.98, 'validated', 'Sébastien · Solution Phone', now(), now()
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
  ('prix-vitre-arriere-iphone','combien pour changer la vitre arrière de mon iphone'),
  ('prix-vitre-arriere-iphone','mon dos iphone est cassé ça coûte combien'),
  ('prix-vitre-arriere-iphone','tarif remplacement face arrière iphone'),
  ('prix-vitre-arriere-iphone','prix back glass iphone'),
  ('prix-vitre-arriere-android','vitre arrière samsung cassée prix'),
  ('prix-vitre-arriere-android','combien pour changer le dos de mon android'),
  ('prix-vitre-arriere-android','tarif face arrière xiaomi'),
  ('prix-vitre-arriere-android','prix back glass samsung galaxy')
) as training(slug, phrase) on training.slug=knowledge.slug
on conflict (knowledge_id, phrase) do nothing;
