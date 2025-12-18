-- Step 1: Enable trigram extension for similarity searches
create extension if not exists pg_trgm;

-- Step 1.1: Create v2 canonical key functions
create or replace function public.canonical_club_name_v2(p_name text)
returns text
language sql
immutable
as $$
  select trim(
    regexp_replace(
      regexp_replace(
        regexp_replace(coalesce(p_name,''), '^\s*the\s+', '', 'i'),                        -- drop leading "The"
        '\s+(golf\s*club|golfclub|g\.?c\.?|gc|golf\s*course|country\s*club|c\.?c\.?)\s*$',
        '',
        'i'
      ),
      '\s{2,}',
      ' ',
      'g'
    )
  );
$$;

create or replace function public.club_key_v2(p_name text)
returns text
language sql
immutable
as $$
  select public.normalize_key(public.canonical_club_name_v2(p_name));
$$;

-- Step 1.2: Add v2 key column to golf_clubs
alter table public.golf_clubs
add column if not exists club_key_v2 text;

-- Step 1.3: Populate v2 keys
update public.golf_clubs
set club_key_v2 = public.club_key_v2(name)
where club_key_v2 is null;

-- Create index for v2 key
create index if not exists idx_golf_clubs_key_v2 on public.golf_clubs (club_key_v2);

-- Create trigram index for similarity searches
create index if not exists idx_golf_clubs_name_trgm
on public.golf_clubs using gin (name gin_trgm_ops);

-- Step 2.1: Create merge mapping table
create table if not exists public.golf_club_merge_map (
  from_club_id uuid primary key,
  to_club_id uuid not null
);

-- Clear any existing mappings
truncate table public.golf_club_merge_map;

-- Identify duplicates and map to canonical (oldest) club
with ranked as (
  select
    id,
    club_key_v2,
    country, region, sub_country, continent,
    first_value(id) over (
      partition by club_key_v2, country, region, sub_country, continent
      order by created_at asc, id asc
    ) as canonical_id
  from public.golf_clubs
)
insert into public.golf_club_merge_map (from_club_id, to_club_id)
select id, canonical_id
from ranked
where id <> canonical_id;

-- Step 2.2: Re-point all references to canonical clubs

-- Courses
update public.golf_courses gc
set club_id = m.to_club_id
from public.golf_club_merge_map m
where gc.club_id = m.from_club_id;

-- Business accounts
update public.business_accounts ba
set club_id = m.to_club_id
from public.golf_club_merge_map m
where ba.club_id = m.from_club_id;

-- User profiles (primary club)
update public.user_profiles up
set primary_club_id = m.to_club_id
from public.golf_club_merge_map m
where up.primary_club_id = m.from_club_id;

-- User home clubs (additional)
update public.user_home_clubs uhc
set club_id = m.to_club_id
from public.golf_club_merge_map m
where uhc.club_id = m.from_club_id;

-- Step 2.3: Remove duplicate clubs
delete from public.golf_clubs c
using public.golf_club_merge_map m
where c.id = m.from_club_id;

-- Step 3.1: Create alias table for manual typo/spelling corrections
create table if not exists public.golf_club_aliases (
  id uuid primary key default gen_random_uuid(),
  alias_key text not null unique,
  canonical_club_id uuid not null references public.golf_clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_golf_club_aliases_canonical
on public.golf_club_aliases (canonical_club_id);

-- RLS for golf_club_aliases (public read, admin write)
alter table public.golf_club_aliases enable row level security;

create policy "Anyone can read club aliases"
on public.golf_club_aliases for select
using (true);

-- Drop merge map table (no longer needed)
drop table if exists public.golf_club_merge_map;