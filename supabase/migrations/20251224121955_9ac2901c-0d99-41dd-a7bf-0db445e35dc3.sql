-- TOUR HUB: Core tables (data-first foundation)

create table if not exists public.tourhub_events (
  id uuid primary key default gen_random_uuid(),
  tour text not null,                            -- 'pga' | 'lpga' | 'eur' | 'champions-tour'
  espn_event_id text not null,
  name text not null,
  status text not null default 'upcoming',       -- 'upcoming' | 'live' | 'complete'
  start_date date,
  end_date date,
  course_name text,
  location text,
  logo_url text,
  event_url text,
  last_fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tour, espn_event_id)
);

create index if not exists idx_tourhub_events_tour_status
  on public.tourhub_events (tour, status);

create index if not exists idx_tourhub_events_dates
  on public.tourhub_events (start_date, end_date);

create table if not exists public.tourhub_leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  tour text not null,
  espn_event_id text not null,
  round int,
  status text,                                   -- 'upcoming' | 'live' | 'complete'
  payload jsonb not null,                        -- normalized leaderboard payload
  fetched_at timestamptz not null default now()
);

create index if not exists idx_tourhub_lb_snapshots_lookup
  on public.tourhub_leaderboard_snapshots (tour, espn_event_id, fetched_at desc);

-- Latest snapshot convenience view (fast reads)
create or replace view public.tourhub_leaderboard_latest as
select distinct on (tour, espn_event_id)
  tour,
  espn_event_id,
  round,
  status,
  payload,
  fetched_at
from public.tourhub_leaderboard_snapshots
order by tour, espn_event_id, fetched_at desc;

-- Optional: lightweight players cache (phase 1.5)
create table if not exists public.tourhub_players (
  id uuid primary key default gen_random_uuid(),
  espn_athlete_id text unique,
  name text,
  country text,
  headshot_url text,
  bio text,
  payload jsonb,                                 -- keep raw-ish details for later
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tourhub_events_updated_at on public.tourhub_events;
create trigger trg_tourhub_events_updated_at
before update on public.tourhub_events
for each row execute function public.set_updated_at();

-- RLS: Public read, admin write (adjust if you want authenticated-only)
alter table public.tourhub_events enable row level security;
alter table public.tourhub_leaderboard_snapshots enable row level security;
alter table public.tourhub_players enable row level security;

-- Anyone can read (public app)
drop policy if exists "tourhub_events_read" on public.tourhub_events;
create policy "tourhub_events_read"
on public.tourhub_events for select
using (true);

drop policy if exists "tourhub_lb_read" on public.tourhub_leaderboard_snapshots;
create policy "tourhub_lb_read"
on public.tourhub_leaderboard_snapshots for select
using (true);

drop policy if exists "tourhub_players_read" on public.tourhub_players;
create policy "tourhub_players_read"
on public.tourhub_players for select
using (true);