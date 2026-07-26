alter table private.evan_ai_usage
  add column if not exists error_code text;

grant update on private.evan_ai_usage to service_role;

update private.evan_ai_usage
set
  status = 'error',
  error_code = 'activation_interrupted'
where status = 'reserved'
  and created_at < now() - interval '5 minutes';

comment on column private.evan_ai_usage.error_code is
  'Erreur technique courte et nettoyée, réservée au diagnostic interne.';
