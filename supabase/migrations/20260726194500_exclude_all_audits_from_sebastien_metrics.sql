-- Écarte tous les scénarios automatisés afin de mesurer uniquement les visiteurs réels.

create or replace view private.evan_conversion_daily
with (security_invoker = true)
as
with eligible_conversations as (
  select conversation.id
  from public.evan_conversations conversation
  where not (
    coalesce(conversation.metadata ->> 'page', '') = 'automated-eval'
    or coalesce(conversation.metadata ->> 'page', '') = 'routing-regression'
    or coalesce(conversation.metadata ->> 'page', '') like 'activation-ai-%'
    or coalesce(conversation.metadata ->> 'page', '') like 'test:%'
    or coalesce(conversation.metadata ->> 'page', '') like '/test%'
    or coalesce(conversation.metadata ->> 'page', '') like '%audit%'
    or coalesce(conversation.metadata ->> 'page', '') like 'codex-%'
  )
),
sessions as (
  select
    timezone('Europe/Paris', event.created_at)::date as day,
    event.conversation_id,
    bool_or(event.event_type = 'assistant_opened') as opened,
    bool_or(event.event_type = 'answer_shown') as answered,
    bool_or(event.event_type = 'price_shown') as price_shown,
    bool_or(event.event_type = 'stock_shown') as stock_shown,
    bool_or(event.event_type = 'handoff_offered') as handoff_offered,
    bool_or(event.event_type = 'whatsapp_clicked') as whatsapp_clicked,
    bool_or(event.event_type = 'email_clicked') as email_submitted
  from public.evan_events event
  join eligible_conversations conversation on conversation.id = event.conversation_id
  group by 1, 2
)
select
  day,
  count(*) as sessions,
  count(*) filter (where opened) as assistant_opened,
  count(*) filter (where answered) as answers_shown,
  count(*) filter (where price_shown) as prices_shown,
  count(*) filter (where stock_shown) as stocks_shown,
  count(*) filter (where handoff_offered) as handoffs_offered,
  count(*) filter (where whatsapp_clicked) as whatsapp_clicks,
  count(*) filter (where email_submitted) as email_clicks,
  count(*) filter (where whatsapp_clicked or email_submitted) as quote_contacts,
  round(100.0 * count(*) filter (where whatsapp_clicked or email_submitted) / nullif(count(*), 0), 1) as contact_rate_percent
from sessions
group by day;

revoke all on private.evan_conversion_daily from public, anon, authenticated;
grant select on private.evan_conversion_daily to service_role;

comment on view private.evan_conversion_daily is
  'Mesure quotidienne des visiteurs réels : tests, audits et scénarios Codex exclus.';

create or replace view private.sebastien_performance_daily
with (security_invoker = true)
as
with eligible_conversations as (
  select conversation.id
  from public.evan_conversations conversation
  where not (
    coalesce(conversation.metadata ->> 'page', '') = 'automated-eval'
    or coalesce(conversation.metadata ->> 'page', '') = 'routing-regression'
    or coalesce(conversation.metadata ->> 'page', '') like 'activation-ai-%'
    or coalesce(conversation.metadata ->> 'page', '') like 'test:%'
    or coalesce(conversation.metadata ->> 'page', '') like '/test%'
    or coalesce(conversation.metadata ->> 'page', '') like '%audit%'
    or coalesce(conversation.metadata ->> 'page', '') like 'codex-%'
  )
),
ai_filtered as (
  select usage.*
  from private.evan_ai_usage usage
  join eligible_conversations conversation on conversation.id = usage.conversation_id
),
feedback as (
  select
    (feedback.created_at at time zone 'Europe/Paris')::date as day,
    count(*)::bigint as feedback_count,
    count(*) filter (where feedback.helpful)::bigint as helpful_count
  from public.evan_knowledge_feedback feedback
  join eligible_conversations conversation on conversation.id = feedback.conversation_id
  group by 1
),
ai as (
  select
    (created_at at time zone 'Europe/Paris')::date as day,
    count(*) filter (where status = 'success')::bigint as ai_calls,
    count(*) filter (where status = 'error')::bigint as ai_errors,
    count(*) filter (where status = 'success' and needs_human)::bigint as ai_handoffs,
    coalesce(sum(estimated_cost_usd), 0)::numeric(12, 6) as ai_cost_usd
  from ai_filtered
  group by 1
),
days as (
  select day from private.evan_conversion_daily
  union
  select day from feedback
  union
  select day from ai
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
  case when coalesce(feedback.feedback_count, 0) = 0 then 0
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
  'Pilotage réel de Sébastien : conversion, qualité et coût, hors tout trafic de test.';
