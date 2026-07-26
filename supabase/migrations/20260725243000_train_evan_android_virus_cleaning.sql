-- Tarif métier validé : nettoyage virus et applications indésirables sur Android.

insert into public.evan_knowledge (
  slug, category, title, question_patterns, keywords, answer,
  recommended_actions, warnings, source, confidence, status, validated_by, validated_at, updated_at
)
values (
  'prix-nettoyage-virus-android', 'securite_mobile', 'Nettoyage virus Android',
  array['nettoyage virus android prix','publicités partout sur téléphone','smartphone android infecté','applications qui s ouvrent seules'],
  array['android','virus','malware','publicités','pop-up','application indésirable','nettoyage','10 euros'],
  'Le contrôle et le nettoyage des virus ou applications indésirables sur un smartphone Android sont facturés 10 €. Solution Phone privilégie le nettoyage avant toute réinitialisation afin de préserver les données. Évitez de saisir vos mots de passe ou de payer un message d’alerte avant le contrôle.',
  '["Identifier les symptômes","Contrôler les applications installées","Nettoyer avant d’envisager une réinitialisation","Vérifier le fonctionnement après nettoyage"]'::jsonb,
  array['Ne jamais demander au client de payer une alerte affichée sur le téléphone.','Aucun effacement sans l’accord du client.'],
  'solution_phone_owner', 0.99, 'validated', 'Sébastien · Solution Phone', now(), now()
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
  ('prix-nettoyage-virus-android','j ai des pubs partout sur mon samsung'),
  ('prix-nettoyage-virus-android','mon android ouvre des applications tout seul'),
  ('prix-nettoyage-virus-android','combien coûte un nettoyage virus téléphone'),
  ('prix-nettoyage-virus-android','mon xiaomi est infecté par un malware'),
  ('prix-nettoyage-virus-android','supprimer les pop ups sur mon smartphone'),
  ('prix-nettoyage-virus-android','nettoyage antivirus android prix')
) as training(slug, phrase) on training.slug=knowledge.slug
on conflict (knowledge_id, phrase) do nothing;
