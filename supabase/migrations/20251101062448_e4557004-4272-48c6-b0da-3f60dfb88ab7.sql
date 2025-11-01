-- A) Allow guest rows (no linked user) but require *either* a user_id or a guest_name
alter table public.game_participants
  alter column user_id drop not null;

-- B) Add a check constraint: one of (user_id, guest_name) must be present — not both, not neither
do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema='public' and table_name='game_participants' and constraint_name='gp_user_or_guest_chk'
  ) then
    alter table public.game_participants
      add constraint gp_user_or_guest_chk
      check (
        (user_id is not null and guest_name is null)
        or
        (user_id is null and guest_name is not null)
      );
  end if;
end$$;

-- C) Uniqueness to prevent dup entries
--   - Real users: unique per (game_id, user_id)
create unique index if not exists gp_unique_user_per_game
  on public.game_participants (game_id, user_id)
  where user_id is not null;

--   - Guests: unique per (game_id, guest_name)
create unique index if not exists gp_unique_guest_per_game
  on public.game_participants (game_id, guest_name)
  where user_id is null;

-- D) Allow host to insert guest participants (user_id is NULL with guest_name present)
drop policy if exists gp_insert on public.game_participants;

create policy gp_insert on public.game_participants
for insert
with check (
  -- a) user adds themselves as participant
  (user_id = auth.uid())

  -- b) host adds a guest (no user_id, has guest_name)
  or (
    user_id is null
    and guest_name is not null
    and exists (
      select 1 from public.games g
      where g.id = game_participants.game_id
        and g.host_user_id = auth.uid()
    )
  )

  -- c) host adds another user (tagged participant)
  or (
    exists (
      select 1 from public.games g
      where g.id = game_participants.game_id
        and g.host_user_id = auth.uid()
    )
  )
);