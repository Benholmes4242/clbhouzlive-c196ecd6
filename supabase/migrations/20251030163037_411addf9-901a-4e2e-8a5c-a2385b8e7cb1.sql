-- B) Fix RLS recursion on game_thread_participants with security definer function
-- Create security definer function to check thread membership (bypasses RLS)
create or replace function public.is_thread_member(_thread_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.game_thread_participants gtp
    where gtp.thread_id = _thread_id
      and gtp.user_id = auth.uid()
  );
$$;

-- Grant execute permission to authenticated users only
revoke all on function public.is_thread_member(uuid) from public;
grant execute on function public.is_thread_member(uuid) to authenticated;

-- Replace the select policy on game_thread_participants to use the definer function
drop policy if exists "Users can view thread participants" on public.game_thread_participants;

create policy "gtp_select"
on public.game_thread_participants
for select
to authenticated
using ( public.is_thread_member(thread_id) );

-- C) Add sanity policies for game_join_requests (production correctness)
-- Drop existing policies to avoid conflicts
drop policy if exists "Requesters and hosts can view their join requests" on public.game_join_requests;
drop policy if exists "Game hosts can view requests for their games" on public.game_join_requests;
drop policy if exists "Users can create join requests for public games" on public.game_join_requests;

-- Requester can see their own join requests
create policy "gjr_requester_select"
on public.game_join_requests
for select
to authenticated
using ( requester_user_id = auth.uid() );

-- Host can see join requests for their games
create policy "gjr_host_select"
on public.game_join_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.games g
    where g.id = game_join_requests.game_id
      and g.host_user_id = auth.uid()
  )
);

-- Insert: requester is the current user
create policy "gjr_insert"
on public.game_join_requests
for insert
to authenticated
with check ( requester_user_id = auth.uid() );