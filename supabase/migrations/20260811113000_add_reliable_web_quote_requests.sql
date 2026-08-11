create table if not exists public.web_quote_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  client_token uuid not null unique,
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_email text not null check (char_length(customer_email) between 5 and 254),
  customer_phone text,
  request_text text not null check (char_length(request_text) between 10 and 2000),
  form_type text not null check (form_type in ('main_quote', 'quick_other_part')),
  source_page text not null default '/',
  status text not null default 'new' check (status in ('new', 'contacted', 'closed', 'spam')),
  notification_status text not null default 'pending' check (notification_status in ('pending', 'sent', 'failed', 'skipped')),
  notification_error text,
  client_fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.web_quote_requests enable row level security;
revoke all on table public.web_quote_requests from anon, authenticated;

create index if not exists web_quote_requests_created_at_idx
  on public.web_quote_requests (created_at desc);
create index if not exists web_quote_requests_rate_limit_idx
  on public.web_quote_requests (client_fingerprint, created_at desc);

comment on table public.web_quote_requests is
  'Demandes de devis reçues depuis les sites publics Solution Phone. Accès réservé au service serveur.';

