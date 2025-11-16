-- Phase 4A: Seasonal XP Ladders
-- Create seasons table to define time-boxed competitive periods

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default false,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for active season queries
create index seasons_active_idx on public.seasons (is_active, starts_at, ends_at);

-- RLS: Everyone can read seasons, only admins can manage
alter table public.seasons enable row level security;

create policy "seasons_read_all"
on public.seasons
for select
using (true);

-- Create view to aggregate XP per user per season
-- XP comes from unlocked achievements that fall within the season window
create or replace view public.user_season_xp_view as
select
  s.id as season_id,
  s.slug as season_slug,
  s.name as season_name,
  ua.user_id,
  coalesce(sum(a.points), 0) as total_xp
from seasons s
cross join lateral (
  select distinct user_id from user_achievements
) users
left join user_achievements ua
  on ua.user_id = users.user_id
  and ua.unlocked_at >= s.starts_at
  and ua.unlocked_at < s.ends_at
left join achievements a on a.id = ua.achievement_id
where s.id = s.id
group by s.id, s.slug, s.name, ua.user_id;

-- Create leaderboard view with rankings
create or replace view public.season_leaderboard_view as
select
  usx.season_id,
  usx.season_slug,
  usx.season_name,
  usx.user_id,
  coalesce(usx.total_xp, 0) as total_xp,
  rank() over (
    partition by usx.season_id
    order by coalesce(usx.total_xp, 0) desc, usx.user_id
  ) as season_rank
from user_season_xp_view usx
where usx.total_xp > 0;

-- Index on user_achievements.unlocked_at for performance
create index if not exists user_achievements_unlocked_at_idx
  on public.user_achievements (unlocked_at);

-- Insert initial season for Winter 2025
insert into public.seasons (slug, name, description, starts_at, ends_at, is_active, is_default)
values (
  'winter-2025',
  'Winter 2025 Season',
  'The inaugural competitive season on Clbhouz. Earn XP through achievements, course reviews, and community engagement.',
  '2025-01-01 00:00:00+00',
  '2025-03-31 23:59:59+00',
  true,
  true
);