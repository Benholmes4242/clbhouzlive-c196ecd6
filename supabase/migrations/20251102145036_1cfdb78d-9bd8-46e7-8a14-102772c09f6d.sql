-- Ensure join_requests table exists with correct schema
create table if not exists public.join_requests (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  requester_id uuid not null references public.user_profiles(id) on delete cascade,
  state text not null check (state in ('pending','approved','rejected')) default 'pending',
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.join_requests enable row level security;

-- Create unique index for pending requests
create unique index if not exists join_requests_unique_pending
  on public.join_requests (game_id, requester_id)
  where state = 'pending';

-- Create additional indexes
create index if not exists join_requests_game_id_idx on public.join_requests (game_id);
create index if not exists join_requests_requester_id_idx on public.join_requests (requester_id);

-- Drop existing policies if they exist
drop policy if exists jr_insert_self on public.join_requests;
drop policy if exists jr_read_self on public.join_requests;
drop policy if exists jr_read_host on public.join_requests;
drop policy if exists jr_update_host on public.join_requests;

-- RLS Policies
create policy jr_insert_self on public.join_requests
for insert to authenticated
with check (requester_id = auth.uid());

create policy jr_read_self on public.join_requests
for select to authenticated
using (requester_id = auth.uid());

create policy jr_read_host on public.join_requests
for select to authenticated
using (exists (
  select 1 from public.games g
  where g.id = join_requests.game_id
    and g.host_user_id = auth.uid()
));

create policy jr_update_host on public.join_requests
for update to authenticated
using (exists (
  select 1 from public.games g
  where g.id = join_requests.game_id
    and g.host_user_id = auth.uid()
))
with check (true);

-- Ensure decrement_slots_if_available RPC exists
create or replace function public.decrement_slots_if_available(p_game_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.games
  set 
    slots_open = case when slots_open > 0 then slots_open - 1 else 0 end,
    updated_at = now()
  where id = p_game_id;
end;
$$;