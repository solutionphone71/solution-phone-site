insert into public.evan_knowledge (
  slug, category, title, question_patterns, keywords, answer,
  follow_up_questions, recommended_actions, warnings,
  source, confidence, status, validated_by, validated_at, updated_at
)
values
  (
    'tablette-stockage-logiciel', 'tablette', 'Stockage plein ou logiciel de tablette',
    array['ipad stockage plein','tablette manque de place','mise à jour ipad impossible stockage','galaxy tab mémoire saturée'],
    array['tablette','ipad','galaxy tab','stockage','mémoire','plein','mise à jour','applications'],
    'Commencez par vérifier l’espace utilisé sans supprimer au hasard : photos, vidéos, téléchargements ou applications peuvent occuper la mémoire. L’équipe peut sauvegarder puis libérer de la place ou traiter une mise à jour bloquée, sans effacement sans votre accord.',
    '["Quel est le modèle exact ?","Souhaitez-vous surtout conserver les photos, libérer de la place ou installer une mise à jour ?"]'::jsonb,
    '["Identifier les données volumineuses","Sauvegarder avant nettoyage","Ne supprimer qu’avec accord"]'::jsonb,
    array['Une réinitialisation complète peut effacer les données et ne doit pas être la première étape.'],
    'assistance_officielle_apple_samsung_et_regle_donnees', 0.97, 'validated', 'Sébastien · Solution Phone', now(), now()
  ),
  (
    'tablette-transfert-donnees', 'tablette', 'Transfert de données entre tablettes',
    array['transférer photos ancienne tablette','passer données ipad vers nouvel ipad','copier galaxy tab vers nouvelle tablette','migration tablette'],
    array['tablette','ipad','galaxy tab','transfert','migration','photos','données','nouvelle'],
    'Solution Phone peut transférer les photos, contacts et données compatibles vers une nouvelle tablette, à partir de 30 €. Apportez les deux appareils, leurs codes et les comptes associés ; aucune donnée n’est effacée sans votre accord.',
    '["Quels sont les deux modèles ?","Les deux tablettes s’allument-elles et disposez-vous des codes et comptes ?"]'::jsonb,
    '["Vérifier les deux appareils","Contrôler les comptes et sauvegardes","Transférer après accord"]'::jsonb,
    array['Certaines applications ou données chiffrées ne sont transférables qu’avec le compte et le code d’origine.'],
    'tarif_valide_solution_phone_et_regle_donnees', 0.98, 'validated', 'Sébastien · Solution Phone', now(), now()
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
  ('tablette-stockage-logiciel','mon ipad est plein et ne se met plus à jour'),
  ('tablette-stockage-logiciel','comment libérer de la place sur ma tablette'),
  ('tablette-stockage-logiciel','la mémoire de ma galaxy tab est saturée'),
  ('tablette-transfert-donnees','transférer les photos de mon ancienne tablette'),
  ('tablette-transfert-donnees','passer mes données sur mon nouvel ipad'),
  ('tablette-transfert-donnees','copier ma galaxy tab vers la nouvelle')
) as training(slug, phrase) on training.slug = knowledge.slug
on conflict (knowledge_id, phrase) do nothing;
