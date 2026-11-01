alter table public.orders
  add column if not exists stripe_session_id text;

create unique index if not exists orders_stripe_session_id_idx
  on public.orders(stripe_session_id)
  where stripe_session_id is not null;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'processing', 'paid', 'completed', 'cancelled'));

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;

create or replace function public.process_stripe_checkout_event(
  p_event_id text,
  p_event_type text,
  p_session_id text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  v_event_id text;
  v_order_id uuid;
begin
  if p_event_type <> 'checkout.session.completed' then
    raise exception 'Unsupported Stripe event type.';
  end if;

  insert into public.stripe_webhook_events(event_id, event_type)
  values (p_event_id, p_event_type)
  on conflict (event_id) do nothing
  returning event_id into v_event_id;

  if v_event_id is null then
    return;
  end if;

  update public.orders
  set status = 'paid', updated_at = now()
  where stripe_session_id = p_session_id
  returning id into v_order_id;

  if v_order_id is null then
    raise exception 'No order is associated with this checkout session.';
  end if;
end;
$$;

revoke all on function public.process_stripe_checkout_event(text, text, text)
  from public, anon, authenticated;
grant execute on function public.process_stripe_checkout_event(text, text, text)
  to service_role;
