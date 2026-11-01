create table if not exists public.scheduled_tasks (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  scheduled_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.scheduled_tasks enable row level security;
