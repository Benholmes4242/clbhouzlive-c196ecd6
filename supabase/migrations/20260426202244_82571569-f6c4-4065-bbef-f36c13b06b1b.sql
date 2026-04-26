create table if not exists public.stat_of_week_copy (
  category_key text primary key,
  standfirst_text text not null,
  leader_player_id uuid,
  leader_player_name text,
  leader_value numeric,
  leader_value_display text,
  generated_at timestamptz not null default now(),
  generated_by text not null default 'anthropic-claude-sonnet-4-5',
  prompt_version text not null default 'v1'
);

alter table public.stat_of_week_copy enable row level security;

create policy "stat_of_week_copy public read"
  on public.stat_of_week_copy
  for select
  to anon, authenticated
  using (true);

create policy "stat_of_week_copy service write"
  on public.stat_of_week_copy
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists idx_stat_of_week_copy_generated_at
  on public.stat_of_week_copy (generated_at desc);