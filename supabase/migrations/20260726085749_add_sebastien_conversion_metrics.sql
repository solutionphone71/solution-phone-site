create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create or replace view private.evan_conversion_daily
with (security_invoker = true)
as
with sessions as (
  select
    timezone('Europe/Paris', event.created_at)::date as day,
    event.conversation_id,
    bool_or(event.event_type = 'assistant_opened') as opened,
    bool_or(event.event_type = 'answer_shown') as answered,
    bool_or(event.event_type = 'price_shown') as price_shown,
    bool_or(event.event_type = 'stock_shown') as stock_shown,
    bool_or(event.event_type = 'handoff_offered') as handoff_offered,
    bool_or(event.event_type = 'whatsapp_clicked') as whatsapp_clicked,
    bool_or(event.event_type = 'email_clicked') as email_clicked
  from public.evan_events event
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
  count(*) filter (where email_clicked) as email_clicks,
  count(*) filter (where whatsapp_clicked or email_clicked) as quote_contacts,
  round(
    100.0 * count(*) filter (where whatsapp_clicked or email_clicked) / nullif(count(*), 0),
    1
  ) as contact_rate_percent
from sessions
group by day;

revoke all on private.evan_conversion_daily from public, anon, authenticated;
grant select on private.evan_conversion_daily to service_role;

comment on view private.evan_conversion_daily is
  'Mesure quotidienne du passage de l assistant Sébastien vers WhatsApp ou e-mail.';
