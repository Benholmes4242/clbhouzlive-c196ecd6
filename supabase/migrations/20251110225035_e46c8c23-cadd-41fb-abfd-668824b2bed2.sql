-- Create RPCs for Tag Browser functionality

-- 1. List tags with counts and last used date
create or replace function public.echo_tags_list_with_counts()
returns table (
  name text,
  threads_count bigint,
  last_used_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    t.name,
    count(tt.thread_id) as threads_count,
    max(tt.created_at)   as last_used_at
  from public.echo_tags t
  left join public.echo_thread_tags tt
    on tt.tag_id = t.id
  where t.owner_id = auth.uid()
  group by t.name
  order by threads_count desc nulls last, t.name asc;
$$;

-- 2. Rename (or merge) a tag
create or replace function public.echo_tags_rename(p_old text, p_new text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_old_id uuid;
  v_new_id uuid;
  v_owner  uuid := auth.uid();
begin
  if p_old is null or p_new is null then
    raise exception 'Tag names cannot be null';
  end if;

  p_old := lower(trim(p_old));
  p_new := lower(trim(p_new));

  select id into v_old_id from public.echo_tags where owner_id = v_owner and name_norm = p_old;
  if v_old_id is null then
    raise exception 'Tag "%" not found', p_old;
  end if;

  select id into v_new_id from public.echo_tags where owner_id = v_owner and name_norm = p_new;

  if v_new_id is null then
    -- rename tag row
    update public.echo_tags set name = p_new, name_norm = lower(p_new) where id = v_old_id and owner_id = v_owner;
  else
    -- merge: retarget all thread links to v_new_id, then delete old tag
    -- Use INSERT ... ON CONFLICT DO NOTHING to avoid duplicates
    insert into public.echo_thread_tags (thread_id, tag_id)
    select thread_id, v_new_id
    from public.echo_thread_tags
    where tag_id = v_old_id
    on conflict (thread_id, tag_id) do nothing;
    
    -- Delete old links
    delete from public.echo_thread_tags where tag_id = v_old_id;
    
    -- Delete old tag
    delete from public.echo_tags where id = v_old_id and owner_id = v_owner;
  end if;
end;
$$;

-- 3. Delete a tag everywhere
create or replace function public.echo_tags_delete_everywhere(p_name text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tag_id uuid;
  v_owner  uuid := auth.uid();
begin
  p_name := lower(trim(p_name));
  select id into v_tag_id from public.echo_tags where owner_id = v_owner and name_norm = p_name;
  if v_tag_id is null then
    return;
  end if;
  delete from public.echo_thread_tags where tag_id = v_tag_id;
  delete from public.echo_tags where id = v_tag_id and owner_id = v_owner;
end;
$$;