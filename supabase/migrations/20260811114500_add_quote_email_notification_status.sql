alter table public.web_quote_requests
  add column if not exists email_notification_status text not null default 'pending'
    check (email_notification_status in ('pending', 'sent', 'failed')),
  add column if not exists email_notification_error text;

