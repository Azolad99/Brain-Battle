create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;
revoke all on public.orders from anon;
grant select on public.orders to authenticated;

create policy "Users can view their own orders"
  on public.orders
  for select
  to authenticated
  using (auth.uid() = user_id);
