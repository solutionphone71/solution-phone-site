insert into public.evan_knowledge (
  slug, category, title, question_patterns, keywords, answer,
  follow_up_questions, recommended_actions, warnings,
  source, confidence, status, validated_by, validated_at, updated_at
)
values (
  'console-switch-ecran-noir', 'console', 'Écran noir sur Nintendo Switch',
  array['switch écran noir mais son','nintendo switch écran reste noir','switch a du son sans image','écran interne switch noir'],
  array['nintendo','switch','écran','noir','son','affichage'],
  'Sortez la Switch du dock, débranchez ses accessoires puis maintenez POWER environ 20 secondes avant de la rallumer. Si le son revient mais que l’écran reste noir, l’afficheur, le rétroéclairage ou sa connexion doivent être diagnostiqués ; ne commandez pas un écran avant ce contrôle.',
  '["Quel modèle de Switch utilisez-vous ?","L’image apparaît-elle encore sur un téléviseur via le dock ?"]'::jsonb,
  '["Tester hors du dock","Forcer un arrêt complet","Faire diagnostiquer l’affichage"]'::jsonb,
  array['Si la console a reçu du liquide, ne la rechargez pas et ne tentez pas le redémarrage.'],
  'assistance_officielle_nintendo_et_regle_atelier', 0.96, 'validated', 'Sébastien · Solution Phone', now(), now()
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
select knowledge.id, phrase
from public.evan_knowledge as knowledge
cross join unnest(array[
  'ma switch a du son mais son écran reste noir',
  'la nintendo switch fonctionne sur le dock mais pas sur son écran',
  'écran noir switch avec bruit du menu'
]) as phrase
where knowledge.slug = 'console-switch-ecran-noir'
on conflict (knowledge_id, phrase) do nothing;
