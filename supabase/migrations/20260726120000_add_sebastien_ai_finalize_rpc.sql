create or replace function public.evan_finalize_ai_usage(
  p_usage_id bigint,
  p_status text,
  p_intent text,
  p_needs_human boolean,
  p_input_tokens integer,
  p_cached_input_tokens integer,
  p_output_tokens integer,
  p_estimated_cost_usd numeric,
  p_latency_ms integer,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if p_status not in ('success', 'error', 'refused') then
    raise exception 'Invalid AI usage status';
  end if;

  update private.evan_ai_usage
  set
    status = p_status,
    intent = left(nullif(trim(p_intent), ''), 80),
    needs_human = p_needs_human,
    input_tokens = greatest(coalesce(p_input_tokens, 0), 0),
    cached_input_tokens = greatest(coalesce(p_cached_input_tokens, 0), 0),
    output_tokens = greatest(coalesce(p_output_tokens, 0), 0),
    estimated_cost_usd = greatest(coalesce(p_estimated_cost_usd, 0), 0),
    latency_ms = greatest(coalesce(p_latency_ms, 0), 0),
    error_code = left(nullif(trim(p_error_code), ''), 240)
  where id = p_usage_id
    and status = 'reserved';

  return found;
end;
$$;

revoke all on function public.evan_finalize_ai_usage(bigint, text, text, boolean, integer, integer, integer, numeric, integer, text)
  from public, anon, authenticated;
grant execute on function public.evan_finalize_ai_usage(bigint, text, text, boolean, integer, integer, integer, numeric, integer, text)
  to service_role;

comment on function public.evan_finalize_ai_usage(bigint, text, text, boolean, integer, integer, integer, numeric, integer, text) is
  'Finalise côté serveur un appel IA précédemment réservé.';
