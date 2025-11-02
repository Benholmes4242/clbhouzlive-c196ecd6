-- 1) Helper functions to avoid recursive RLS (SECURITY DEFINER)
create or replace function public.is_participant(p_user_id uuid, p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.game_participants gp
    where gp.game_id = p_game_id
      and gp.user_id = p_user_id
      and gp.state in ('invited','accepted')
  );
$$;

grant execute on function public.is_participant(uuid, uuid) to anon, authenticated;

create or replace function public.is_host_of_game(p_user_id uuid, p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.games g
    where g.id = p_game_id
      and g.host_user_id = p_user_id
  );
$$;

grant execute on function public.is_host_of_game(uuid, uuid) to anon, authenticated;

create or replace function public.can_view_game_participants(p_user_id uuid, p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with gg as (
    select id, host_user_id, visibility, status, expires_at
    from public.games
    where id = p_game_id
  )
  select
    -- Host can view participants
    exists (select 1 from gg where host_user_id = p_user_id)
    -- Participants (invited or accepted) can view participants
    or exists (
      select 1 from public.game_participants gp
      where gp.game_id = p_game_id and gp.user_id = p_user_id and gp.state in ('invited','accepted')
    )
    -- Viewers of visible games can view participants
    or exists (
      select 1
      from gg
      where status = 'active' and expires_at > now()
        and (
          visibility = 'public'
          or (
            visibility = 'friends'
            and exists (
              select 1 from public.user_follows uf
              where uf.follower_id = p_user_id and uf.following_id = gg.host_user_id
            )
          )
          or (
            visibility = 'club'
            and exists (
              select 1
              from public.user_profiles me
              join public.user_profiles host on host.id = gg.host_user_id
              where me.id = p_user_id
                and me.home_club is not null
                and host.home_club is not null
                and me.home_club = host.home_club
            )
          )
        )
    );
$$;

grant execute on function public.can_view_game_participants(uuid, uuid) to anon, authenticated;

-- 2) Update policies to remove cross-table recursion
-- games: replace SELECT policy that referenced game_participants directly
drop policy if exists "Users can view games with visibility rules" on public.games;

create policy "Users can view games with visibility rules v2"
on public.games
for select
to authenticated
using (
  -- Host can view
  (host_user_id = auth.uid())
  -- Visible games (public/friends/club)
  or (
    status = 'active' and expires_at > now() and (
      visibility = 'public'
      or (
        visibility = 'friends' and exists (
          select 1 from public.user_follows uf
          where uf.follower_id = auth.uid() and uf.following_id = games.host_user_id
        )
      )
      or (
        visibility = 'club' and exists (
          select 1
          from public.user_profiles me
          join public.user_profiles host on host.id = games.host_user_id
          where me.id = auth.uid()
            and me.home_club is not null
            and host.home_club is not null
            and me.home_club = host.home_club
        )
      )
    )
  )
  -- Participant can view (via helper, no direct join)
  or public.is_participant(auth.uid(), id)
);

-- game_participants: drop recursive SELECT policies and recreate using helper
drop policy if exists "Can read participants for my games" on public.game_participants;
drop policy if exists "gp_read" on public.game_participants;

create policy "gp_read"
on public.game_participants
for select
to authenticated
using (public.can_view_game_participants(auth.uid(), game_id));

-- Align DML policies to avoid direct joins back to games
drop policy if exists "gp_insert" on public.game_participants;
drop policy if exists "gp_update" on public.game_participants;
drop policy if exists "gp_delete" on public.game_participants;

create policy "gp_insert"
on public.game_participants
for insert
to authenticated
with check (
  (user_id = auth.uid())
  or (user_id is null and guest_name is not null and public.is_host_of_game(auth.uid(), game_id))
  or public.is_host_of_game(auth.uid(), game_id)
);

create policy "gp_update"
on public.game_participants
for update
to authenticated
using (public.is_host_of_game(auth.uid(), game_id) or user_id = auth.uid())
with check (public.is_host_of_game(auth.uid(), game_id) or user_id = auth.uid());

create policy "gp_delete"
on public.game_participants
for delete
to authenticated
using (public.is_host_of_game(auth.uid(), game_id) or user_id = auth.uid());

-- 3) Ensure helpful indexes exist (no-ops if already created)
create index if not exists idx_games_host on public.games(host_user_id);
create index if not exists idx_games_expires_visibility on public.games(expires_at, visibility, status);
create index if not exists idx_gp_game_id on public.game_participants(game_id);
create index if not exists idx_gp_user_id on public.game_participants(user_id);
create index if not exists idx_gp_role_state on public.game_participants(role, state);

-- 4) Reload PostgREST schema
notify pgrst, 'reload schema';