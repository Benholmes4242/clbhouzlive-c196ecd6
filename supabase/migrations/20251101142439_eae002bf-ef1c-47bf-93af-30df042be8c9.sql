-- Phase 3: Privacy & Visibility Enforcement (corrected column names)

-- 1. Ensure user_follows has proper indexes (table already exists)
create index if not exists idx_user_follows_follower on public.user_follows(follower_id);
create index if not exists idx_user_follows_following on public.user_follows(following_id);

-- 2. Helper function: Is viewer a friend of the host?
create or replace function public.user_is_friend_of_host(_host_id uuid, _viewer_id uuid)
returns boolean
language sql stable security definer set search_path=public as $$
  select exists (
    select 1
    from public.user_follows uf
    where uf.following_id = _host_id
      and uf.follower_id = _viewer_id
  );
$$;

-- 3. Helper function: Does viewer share host's home_club?
create or replace function public.viewer_shares_host_club(_host_id uuid, _viewer_id uuid)
returns boolean
language sql stable security definer set search_path=public as $$
  with host as (
    select home_club from public.user_profiles where id = _host_id
  ),
  viewer as (
    select home_club from public.user_profiles where id = _viewer_id
  )
  select coalesce(h.home_club, '') <> '' 
     and h.home_club = v.home_club
  from host h cross join viewer v;
$$;

-- 4. Update user_can_see_game to enforce visibility rules
create or replace function public.user_can_see_game(_game_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.games g
    where g.id = _game_id
    and (
      -- Host can always see their own game
      g.host_user_id = _user_id
      or
      -- User is a participant (invited or accepted)
      exists (
        select 1 from public.game_participants gp
        where gp.game_id = g.id
        and gp.user_id = _user_id
        and gp.state in ('invited', 'accepted')
      )
      or
      -- Game is public, active, and not expired
      (
        g.visibility = 'public'
        and g.status = 'active'
        and g.expires_at > now()
      )
      or
      -- Game is friends-only and viewer is a friend of the host
      (
        g.visibility = 'friends'
        and g.status = 'active'
        and g.expires_at > now()
        and public.user_is_friend_of_host(g.host_user_id, _user_id)
      )
      or
      -- Game is club-only and viewer shares host's home_club
      (
        g.visibility = 'club'
        and g.status = 'active'
        and g.expires_at > now()
        and public.viewer_shares_host_club(g.host_user_id, _user_id)
      )
    )
  );
$$;

-- 5. Update games RLS policy to use enhanced visibility function
drop policy if exists games_read_public_active on public.games;
drop policy if exists games_read_host_participant on public.games;

create policy games_read on public.games
for select using (
  public.user_can_see_game(id, auth.uid())
);

-- 6. Ensure game_participants uses the same visibility check
drop policy if exists gp_read on public.game_participants;

create policy gp_read on public.game_participants
for select using (
  public.user_can_see_game(game_id, auth.uid())
);