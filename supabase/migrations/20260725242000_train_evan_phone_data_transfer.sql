-- Tarif métier validé : récupération et transfert depuis un smartphone cassé.

insert into public.evan_knowledge (
  slug, category, title, question_patterns, keywords, answer,
  recommended_actions, warnings, source, confidence, status, validated_by, validated_at, updated_at
)
values (
  'prix-transfert-smartphone-casse', 'transfert_donnees', 'Récupération et transfert depuis un smartphone cassé',
  array['récupérer données téléphone cassé','transférer ancien téléphone vers nouveau','prix transfert smartphone','récupération photos téléphone cassé'],
  array['smartphone cassé','récupération','données','transfert','nouveau téléphone','photos','contacts','whatsapp','prix'],
  'La récupération des données d’un smartphone cassé et leur transfert vers un nouveau smartphone sont proposés à partir de 30 €. La faisabilité et le prix exact dépendent de l’état de l’ancien appareil, de son accessibilité, de la quantité de données et de la compatibilité du nouvel appareil. L’équipe confirme tout avant intervention.',
  '["Contrôler si l’ancien appareil reste accessible","Identifier les données prioritaires","Vérifier la compatibilité du nouveau smartphone","Confirmer le prix avant intervention"]'::jsonb,
  array['Ne jamais garantir la récupération avant contrôle de l’ancien appareil.','Aucun effacement ni transfert sans l’accord du client.'],
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

insert into public.evan_knowledge (
  slug, category, title, question_patterns, keywords, answer,
  recommended_actions, warnings, source, confidence, status, validated_by, validated_at, updated_at
)
values (
  'services-transfert-sauvegarde', 'transfert_donnees', 'Services de transfert et sauvegarde mobile',
  array['quels transferts faites vous','transfert whatsapp nouveau téléphone','sauvegarde photos clé usb','copier contacts et photos'],
  array['transfert','sauvegarde','whatsapp','photos','contacts','clé usb','nouveau smartphone'],
  'Solution Phone réalise plusieurs services autour des données : transfert entre deux smartphones, transfert de WhatsApp lorsque les appareils et les comptes le permettent, copie des photos et contacts, configuration d’un nouveau téléphone et sauvegarde de photos sur clé USB. Le transfert standard de données entre smartphones est facturé 30 €. Les autres demandes sont confirmées selon le volume, les appareils et le support choisi.',
  '["Identifier les deux appareils ou le support de destination","Demander les données prioritaires","Vérifier les accès et la compatibilité","Confirmer le tarif avant intervention"]'::jsonb,
  array['WhatsApp et certaines applications imposent leurs propres règles de sauvegarde et de compatibilité.','Aucune donnée ne doit être effacée ou copiée sans accord explicite.'],
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
  ('prix-transfert-smartphone-casse','mon téléphone est cassé je veux récupérer mes données'),
  ('prix-transfert-smartphone-casse','je veux transférer mes photos sur mon nouveau téléphone'),
  ('prix-transfert-smartphone-casse','combien coûte le transfert vers un nouveau smartphone'),
  ('prix-transfert-smartphone-casse','récupérer contacts et whatsapp ancien téléphone cassé'),
  ('prix-transfert-smartphone-casse','migration complète iphone vers samsung'),
  ('prix-transfert-smartphone-casse','copier les données de mon ancien android'),
  ('services-transfert-sauvegarde','est ce que vous transférez whatsapp sur un nouveau téléphone'),
  ('services-transfert-sauvegarde','je veux sauvegarder mes photos sur une clé usb'),
  ('services-transfert-sauvegarde','transfert de contacts et photos entre deux smartphones'),
  ('services-transfert-sauvegarde','vous pouvez configurer mon nouveau téléphone'),
  ('services-transfert-sauvegarde','quels services faites vous pour mes données')
) as training(slug, phrase) on training.slug=knowledge.slug
on conflict (knowledge_id, phrase) do nothing;
