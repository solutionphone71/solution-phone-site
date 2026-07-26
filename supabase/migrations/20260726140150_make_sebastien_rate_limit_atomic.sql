create or replace function public.evan_consume_rate_limit(
  p_key_hash text,
  p_window_started_at timestamptz,
  p_request_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_count integer;
begin
  if p_key_hash !~ '^[0-9a-f]{64}$'
    or p_window_started_at is null
    or p_request_limit is null
    or p_request_limit < 1
    or p_request_limit > 1000 then
    return false;
  end if;

  insert into public.evan_rate_limits (key_hash, window_started_at, request_count)
  values (p_key_hash, p_window_started_at, 1)
  on conflict (key_hash, window_started_at)
  do update set request_count = public.evan_rate_limits.request_count + 1
  returning request_count into current_count;

  if random() < 0.02 then
    delete from public.evan_rate_limits
    where window_started_at < now() - interval '2 days';
  end if;

  return current_count <= p_request_limit;
end;
$$;

revoke all on function public.evan_consume_rate_limit(text, timestamptz, integer)
  from public, anon, authenticated;
grant execute on function public.evan_consume_rate_limit(text, timestamptz, integer)
  to service_role;

comment on function public.evan_consume_rate_limit(text, timestamptz, integer) is
  'Compte atomiquement les requêtes de Sébastien et refuse celles au-delà de la limite.';
