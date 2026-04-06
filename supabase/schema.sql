-- OneLink internal + website funnel — run in Supabase SQL Editor (once).
-- After first user signs up: UPDATE public.profiles SET role = 'super' WHERE email = 'your@email.com';

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (1:1 auth.users). New users default to team; promote super in SQL.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  role text not null default 'team' check (role in ('team', 'super')),
  display_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, display_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    'team',
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Bookings (team + website). Website rows use service role from Next.js API.
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  source text not null check (source in ('website', 'team')),
  team_member_id uuid references auth.users on delete set null,
  team_member_name text,
  customer_name text not null,
  customer_email text not null default '',
  customer_phone text not null default '',
  invoice_no text not null,
  amount_inr numeric(14, 2) not null default 0,
  payment_status text not null check (payment_status in ('paid', 'unpaid')),
  share_url text not null default '',
  notes text,
  external_booking_id text,
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists bookings_external_booking_id_key
  on public.bookings (external_booking_id)
  where external_booking_id is not null and external_booking_id <> '';

create index if not exists bookings_created_at_idx on public.bookings (created_at desc);
create index if not exists bookings_team_member_id_idx on public.bookings (team_member_id);
create index if not exists bookings_source_idx on public.bookings (source);

-- ---------------------------------------------------------------------------
-- Notifications (in-app log)
-- ---------------------------------------------------------------------------
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  kind text not null check (kind in ('email', 'note')),
  to_address text not null,
  subject text not null,
  preview text not null,
  channel text check (channel is null or channel in ('team', 'website', 'system')),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists notification_log_at_idx on public.notification_log (at desc);

-- ---------------------------------------------------------------------------
-- Invoice share payloads (short links; written by Next API + service role)
-- ---------------------------------------------------------------------------
create table if not exists public.invoice_share_payloads (
  id uuid primary key default gen_random_uuid(),
  customer_slug text not null,
  invoice_no text not null,
  payload_version int not null default 2,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_slug, invoice_no)
);

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_super()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super'
  );
$$;

create or replace function public.is_authenticated_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('team', 'super')
  );
$$;

alter table public.profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.notification_log enable row level security;
alter table public.invoice_share_payloads enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id or public.is_super());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (public.is_super());

drop policy if exists "bookings_select" on public.bookings;
create policy "bookings_select" on public.bookings
  for select using (
    public.is_super()
    or team_member_id = auth.uid()
  );

drop policy if exists "bookings_insert" on public.bookings;
create policy "bookings_insert" on public.bookings
  for insert with check (
    public.is_super()
    or (
      source = 'team'
      and team_member_id = auth.uid()
    )
  );

drop policy if exists "bookings_update" on public.bookings;
create policy "bookings_update" on public.bookings
  for update using (public.is_super() or team_member_id = auth.uid());

drop policy if exists "bookings_delete" on public.bookings;
create policy "bookings_delete" on public.bookings
  for delete using (public.is_super());

drop policy if exists "notifications_all" on public.notification_log;
create policy "notifications_all" on public.notification_log
  for all using (public.is_authenticated_staff())
  with check (public.is_authenticated_staff());

-- Invoice payloads: only service role (no anon policies). Edge/API uses service key.
