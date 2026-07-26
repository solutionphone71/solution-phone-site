create or replace function public.evan_reserve_ai_call(
  p_conversation_id uuid,
  p_model text,
  p_monthly_limit integer
)
returns bigint
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_count integer;
  v_id bigint;
  v_month_start timestamptz;
begin
  if greatest(coalesce(p_monthly_limit, 0), 0) = 0 then
    return null;
  end if;

  perform pg_advisory_xact_lock(hashtext('sebastien-ai-monthly-budget'));
  v_month_start := date_trunc('month', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris';

  select count(*)::integer
  into v_count
  from private.evan_ai_usage
  where created_at >= v_month_start
    and status in ('reserved', 'success', 'error');

  if v_count >= p_monthly_limit then
    return null;
  end if;

  insert into private.evan_ai_usage (conversation_id, model, status)
  values (
    p_conversation_id,
    left(coalesce(nullif(trim(p_model), ''), 'gpt-5-mini'), 80),
    'reserved'
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.evan_reserve_ai_call(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.evan_reserve_ai_call(uuid, text, integer) to service_role;
