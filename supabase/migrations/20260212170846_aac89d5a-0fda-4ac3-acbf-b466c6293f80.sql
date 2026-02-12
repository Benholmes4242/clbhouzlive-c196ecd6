create table if not exists tournament_picks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tournament_id text not null,
  player_name text not null,
  player_id text,
  picked_at timestamptz default now() not null,
  is_correct boolean default null,
  created_at timestamptz default now() not null,
  unique(user_id, tournament_id)
);

alter table tournament_picks enable row level security;

create policy "Users can read their own picks"
  on tournament_picks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own picks"
  on tournament_picks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own picks"
  on tournament_picks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_tournament_picks_user on tournament_picks(user_id);
create index idx_tournament_picks_tournament on tournament_picks(tournament_id);