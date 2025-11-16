-- Phase 4D: Social Competition System

-- 1. challenges table
create table challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  type text not null check (type in ('weekly','monthly','personal','regional','global')),
  category text not null check (category in ('exploration','skill','social')),
  xp_reward int not null,
  shop_currency_reward int default 0,
  start_at timestamptz not null,
  end_at timestamptz not null,
  auto_generated boolean default false,
  created_by uuid references user_profiles(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_challenges_active on challenges(is_active, end_at) where is_active = true;
create index idx_challenges_type on challenges(type, start_at, end_at);

-- 2. challenge_requirements table
create table challenge_requirements (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  metric text not null,
  target int not null,
  created_at timestamptz default now()
);

create index idx_challenge_requirements_challenge on challenge_requirements(challenge_id);

-- 3. user_challenge_progress table
create table user_challenge_progress (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  current_value int default 0,
  is_completed boolean default false,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique(challenge_id, user_id)
);

create index idx_user_challenge_progress_user on user_challenge_progress(user_id, is_completed);
create index idx_user_challenge_progress_challenge on user_challenge_progress(challenge_id);

-- 4. rivals table
create table rivals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  rival_user_id uuid not null references user_profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, rival_user_id),
  check (user_id != rival_user_id)
);

create index idx_rivals_user on rivals(user_id);
create index idx_rivals_rival on rivals(rival_user_id);

-- 5. streaks table
create table streaks (
  user_id uuid primary key references user_profiles(id) on delete cascade,
  daily_streak int default 0,
  weekly_streak int default 0,
  monthly_streak int default 0,
  last_daily_action timestamptz,
  last_weekly_action timestamptz,
  last_monthly_action timestamptz,
  updated_at timestamptz default now()
);

create index idx_streaks_daily on streaks(last_daily_action);

-- 6. weekly_challenge_ladder table
create table weekly_challenge_ladder (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  season_id uuid not null references seasons(id) on delete cascade,
  week_start timestamptz not null,
  week_end timestamptz not null,
  points int default 0,
  rank int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, season_id, week_start)
);

create index idx_weekly_ladder_season_week on weekly_challenge_ladder(season_id, week_start, rank);
create index idx_weekly_ladder_user on weekly_challenge_ladder(user_id, season_id);

-- 7. season_wrap_cards table
create table season_wrap_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  season_id uuid not null references seasons(id) on delete cascade,
  cards jsonb not null default '[]'::jsonb,
  viewed boolean default false,
  generated_at timestamptz default now(),
  unique(user_id, season_id)
);

create index idx_season_wrap_user on season_wrap_cards(user_id, viewed);

-- RLS Policies

-- challenges: public read for active challenges
alter table challenges enable row level security;

create policy "Public can view active challenges"
  on challenges for select
  using (is_active = true and now() between start_at and end_at);

create policy "Admins can manage challenges"
  on challenges for all
  using (is_admin())
  with check (is_admin());

-- challenge_requirements: public read
alter table challenge_requirements enable row level security;

create policy "Public can view requirements"
  on challenge_requirements for select
  using (exists (
    select 1 from challenges c
    where c.id = challenge_requirements.challenge_id
    and c.is_active = true
  ));

-- user_challenge_progress: users can view/update own progress
alter table user_challenge_progress enable row level security;

create policy "Users can view own progress"
  on user_challenge_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on user_challenge_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on user_challenge_progress for update
  using (auth.uid() = user_id);

create policy "System can manage progress"
  on user_challenge_progress for all
  using (false)
  with check (false);

-- rivals: users manage own rivals
alter table rivals enable row level security;

create policy "Users can view own rivals"
  on rivals for select
  using (auth.uid() = user_id or auth.uid() = rival_user_id);

create policy "Users can add rivals"
  on rivals for insert
  with check (auth.uid() = user_id);

create policy "Users can remove rivals"
  on rivals for delete
  using (auth.uid() = user_id);

-- streaks: users can view own streaks
alter table streaks enable row level security;

create policy "Users can view own streaks"
  on streaks for select
  using (auth.uid() = user_id);

create policy "Users can update own streaks"
  on streaks for update
  using (auth.uid() = user_id);

create policy "System can manage streaks"
  on streaks for all
  using (false)
  with check (false);

-- weekly_challenge_ladder: public read, system write
alter table weekly_challenge_ladder enable row level security;

create policy "Public can view ladder"
  on weekly_challenge_ladder for select
  using (true);

create policy "System can manage ladder"
  on weekly_challenge_ladder for all
  using (false)
  with check (false);

-- season_wrap_cards: users view own wrap
alter table season_wrap_cards enable row level security;

create policy "Users can view own wrap"
  on season_wrap_cards for select
  using (auth.uid() = user_id);

create policy "Users can update own wrap viewed status"
  on season_wrap_cards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "System can create wrap cards"
  on season_wrap_cards for insert
  with check (false);

-- Triggers for updated_at
create trigger update_user_challenge_progress_updated_at
  before update on user_challenge_progress
  for each row
  execute function update_updated_at_column();

create trigger update_streaks_updated_at
  before update on streaks
  for each row
  execute function update_updated_at_column();

create trigger update_weekly_challenge_ladder_updated_at
  before update on weekly_challenge_ladder
  for each row
  execute function update_updated_at_column();