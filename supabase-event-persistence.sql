create table if not exists public.smashlab_events (
    event_id text primary key,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists smashlab_events_updated_at_idx
    on public.smashlab_events (updated_at desc);

create table if not exists public.smashlab_event_signature_entries (
    signature_id text primary key,
    event_id text not null,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists smashlab_event_signature_entries_event_id_idx
    on public.smashlab_event_signature_entries (event_id);

create index if not exists smashlab_event_signature_entries_updated_at_idx
    on public.smashlab_event_signature_entries (updated_at desc);

-- Legacy table kept for backwards compatibility with older deployments.
create table if not exists public.smashlab_event_signatures (
    event_id text primary key,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Row Level Security: only service_role can read/write these tables.
-- The server uses SUPABASE_SERVICE_KEY which bypasses RLS automatically,
-- so enabling RLS keeps anon/public clients locked out by default.
alter table public.smashlab_events enable row level security;
alter table public.smashlab_event_signature_entries enable row level security;
alter table public.smashlab_event_signatures enable row level security;

drop policy if exists "service role full access" on public.smashlab_events;
drop policy if exists "service role full access" on public.smashlab_event_signature_entries;
drop policy if exists "service role full access" on public.smashlab_event_signatures;

create policy "service role full access" on public.smashlab_events
    for all to service_role using (true) with check (true);

create policy "service role full access" on public.smashlab_event_signature_entries
    for all to service_role using (true) with check (true);

create policy "service role full access" on public.smashlab_event_signatures
    for all to service_role using (true) with check (true);