-- Fix infinite recursion: game_participants.gp_read was checking games which checks game_participants
-- Solution: Use security definer helper function to break the cycle

-- 1) Create helper function to check if user can see a game (security definer = runs as owner, bypasses RLS)
create or replace function public.user_can_see_game(_game_id uuid, _user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.games g
    where g.id = _game_id
      and (
        g.host_user_id = _user_id
        or exists (
          select 1 from public.game_participants gp
          where gp.game_id = g.id and gp.user_id = _user_id
        )
        or (g.visibility = 'public' and g.status = 'active' and g.expires_at > now())
      )
  );
$$;

-- 2) Recreate gp_read policy using the helper (no more recursion)
drop policy if exists gp_read on public.game_participants;

create policy gp_read on public.game_participants
for select
using (
  public.user_can_see_game(game_participants.game_id, auth.uid())
);