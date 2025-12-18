-- Step 2A: Create golf_clubs parent table
create table if not exists public.golf_clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  club_key text not null,
  country text,
  region text,
  sub_country text,
  continent text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  unique (club_key, country, region, sub_country)
);

create index if not exists idx_golf_clubs_key on public.golf_clubs (club_key);
create index if not exists idx_golf_clubs_country on public.golf_clubs (country);

-- Step 2B: Add club_id FK to golf_courses
alter table public.golf_courses
add column if not exists club_id uuid references public.golf_clubs(id) on delete set null;

create index if not exists idx_golf_courses_club_id on public.golf_courses (club_id);

-- Step 2C: Normalisation helper functions
create or replace function public.normalize_key(p_text text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(trim(coalesce(p_text,''))), '[^a-z0-9]+', '', 'g');
$$;

create or replace function public.base_club_name(p_course_name text)
returns text
language sql
immutable
as $$
  select trim(
    regexp_replace(
      coalesce(p_course_name,''),
      '\s*[\(\[\{].*?(east|west|north|south|old|new|links|park|championship|course|nine|18|hole|blue|red|white|black|gold|silver|no\.\s*\d+|\d+).*?[\)\]\}]\s*$',
      '',
      'i'
    )
  );
$$;

-- Step 2D: Populate golf_clubs from golf_courses
insert into public.golf_clubs (name, club_key, country, region, sub_country, continent, latitude, longitude)
select
  public.base_club_name(gc.name) as club_name,
  public.normalize_key(public.base_club_name(gc.name)) as club_key,
  gc.country,
  gc.region,
  gc.sub_country,
  gc.continent::text,
  avg(gc.latitude::double precision) as latitude,
  avg(gc.longitude::double precision) as longitude
from public.golf_courses gc
group by
  public.base_club_name(gc.name),
  public.normalize_key(public.base_club_name(gc.name)),
  gc.country, gc.region, gc.sub_country, gc.continent
on conflict do nothing;

-- Step 2E: Backfill golf_courses.club_id
update public.golf_courses gc
set club_id = c.id
from public.golf_clubs c
where
  c.club_key = public.normalize_key(public.base_club_name(gc.name))
  and coalesce(c.country,'') = coalesce(gc.country,'')
  and coalesce(c.region,'') = coalesce(gc.region,'')
  and coalesce(c.sub_country,'') = coalesce(gc.sub_country,'')
  and coalesce(c.continent,'') = coalesce(gc.continent::text,'')
  and gc.club_id is null;

-- Step 3A: Add club_id to business_accounts
alter table public.business_accounts
add column if not exists club_id uuid references public.golf_clubs(id) on delete set null;

create index if not exists idx_business_accounts_club_id on public.business_accounts (club_id);

-- Step 3B: Backfill business_accounts.club_id from club_key
update public.business_accounts ba
set club_id = c.id
from public.golf_clubs c
where
  ba.club_id is null
  and ba.club_key is not null
  and c.club_key = ba.club_key;

-- Step 4A: Add primary_club_id to user_profiles
alter table public.user_profiles
add column if not exists primary_club_id uuid references public.golf_clubs(id) on delete set null;

create index if not exists idx_user_profiles_primary_club on public.user_profiles(primary_club_id);

-- Step 4B: Add club_id to user_home_clubs
alter table public.user_home_clubs
add column if not exists club_id uuid references public.golf_clubs(id) on delete cascade;

create index if not exists idx_user_home_clubs_club_id on public.user_home_clubs(club_id);

-- Step 6: Business claimed courses table
create table if not exists public.business_claimed_courses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_accounts(id) on delete cascade,
  course_id uuid not null references public.golf_courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (business_id, course_id)
);

create index if not exists idx_bcc_business on public.business_claimed_courses(business_id);
create index if not exists idx_bcc_course on public.business_claimed_courses(course_id);

-- Enable RLS on new tables
alter table public.golf_clubs enable row level security;
alter table public.business_claimed_courses enable row level security;

-- Public read access for golf_clubs (reference data)
create policy "golf_clubs_public_read" on public.golf_clubs
for select to authenticated using (true);

-- Business claimed courses: public read, owners can manage
create policy "bcc_public_read" on public.business_claimed_courses
for select to authenticated using (true);

create policy "bcc_owner_insert" on public.business_claimed_courses
for insert to authenticated
with check (
  exists (
    select 1 from public.business_members bm
    where bm.business_id = business_claimed_courses.business_id
    and bm.user_profile_id = auth.uid()
    and bm.role in ('owner', 'admin')
  )
);

create policy "bcc_owner_delete" on public.business_claimed_courses
for delete to authenticated
using (
  exists (
    select 1 from public.business_members bm
    where bm.business_id = business_claimed_courses.business_id
    and bm.user_profile_id = auth.uid()
    and bm.role in ('owner', 'admin')
  )
);