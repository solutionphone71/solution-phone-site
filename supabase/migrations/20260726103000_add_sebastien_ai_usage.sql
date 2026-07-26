create table if not exists private.evan_ai_usage (
  id bigint generated always as identity primary key,
  conversation_id uuid references public.evan_conversations(id) on delete set null,
  model text not null,
  status text not null check (status in ('success', 'refused', 'error')),
  intent text,
  needs_human boolean,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  cached_input_tokens integer not null default 0 check (cached_input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  estimated_cost_usd numeric(12, 6) not null default 0 check (estimated_cost_usd >= 0),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  created_at timestamptz not null default now()
);

create index if not exists evan_ai_usage_created_at_idx
  on private.evan_ai_usage (created_at desc);

create index if not exists evan_ai_usage_conversation_idx
  on private.evan_ai_usage (conversation_id, created_at desc);

revoke all on private.evan_ai_usage from public, anon, authenticated;
grant select, insert on private.evan_ai_usage to service_role;
grant usage, select on sequence private.evan_ai_usage_id_seq to service_role;

create or replace view private.evan_ai_usage_monthly
with (security_invoker = true)
as
select
  date_trunc('month', created_at at time zone 'Europe/Paris')::date as month,
  count(*) filter (where status = 'success')::integer as successful_calls,
  count(*) filter (where status = 'error')::integer as failed_calls,
  coalesce(sum(input_tokens), 0)::bigint as input_tokens,
  coalesce(sum(cached_input_tokens), 0)::bigint as cached_input_tokens,
  coalesce(sum(output_tokens), 0)::bigint as output_tokens,
  coalesce(sum(estimated_cost_usd), 0)::numeric(12, 4) as estimated_cost_usd
from private.evan_ai_usage
group by 1;

revoke all on private.evan_ai_usage_monthly from public, anon, authenticated;
grant select on private.evan_ai_usage_monthly to service_role;

comment on table private.evan_ai_usage is
  'Journal privé des appels IA de Sébastien, utilisé pour le plafond mensuel et le suivi des coûts.';
