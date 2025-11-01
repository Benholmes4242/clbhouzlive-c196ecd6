-- =====================================================================
-- MIGRATION: Guest participants + slots_open auto-sync + policies
-- =====================================================================

-- 1) game_participants: enable guest rows
-- Add columns if missing
alter table public.game_participants
  add column if not exists guest_name text,
  add column if not exists added_by_user_id uuid;

-- Each participant must be either a user OR a guest (but not both)
alter table public.game_participants
  drop constraint if exists gp_user_or_guest_chk;
alter table public.game_participants
  add constraint gp_user_or_guest_chk
  check ( (user_id is not null) <> (guest_name is not null) );

-- Optional: Who added the guest (host normally)
alter table public.game_participants
  drop constraint if exists gp_added_by_fk;
alter table public.game_participants
  add constraint gp_added_by_fk
  foreign key (added_by_user_id) references auth.users(id) on delete set null;

-- 2) Keep games.slots_open in sync with participants
create or replace function public.fn_games_recalc_slots_open()
returns trigger language plpgsql as $$
declare
  v_slots_total smallint;
  v_participants int;
  v_game_id uuid;
begin
  -- Determine which game_id to use
  if TG_OP = 'DELETE' then
    v_game_id := OLD.game_id;
  else
    v_game_id := NEW.game_id;
  end if;

  select slots_total into v_slots_total from public.games where id = v_game_id;
  if v_slots_total is null then return null; end if;

  select count(*) into v_participants
  from public.game_participants
  where game_id = v_game_id;

  update public.games
  set slots_open = greatest(v_slots_total - v_participants, 0),
      updated_at = now()
  where id = v_game_id;
  
  return null;
end
$$;

-- Trigger for INSERT/UPDATE/DELETE on participants
drop trigger if exists trg_games_slots_recalc on public.game_participants;

create trigger trg_games_slots_recalc
after insert or update or delete on public.game_participants
for each row execute function public.fn_games_recalc_slots_open();

-- 3) Policies: allow host/requester to manage guests; keep reads simple
-- game_participants RLS
alter table public.game_participants enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname='public' and tablename='game_participants'
  loop execute format('drop policy if exists %I on public.game_participants;', r.policyname);
  end loop;
end$$;

-- Read: host or any participant can see the roster; also public if game is public & active
create policy gp_read on public.game_participants
for select
using (
  exists (select 1 from public.games g where g.id = game_participants.game_id
          and (
            g.host_user_id = auth.uid()
            or exists (select 1 from public.game_participants gp2 where gp2.game_id=g.id and gp2.user_id=auth.uid())
            or (g.visibility='public' and g.status='active' and g.expires_at>now())
          ))
);

-- Insert: host can add guests or users; a user can add self
create policy gp_insert on public.game_participants
for insert
with check (
  exists (select 1 from public.games g where g.id = game_participants.game_id and g.host_user_id = auth.uid())
  or (user_id = auth.uid())
);

-- Update/Delete: host or the same participant can modify/remove
create policy gp_update on public.game_participants
for update
using (
  exists (select 1 from public.games g where g.id = game_participants.game_id and g.host_user_id = auth.uid())
  or (user_id = auth.uid())
)
with check (
  exists (select 1 from public.games g where g.id = game_participants.game_id and g.host_user_id = auth.uid())
  or (user_id = auth.uid())
);

create policy gp_delete on public.game_participants
for delete
using (
  exists (select 1 from public.games g where g.id = game_participants.game_id and g.host_user_id = auth.uid())
  or (user_id = auth.uid())
);

-- 4) Helpful index: fast roster counts
create index if not exists idx_gp_game_id on public.game_participants(game_id);