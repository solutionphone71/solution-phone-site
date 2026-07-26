create or replace view private.sebastien_performance_daily
with (security_invoker = true)
as
with days as (
  select day from private.evan_conversion_daily
  union
  select (created_at at time zone 'Europe/Paris')::date
  from private.evan_ai_usage
  union
  select (created_at at time zone 'Europe/Paris')::date
  from public.evan_knowledge_feedback
),
feedback as (
  select
    (created_at at time zone 'Europe/Paris')::date as day,
    count(*)::bigint as feedback_count,
    count(*) filter (where helpful)::bigint as helpful_count
  from public.evan_knowledge_feedback
  group by 1
),
ai as (
  select
    (created_at at time zone 'Europe/Paris')::date as day,
    count(*) filter (where status = 'success')::bigint as ai_calls,
    count(*) filter (where status = 'error')::bigint as ai_errors,
    count(*) filter (where status = 'success' and needs_human)::bigint as ai_handoffs,
    coalesce(sum(estimated_cost_usd), 0)::numeric(12, 6) as ai_cost_usd
  from private.evan_ai_usage
  group by 1
)
select
  days.day,
  coalesce(c.sessions, 0) as sessions,
  coalesce(c.answers_shown, 0) as answers_shown,
  coalesce(c.prices_shown, 0) as prices_shown,
  coalesce(c.stocks_shown, 0) as stocks_shown,
  coalesce(c.handoffs_offered, 0) as handoffs_offered,
  coalesce(c.quote_contacts, 0) as quote_contacts,
  coalesce(c.contact_rate_percent, 0) as contact_rate_percent,
  coalesce(feedback.feedback_count, 0) as feedback_count,
  coalesce(feedback.helpful_count, 0) as helpful_count,
  case
    when coalesce(feedback.feedback_count, 0) = 0 then 0
    else round(feedback.helpful_count::numeric * 100 / feedback.feedback_count, 1)
  end as helpful_rate_percent,
  coalesce(ai.ai_calls, 0) as ai_calls,
  coalesce(ai.ai_errors, 0) as ai_errors,
  coalesce(ai.ai_handoffs, 0) as ai_handoffs,
  coalesce(ai.ai_cost_usd, 0) as ai_cost_usd
from days
left join private.evan_conversion_daily c using (day)
left join feedback using (day)
left join ai using (day)
order by days.day desc;

revoke all on private.sebastien_performance_daily from public, anon, authenticated;
grant select on private.sebastien_performance_daily to service_role;

comment on view private.sebastien_performance_daily is
  'Vue privée de pilotage : conversion, qualité des réponses, recours à l IA et coût quotidien.';
