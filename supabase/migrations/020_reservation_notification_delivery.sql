begin;

-- Service-only delivery ledger. Frozen request content makes retries identical.
-- Browser roles have no access to owner email or rendered notification content.
create table public.reservation_notification_deliveries (
  reservation_id uuid primary key references public.reservations(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  request_body jsonb,
  started_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sent_at is not null or jsonb_typeof(request_body) = 'object'),
  check (request_body is not null or sent_at is not null)
);
alter table public.reservation_notification_deliveries enable row level security;
revoke all on public.reservation_notification_deliveries from public, anon, authenticated;
grant select, insert, update on public.reservation_notification_deliveries to service_role;
create policy notification_delivery_service_only
  on public.reservation_notification_deliveries for all to service_role
  using (true) with check (true);
create index idx_notification_deliveries_pending
  on public.reservation_notification_deliveries(started_at) where sent_at is null;
create trigger trg_notification_deliveries_updated_at
  before update on public.reservation_notification_deliveries
  for each row execute function public.set_updated_at();

commit;
