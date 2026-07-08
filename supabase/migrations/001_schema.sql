-- ============================================================
-- SahaSepeti — 001: Uzantılar, enumlar, tablolar, indexler
-- ============================================================

create extension if not exists btree_gist;

-- ---------- Enumlar ----------
create type user_role as enum ('customer', 'venue_owner', 'admin');
create type venue_status as enum ('draft', 'pending', 'approved', 'rejected', 'suspended');
create type reservation_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type payment_type as enum ('deposit', 'full');
create type payment_status as enum ('pending', 'paid', 'refunded', 'failed');

-- ---------- profiles ----------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_url text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- venues ----------
create table venues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text not null default '',
  city text not null,
  district text not null,
  address text not null default '',
  latitude double precision,
  longitude double precision,
  phone text,
  cover_image_url text,
  amenities text[] not null default '{}',
  status venue_status not null default 'draft',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_venues_owner on venues (owner_id);
create index idx_venues_listing on venues (status, city, district);

-- ---------- venue_images ----------
create table venue_images (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  storage_path text not null,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_venue_images_venue on venue_images (venue_id);

-- ---------- sports ----------
create table sports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- venue_sports ----------
create table venue_sports (
  venue_id uuid not null references venues (id) on delete cascade,
  sport_id uuid not null references sports (id) on delete cascade,
  primary key (venue_id, sport_id)
);

-- ---------- courts ----------
create table courts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  sport_id uuid not null references sports (id),
  name text not null,
  surface_type text,
  is_indoor boolean not null default false,
  capacity int,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_courts_venue on courts (venue_id);

-- ---------- opening_hours ----------
create table opening_hours (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Pazar
  open_time time not null default '09:00',
  close_time time not null default '23:00',
  is_closed boolean not null default false,
  unique (venue_id, day_of_week),
  check (is_closed or open_time < close_time)
);

create index idx_opening_hours_venue on opening_hours (venue_id);

-- ---------- price_rules ----------
create table price_rules (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references courts (id) on delete cascade,
  day_of_week int check (day_of_week between 0 and 6), -- null = tüm günler
  start_time time not null,
  end_time time not null,
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'TRY',
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

create index idx_price_rules_court on price_rules (court_id);

-- ---------- reservations ----------
create table reservations (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references courts (id) on delete restrict,
  venue_id uuid not null references venues (id) on delete cascade,
  customer_id uuid not null references profiles (id) on delete cascade,
  reservation_date date not null,
  start_time time not null,
  end_time time not null,
  status reservation_status not null default 'pending',
  total_price numeric(10, 2) not null default 0 check (total_price >= 0),
  deposit_amount numeric(10, 2) not null default 0 check (deposit_amount >= 0),
  notes text,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time < end_time),
  -- Çift rezervasyon DB seviyesinde engellenir (iptal edilenler hariç)
  constraint no_double_booking exclude using gist (
    court_id with =,
    tsrange((reservation_date + start_time), (reservation_date + end_time)) with &&
  ) where (status <> 'cancelled')
);

create index idx_reservations_court_date on reservations (court_id, reservation_date);
create index idx_reservations_customer on reservations (customer_id);
create index idx_reservations_venue_date on reservations (venue_id, reservation_date);

-- ---------- payments (PLACEHOLDER — gerçek gateway bağlanmaz) ----------
create table payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations (id) on delete cascade,
  amount numeric(10, 2) not null check (amount >= 0),
  type payment_type not null,
  status payment_status not null default 'pending',
  provider text,
  provider_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_reservation on payments (reservation_id);

-- ---------- reviews (PLACEHOLDER) ----------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  customer_id uuid not null references profiles (id) on delete cascade,
  reservation_id uuid references reservations (id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (venue_id, customer_id)
);

create index idx_reviews_venue on reviews (venue_id);

-- ---------- favorites (PLACEHOLDER) ----------
create table favorites (
  customer_id uuid not null references profiles (id) on delete cascade,
  venue_id uuid not null references venues (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, venue_id)
);
