-- Bulk tag operations for multiple threads

-- 1. Add tags to many threads
create or replace function public.echo_tags_bulk_add_to_threads(
  p_thread_ids uuid[],
  p_names text[]
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_name  text;
  v_tag_id uuid;
  v_thread uuid;
begin
  if p_thread_ids is null or array_length(p_thread_ids,1) is null then
    return;
  end if;

  foreach v_name in array p_names loop
    v_name := lower(trim(v_name));
    if v_name is null or v_name = '' then continue; end if;

    -- ensure tag exists for owner
    select id into v_tag_id from public.echo_tags where owner_id = v_owner and name_norm = v_name;
    if v_tag_id is null then
      insert into public.echo_tags (owner_id, name) values (v_owner, v_name) returning id into v_tag_id;
    end if;

    -- link each thread
    foreach v_thread in array p_thread_ids loop
      insert into public.echo_thread_tags (thread_id, tag_id)
      select v_thread, v_tag_id
      where exists (select 1 from public.echo_threads t where t.id = v_thread and t.owner_id = v_owner)
      on conflict do nothing;
    end loop;
  end loop;
end;
$$;

-- 2. Remove tags from many threads
create or replace function public.echo_tags_bulk_remove_from_threads(
  p_thread_ids uuid[],
  p_names text[]
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_name  text;
  v_tag_id uuid;
begin
  if p_thread_ids is null or array_length(p_thread_ids,1) is null then
    return;
  end if;

  foreach v_name in array p_names loop
    v_name := lower(trim(v_name));
    if v_name is null or v_name = '' then continue; end if;

    select id into v_tag_id from public.echo_tags where owner_id = v_owner and name_norm = v_name;
    if v_tag_id is null then continue; end if;

    delete from public.echo_thread_tags ett
    using public.echo_threads th
    where ett.tag_id = v_tag_id
      and ett.thread_id = th.id
      and th.owner_id = v_owner
      and ett.thread_id = any(p_thread_ids);
  end loop;
end;
$$;