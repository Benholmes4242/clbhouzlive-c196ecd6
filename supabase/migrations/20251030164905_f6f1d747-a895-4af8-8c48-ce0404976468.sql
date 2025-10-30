-- Patch game_tag_decline to handle decline + system message without requiring accepted-member perms
create or replace function public.game_tag_decline(p_game_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.current_auth_uid();
  v_reserved boolean;
  v_thread_id uuid;
  v_expires_at timestamptz;
begin
  -- Ensure game exists & lock
  select expires_at into v_expires_at
  from public.games g
  where g.id = p_game_id
  for update;
  if not found then
    raise exception 'game not found';
  end if;

  -- Lock participant row (invited OR accepted)
  select gp.reserves_slot into v_reserved
  from public.game_participants gp
  where gp.game_id = p_game_id
    and gp.user_id = v_uid
    and gp.role = 'player'
    and gp.state in ('invited','accepted')
  for update;

  if v_reserved is null then
    raise exception 'no invite found';
  end if;

  -- Decline + free seat if it was reserved
  update public.game_participants
     set state = 'declined',
         reserves_slot = false,
         updated_at = now()
   where game_id = p_game_id and user_id = v_uid;

  if v_reserved then
    update public.games
       set slots_open = slots_open + 1,
           updated_at = now()
     where id = p_game_id;
  end if;

  -- Ensure chat thread exists (idempotent)
  insert into public.game_threads (game_id, expires_at)
  values (p_game_id, v_expires_at)
  on conflict (game_id) do nothing;

  select id into v_thread_id
  from public.game_threads
  where game_id = p_game_id;

  -- Log system message directly (no accepted-member requirement)
  insert into public.game_thread_messages (thread_id, sender_id, text, is_system)
  values (v_thread_id, v_uid, 'declined their reserved seat.', true);

  return jsonb_build_object('ok', true, 'action', 'tag_decline');
end;
$$;