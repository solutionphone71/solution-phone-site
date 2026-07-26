-- Keep the learning queue consistent with expert-request decisions and expose
-- an internal, measurable "Sims-like" progression profile for Sebastien.

create or replace function private.sync_dismissed_expert_learning()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'dismissed' and old.status is distinct from new.status then
    update public.evan_learning_items
    set
      status = 'rejected',
      reviewed_by = 'Relais expert écarté',
      reviewed_at = coalesce(reviewed_at, now()),
      updated_at = now(),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'dismissed_from_expert', true,
        'dismissed_at', now()
      )
    where source_type = 'customer'
      and source_reference = new.reference
      and status = 'waiting_answer';
  end if;

  return new;
end;
$$;

revoke all on function private.sync_dismissed_expert_learning() from public, anon, authenticated;
grant execute on function private.sync_dismissed_expert_learning() to service_role;

drop trigger if exists sync_dismissed_expert_learning on public.evan_expert_requests;

create trigger sync_dismissed_expert_learning
after update of status on public.evan_expert_requests
for each row
execute function private.sync_dismissed_expert_learning();

-- Reconcile historical test requests that had already been dismissed.
update public.evan_learning_items as learning
set
  status = 'rejected',
  reviewed_by = 'Relais expert écarté',
  reviewed_at = coalesce(learning.reviewed_at, now()),
  updated_at = now(),
  metadata = coalesce(learning.metadata, '{}'::jsonb) || jsonb_build_object(
    'dismissed_from_expert', true,
    'dismissed_at', now()
  )
from public.evan_expert_requests as expert
where learning.source_type = 'customer'
  and learning.source_reference = expert.reference
  and learning.status = 'waiting_answer'
  and expert.status = 'dismissed';

create or replace view private.sebastien_skill_progress
with (security_invoker = true)
as
with skill_catalog(skill, label, display_order) as (
  values
    ('smartphone'::text, 'Réparation smartphone'::text, 1),
    ('tablette'::text, 'Tablettes'::text, 2),
    ('informatique'::text, 'Informatique'::text, 3),
    ('console'::text, 'Consoles'::text, 4),
    ('trottinette'::text, 'Trottinettes'::text, 5),
    ('service_client'::text, 'Service client et boutiques'::text, 6),
    ('securite'::text, 'Sécurité et urgences'::text, 7),
    ('commerce'::text, 'Conseil et vente'::text, 8)
),
category_map(skill, category) as (
  values
    ('smartphone'::text, 'alimentation'::text),
    ('smartphone', 'atelier'),
    ('smartphone', 'audio'),
    ('smartphone', 'batterie'),
    ('smartphone', 'biometrie'),
    ('smartphone', 'camera'),
    ('smartphone', 'capteurs'),
    ('smartphone', 'carte_mere'),
    ('smartphone', 'charge'),
    ('smartphone', 'chassis'),
    ('smartphone', 'commande'),
    ('smartphone', 'connectique'),
    ('smartphone', 'connectivite'),
    ('smartphone', 'donnees'),
    ('smartphone', 'ecran'),
    ('smartphone', 'logiciel'),
    ('smartphone', 'reseau'),
    ('smartphone', 'temperature'),
    ('smartphone', 'transfert_donnees'),
    ('smartphone', 'vitre_arriere'),
    ('tablette', 'tablette'),
    ('informatique', 'informatique'),
    ('console', 'console'),
    ('trottinette', 'mobilite'),
    ('service_client', 'administratif'),
    ('service_client', 'boutique'),
    ('service_client', 'boutiques'),
    ('service_client', 'devis'),
    ('service_client', 'identite'),
    ('service_client', 'service'),
    ('securite', 'securite'),
    ('securite', 'securite_mobile'),
    ('securite', 'urgence'),
    ('commerce', 'accessoires'),
    ('commerce', 'conseil'),
    ('commerce', 'vente')
),
knowledge_stats as (
  select
    mapping.skill,
    count(*)::integer as validated_knowledge,
    coalesce(sum(knowledge.usage_count), 0)::integer as uses,
    coalesce(sum(knowledge.helpful_count), 0)::integer as helpful,
    coalesce(sum(knowledge.not_helpful_count), 0)::integer as not_helpful
  from category_map as mapping
  join public.evan_knowledge as knowledge
    on knowledge.category = mapping.category
   and knowledge.status = 'validated'
  group by mapping.skill
),
phrase_stats as (
  select
    mapping.skill,
    count(phrase.id)::integer as training_phrases
  from category_map as mapping
  join public.evan_knowledge as knowledge
    on knowledge.category = mapping.category
   and knowledge.status = 'validated'
  left join public.evan_training_phrases as phrase
    on phrase.knowledge_id = knowledge.id
  group by mapping.skill
),
scored as (
  select
    catalog.skill,
    catalog.label,
    catalog.display_order,
    coalesce(knowledge.validated_knowledge, 0) as validated_knowledge,
    coalesce(phrases.training_phrases, 0) as training_phrases,
    coalesce(knowledge.uses, 0) as uses,
    coalesce(knowledge.helpful, 0) as helpful,
    coalesce(knowledge.not_helpful, 0) as not_helpful,
    greatest(
      0,
      coalesce(knowledge.validated_knowledge, 0) * 100
        + coalesce(phrases.training_phrases, 0) * 5
        + coalesce(knowledge.helpful, 0) * 20
        - coalesce(knowledge.not_helpful, 0) * 30
    )::integer as xp
  from skill_catalog as catalog
  left join knowledge_stats as knowledge using (skill)
  left join phrase_stats as phrases using (skill)
),
levelled as (
  select
    scored.*,
    least(10, greatest(1, 1 + floor(scored.xp / 1000.0)::integer)) as level
  from scored
)
select
  skill,
  label,
  level,
  case level
    when 1 then 'Débutant'
    when 2 then 'Apprenti'
    when 3 then 'Conseiller'
    when 4 then 'Technicien'
    when 5 then 'Technicien confirmé'
    when 6 then 'Spécialiste'
    when 7 then 'Expert'
    when 8 then 'Expert senior'
    when 9 then 'Maître technicien'
    else 'Encyclopédie Solution Phone'
  end as rank,
  xp,
  case when level = 10 then 0 else level * 1000 - xp end as xp_to_next_level,
  validated_knowledge,
  training_phrases,
  uses,
  helpful,
  not_helpful
from levelled
order by display_order;

revoke all on private.sebastien_skill_progress from public, anon, authenticated;
grant select on private.sebastien_skill_progress to service_role;

comment on view private.sebastien_skill_progress is
  'Progression interne de Sebastien par compétence. Seules les connaissances validées et les évaluations clients influencent les niveaux.';
