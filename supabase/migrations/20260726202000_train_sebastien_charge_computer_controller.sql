insert into public.evan_knowledge (
  slug, category, title, question_patterns, keywords, answer,
  follow_up_questions, recommended_actions, warnings,
  source, confidence, status, validated_by, validated_at, updated_at
)
values
  (
    'ordinateur-charge', 'informatique', 'Ordinateur qui ne charge plus',
    array['ordinateur ne charge plus','pc ne prend plus la charge','chargeur ordinateur non détecté','prise de charge pc cassée'],
    array['ordinateur','pc','macbook','charge','chargeur','prise','connecteur','usb-c'],
    'Une absence de charge peut venir du chargeur, de la prise, du connecteur USB-C, de la batterie ou du circuit d’alimentation. Testez uniquement un chargeur compatible et notez si son voyant change ; le modèle exact est nécessaire avant d’annoncer une pièce ou un prix.',
    '["Quel est le modèle exact ?","Un autre chargeur compatible a-t-il été testé ?"]'::jsonb,
    '["Contrôler le chargeur adapté","Inspecter le connecteur sans le forcer","Diagnostiquer avant remplacement"]'::jsonb,
    array['Débranchez l’ordinateur si la prise, le câble ou la batterie chauffe ou sent anormalement.'],
    'support_fabricants_et_regle_atelier', 0.96, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'console-manette-charge', 'console', 'Manette qui ne charge plus',
    array['manette ne charge plus','batterie manette ne tient plus','dualsense se décharge vite','joy con ne recharge pas'],
    array['console','manette','dualsense','dualshock','joy-con','charge','batterie','autonomie'],
    'Testez un autre câble et un port adapté, puis vérifiez si la manette fonctionne lorsqu’elle reste branchée. La panne peut venir du câble, du connecteur ou de la batterie ; indiquez la console et le modèle de manette pour confirmer la réparation et le devis.',
    '["Quelle console et quelle manette ?","Fonctionne-t-elle encore lorsqu’elle reste branchée ?"]'::jsonb,
    '["Tester un câble fiable","Identifier la manette","Confirmer connecteur ou batterie après contrôle"]'::jsonb,
    array['Ne rechargez plus une manette gonflée, très chaude ou ayant reçu du liquide.'],
    'support_fabricants_et_regle_atelier', 0.95, 'validated', 'Sébastien · Solution Phone', now(), now()
  )
on conflict (slug) do update set
  category = excluded.category,
  title = excluded.title,
  question_patterns = excluded.question_patterns,
  keywords = excluded.keywords,
  answer = excluded.answer,
  follow_up_questions = excluded.follow_up_questions,
  recommended_actions = excluded.recommended_actions,
  warnings = excluded.warnings,
  source = excluded.source,
  confidence = excluded.confidence,
  status = excluded.status,
  validated_by = excluded.validated_by,
  validated_at = excluded.validated_at,
  updated_at = excluded.updated_at;

insert into public.evan_training_phrases (knowledge_id, phrase)
select knowledge.id, training.phrase
from public.evan_knowledge as knowledge
join (values
  ('ordinateur-charge','mon ordi portable ne prend plus la charge'),
  ('ordinateur-charge','est ce le chargeur ou la prise de mon pc'),
  ('ordinateur-charge','mon macbook ne détecte plus le chargeur'),
  ('console-manette-charge','ma manette ne charge plus'),
  ('console-manette-charge','la batterie de la dualsense ne tient que quelques minutes'),
  ('console-manette-charge','mon joy con ne se recharge pas')
) as training(slug, phrase) on training.slug = knowledge.slug
on conflict (knowledge_id, phrase) do nothing;
