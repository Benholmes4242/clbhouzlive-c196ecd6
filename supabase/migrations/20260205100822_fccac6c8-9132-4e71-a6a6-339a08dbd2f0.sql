-- Create notification_preferences table for per-type and per-user muting
create table public.notification_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  -- Per-type muting (e.g., ['like', 'follow'])
  muted_types text[] default '{}',
  -- Per-user muting (array of user UUIDs)
  muted_user_ids uuid[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Enable Row Level Security
alter table public.notification_preferences enable row level security;

-- Create policies for users to manage their own preferences
create policy "Users can read own preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id);

create policy "Users can delete own preferences"
  on public.notification_preferences for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.update_notification_preferences_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger update_notification_preferences_timestamp
  before update on public.notification_preferences
  for each row
  execute function public.update_notification_preferences_updated_at();