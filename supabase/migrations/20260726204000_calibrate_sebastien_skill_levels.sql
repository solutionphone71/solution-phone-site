-- A large number of alternative phrasings must not be enough to award the
-- highest expertise rank. Keep the raw score, but use progressive thresholds.

alter view private.sebastien_skill_progress
rename to sebastien_skill_progress_raw;

revoke all on private.sebastien_skill_progress_raw from public, anon, authenticated;
grant select on private.sebastien_skill_progress_raw to service_role;

create view private.sebastien_skill_progress
with (security_invoker = true)
as
with calibrated as (
  select
    raw.*,
    case
      when raw.xp >= 45000 then 10
      when raw.xp >= 30000 then 9
      when raw.xp >= 20000 then 8
      when raw.xp >= 14000 then 7
      when raw.xp >= 10000 then 6
      when raw.xp >= 7000 then 5
      when raw.xp >= 4500 then 4
      when raw.xp >= 2500 then 3
      when raw.xp >= 1000 then 2
      else 1
    end as calibrated_level
  from private.sebastien_skill_progress_raw as raw
)
select
  skill,
  label,
  calibrated_level as level,
  case calibrated_level
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
  case calibrated_level
    when 1 then 1000 - xp
    when 2 then 2500 - xp
    when 3 then 4500 - xp
    when 4 then 7000 - xp
    when 5 then 10000 - xp
    when 6 then 14000 - xp
    when 7 then 20000 - xp
    when 8 then 30000 - xp
    when 9 then 45000 - xp
    else 0
  end as xp_to_next_level,
  validated_knowledge,
  training_phrases,
  uses,
  helpful,
  not_helpful
from calibrated;

revoke all on private.sebastien_skill_progress from public, anon, authenticated;
grant select on private.sebastien_skill_progress to service_role;

comment on view private.sebastien_skill_progress is
  'Progression interne calibrée de Sebastien. Le rang Encyclopédie exige 45 000 XP issus de connaissances validées, de formulations entraînées et de retours clients.';
