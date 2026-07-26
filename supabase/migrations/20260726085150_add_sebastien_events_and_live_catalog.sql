-- Mesure minimale du parcours de Sébastien.
-- La table n'est jamais exposée directement au navigateur : seule l'Edge Function
-- équipée de la clé service_role peut y écrire ou la lire.
create table if not exists public.evan_events (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.evan_conversations(id) on delete cascade,
  event_type text not null check (event_type in (
    'assistant_opened',
    'answer_shown',
    'price_shown',
    'stock_shown',
    'handoff_offered',
    'whatsapp_clicked',
    'email_clicked'
  )),
  channel text not null default 'web' check (channel in ('web', 'whatsapp', 'email')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists evan_events_conversation_created_idx
  on public.evan_events (conversation_id, created_at desc);

create index if not exists evan_events_type_created_idx
  on public.evan_events (event_type, created_at desc);

alter table public.evan_events enable row level security;
revoke all on table public.evan_events from anon, authenticated;

comment on table public.evan_events is
  'Événements de conversion anonymisés de l assistant Sébastien, écrits uniquement par evan-brain.';
