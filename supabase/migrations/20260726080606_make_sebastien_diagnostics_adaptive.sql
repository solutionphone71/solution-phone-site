-- Les parcours simples restent courts ; les cas complexes peuvent poser les
-- questions réellement utiles, sans dépasser quatre échanges guidés.

alter table public.evan_diagnostic_flows
  drop constraint if exists evan_diagnostic_flows_max_questions_check;

alter table public.evan_diagnostic_flows
  add constraint evan_diagnostic_flows_max_questions_check
  check (max_questions between 1 and 4);

update public.evan_diagnostic_flows
set max_questions = case
  when slug in ('bootloop', 'data-recovery') then 4
  when slug in (
    'audio', 'battery-life', 'camera', 'charging', 'network', 'overheat',
    'random-restarts', 'screen-black', 'screen-visible'
  ) then 3
  when slug = 'liquid' then 2
  else max_questions
end,
updated_at = now()
where active;
