create table if not exists public.smashlab_events (
    event_id text primary key,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists smashlab_events_updated_at_idx
    on public.smashlab_events (updated_at desc);

create table if not exists public.smashlab_event_signatures (
    event_id text primary key,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists smashlab_event_signatures_updated_at_idx
    on public.smashlab_event_signatures (updated_at desc);