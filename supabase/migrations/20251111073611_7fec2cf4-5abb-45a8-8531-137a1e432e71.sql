-- Bulk tag operations for Echo History
-- RPC: echo_tags_add_bulk - Add tags to multiple threads atomically

create or replace function public.echo_tags_add_bulk(p_thread_ids uuid[], p_names text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  norm_names text[];
  t_id uuid;
  owner_uuid uuid;
begin
  owner_uuid := auth.uid();
  if owner_uuid is null then
    raise exception 'Not authenticated';
  end if;

  -- normalize names (trim/lower) and drop empties
  norm_names := array(
    select lower(trim(x)) from unnest(p_names) x where length(trim(x)) >= 1
  );

  if array_length(norm_names,1) is null then
    return;
  end if;

  -- ensure tags exist in echo_tags (upsert by name_norm)
  insert into echo_tags(owner_id, name)
  select owner_uuid, unnest(p_names)
  on conflict (owner_id, name_norm) do nothing;

  -- link tags to threads
  insert into echo_thread_tags(thread_id, tag_id)
  select t.thread_id, et.id
  from unnest(p_thread_ids) as t(thread_id)
  cross join echo_tags et
  where et.owner_id = owner_uuid
    and et.name_norm = any(norm_names)
    -- verify user owns the thread via RLS (implicit check)
    and exists (
      select 1 from echo_threads eth
      where eth.id = t.thread_id and eth.user_id = owner_uuid
    )
  on conflict (thread_id, tag_id) do nothing;
end;
$$;

-- RPC: echo_tags_remove_bulk - Remove tags from multiple threads atomically

create or replace function public.echo_tags_remove_bulk(p_thread_ids uuid[], p_names text[])
returns void
language sql
security definer
set search_path = public
as $$
  delete from echo_thread_tags ett
  using echo_tags et, echo_threads eth
  where ett.tag_id = et.id
    and ett.thread_id = eth.id
    and ett.thread_id = any(p_thread_ids)
    and eth.user_id = auth.uid()
    and et.owner_id = auth.uid()
    and et.name_norm = any(
      select lower(trim(x)) from unnest(p_names) x where length(trim(x)) >= 1
    );
$$;