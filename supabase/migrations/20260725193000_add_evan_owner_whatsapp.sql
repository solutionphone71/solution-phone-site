create table if not exists public.evan_whatsapp_events (
  id uuid primary key default gen_random_uuid(),
  meta_message_id text unique,
  direction text not null check (direction in ('inbound', 'outbound', 'status')),
  from_number text,
  to_number text,
  message_type text not null default 'text',
  body text,
  reply_to_message_id text,
  reference text,
  expert_request_id uuid references public.evan_expert_requests(id) on delete set null,
  delivery_status text,
  processed_status text not null default 'received'
    check (processed_status in ('received', 'processed', 'ignored', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists evan_whatsapp_reference_idx
  on public.evan_whatsapp_events (reference, created_at desc);
create index if not exists evan_whatsapp_reply_idx
  on public.evan_whatsapp_events (reply_to_message_id);
create index if not exists evan_whatsapp_expert_idx
  on public.evan_whatsapp_events (expert_request_id, created_at desc);

alter table public.evan_whatsapp_events enable row level security;
revoke all on table public.evan_whatsapp_events from anon, authenticated;
grant select, insert, update, delete on table public.evan_whatsapp_events to service_role;

comment on table public.evan_whatsapp_events is
  'Canal privé entre Evan et le propriétaire. Jamais exposé au navigateur.';
