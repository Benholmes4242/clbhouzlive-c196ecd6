-- =====================================================================
-- MIGRATION: Fix RLS recursion on public.games, ensure indexes & realtime,
--            and harden game_join_requests policies.
-- Safe to re-run (idempotent where possible).
-- =====================================================================

-- 1) Ensure pg_trgm for fuzzy search
create extension if not exists pg_trgm;

-- 2) Drop ALL existing policies on public.games to remove recursion
do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'games'
  loop
    execute format('drop policy if exists %I on public.games;', r.policyname);
  end loop;
end$$;

-- 3) Recreate clean, NON-RECURSIVE policies for public.games
alter table public.games enable row level security;

-- Public can read active, non-expired, public games
create policy games_read_public_active on public.games
for select
using (
  status = 'active'
  and visibility = 'public'
  and expires_at > now()
);

-- Host & participants can read their games (even private / past)
create policy games_read_host_participant on public.games
for select
using (
  host_user_id = auth.uid()
  or exists (
    select 1
    from public.game_participants gp
    where gp.game_id = games.id
      and gp.user_id = auth.uid()
  )
);

-- Host writes only
create policy games_owner_update on public.games
for update
using (host_user_id = auth.uid())
with check (host_user_id = auth.uid());

create policy games_owner_delete on public.games
for delete
using (host_user_id = auth.uid());

-- Any logged-in user may insert (validation handled app-side)
create policy games_insert_logged_in on public.games
for insert
with check (auth.uid() is not null);

-- 4) Fix common recursion/joins in game_join_requests (no joins to games in policies)
-- Drop and recreate policies to be simple and scoped by requester/host
do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'game_join_requests'
  loop
    execute format('drop policy if exists %I on public.game_join_requests;', r.policyname);
  end loop;
end$$;

alter table public.game_join_requests enable row level security;

-- Read: requester or host of the game can see the request rows
create policy gjr_read_scoped on public.game_join_requests
for select
using (
  requester_user_id = auth.uid()
  or exists (
    select 1
    from public.games g
    where g.id = game_join_requests.game_id
      and g.host_user_id = auth.uid()
  )
);

-- Insert: requester creates their own request
create policy gjr_insert_self on public.game_join_requests
for insert
with check (requester_user_id = auth.uid());

-- Update/Delete: requester or host can action/cancel
create policy gjr_update_scoped on public.game_join_requests
for update
using (
  requester_user_id = auth.uid()
  or exists (
    select 1 from public.games g
    where g.id = game_join_requests.game_id
      and g.host_user_id = auth.uid()
  )
)
with check (
  requester_user_id = auth.uid()
  or exists (
    select 1 from public.games g
    where g.id = game_join_requests.game_id
      and g.host_user_id = auth.uid()
  )
);

create policy gjr_delete_scoped on public.game_join_requests
for delete
using (
  requester_user_id = auth.uid()
  or exists (
    select 1 from public.games g
    where g.id = game_join_requests.game_id
      and g.host_user_id = auth.uid()
  )
);

-- 5) Ensure indexes exist (helps search + expiry filtering)
create index if not exists idx_games_status_expires
  on public.games (status, expires_at);

-- Normalized name GIN (trgm) for fuzzy search
create index if not exists idx_games_course_name_normalized
  on public.games using gin (course_name_normalized gin_trgm_ops);

-- Optional geobox helpers if you frequently box-filter by lat/lng while status=active
create index if not exists idx_games_geo_active
  on public.games (lat, lng)
  where status = 'active';

-- 6) Ensure realtime emits full row changes
alter table public.games replica identity full;

-- Ensure table is in the realtime publication (safe even if exists)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'games'
  ) then
    alter publication supabase_realtime add table public.games;
  end if;
end$$;