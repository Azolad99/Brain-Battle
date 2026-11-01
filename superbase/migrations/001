-- Brain Battle starter schema. All client access should go through trusted server routes.
create extension if not exists pgcrypto;
create table if not exists public.rooms (
 id uuid primary key default gen_random_uuid(),
 code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
 status text not null default 'lobby' check (status in ('lobby','question','reveal','finished','closed')),
 host_token uuid not null,
 current_question integer not null default 0,
 question_started_at timestamptz,
 question_set jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.players (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references public.rooms(id) on delete cascade,
 nickname text not null check (char_length(nickname) between 2 and 18),
 player_token uuid not null unique,
 is_host boolean not null default false,
 score integer not null default 0 check (score >= 0),
 powerups jsonb not null default '{"double_points":1,"freeze_clock":1,"shield":1}'::jsonb,
 connected boolean not null default true,
 joined_at timestamptz not null default now(),
 unique(room_id, nickname)
);
create table if not exists public.answers (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references public.rooms(id) on delete cascade,
 player_id uuid not null references public.players(id) on delete cascade,
 question_index integer not null,
 option_index integer not null check (option_index between 0 and 3),
 submitted_at timestamptz not null default now(),
 is_correct boolean,
 points_awarded integer not null default 0,
 unique(player_id, question_index)
);
create index if not exists players_room_id_idx on public.players(room_id);
create index if not exists answers_room_question_idx on public.answers(room_id, question_index);
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.answers enable row level security;
-- No anon/authenticated policies are intentionally created. The starter uses server-only service-role access.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY to a browser. Add explicit, least-privilege policies only if moving reads client-side.
