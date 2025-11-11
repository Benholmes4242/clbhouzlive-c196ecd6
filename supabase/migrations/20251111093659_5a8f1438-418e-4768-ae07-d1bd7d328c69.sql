-- Analytics Dashboard: Indexes and RPCs for Echo History analytics

-- Indexes for fast filtering on analytics_events
create index if not exists analytics_events_created_at_idx on analytics_events (created_at desc);
create index if not exists analytics_events_name_idx on analytics_events (name);
create index if not exists analytics_events_user_id_idx on analytics_events (user_id);
create index if not exists analytics_events_props_thread_id_idx on analytics_events ((props->>'thread_id'));
create index if not exists analytics_events_props_tag_idx on analytics_events ((props->>'tag'));

-- Admin guard helper
create or replace function admin_guard() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception 'Access denied. Admin privileges required.';
  end if;
end $$;

-- 1. Overview KPIs (guarded version with explicit return type)
create or replace function echo_analytics_overview_guarded(
  p_from timestamptz, 
  p_to timestamptz, 
  p_event text default null, 
  p_user uuid default null, 
  p_tag text default null
) returns table (
  total_threads bigint,
  total_exports bigint,
  total_shares bigint,
  avg_latency_ms numeric,
  active_users bigint
)
language plpgsql security definer set search_path = public as $$
begin
  perform admin_guard();
  return query
  select
    coalesce((
      select count(distinct props->>'thread_id')
      from analytics_events
      where created_at between p_from and p_to
        and props->>'thread_id' is not null
        and (p_event is null or name = p_event)
        and (p_user  is null or user_id = p_user)
        and (p_tag   is null or props->>'tag' = p_tag)
    ),0) as total_threads,
    coalesce((
      select count(*) from analytics_events
      where name in ('echo_history_export_started','echo_history_export_bulk_started')
        and created_at between p_from and p_to
        and (p_user is null or user_id = p_user)
        and (p_tag  is null or props->>'tag' = p_tag)
    ),0) as total_exports,
    coalesce((
      select count(*) from analytics_events
      where name in ('echo_share_created','echo_share_opened_public')
        and created_at between p_from and p_to
        and (p_user is null or user_id = p_user)
        and (p_tag  is null or props->>'tag' = p_tag)
    ),0) as total_shares,
    (
      select avg((props->>'latency_ms')::numeric)
      from analytics_events
      where name in ('echo_history_delete_hard','echo_history_bulk_delete_hard')
        and created_at between p_from and p_to
        and props->>'latency_ms' is not null
        and (p_user is null or user_id = p_user)
        and (p_tag  is null or props->>'tag' = p_tag)
    ) as avg_latency_ms,
    coalesce((
      select count(distinct user_id)
      from analytics_events
      where created_at between p_from and p_to
        and user_id is not null
        and (p_event is null or name = p_event)
        and (p_tag   is null or props->>'tag' = p_tag)
    ),0) as active_users;
end $$;

-- 2. Time-series by day (guarded version)
create or replace function echo_analytics_timeseries_guarded(
  p_from timestamptz, 
  p_to timestamptz, 
  p_event text default null, 
  p_user uuid default null, 
  p_tag text default null
) returns table (day date, event text, count bigint)
language plpgsql security definer set search_path = public as $$
begin
  perform admin_guard();
  return query
  select
    date_trunc('day', created_at)::date as day,
    name as event,
    count(*)::bigint
  from analytics_events
  where created_at between p_from and p_to
    and (p_event is null or name = p_event)
    and (p_user  is null or user_id = p_user)
    and (p_tag   is null or props->>'tag' = p_tag)
  group by 1,2
  order by 1 asc, 2 asc;
end $$;

-- 3. Top tags (guarded version)
create or replace function echo_analytics_top_tags_guarded(
  p_from timestamptz, 
  p_to timestamptz, 
  p_user uuid default null
) returns table (tag text, uses bigint, last_used_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  perform admin_guard();
  return query
  select
    props->>'tag' as tag,
    count(*)::bigint as uses,
    max(created_at) as last_used_at
  from analytics_events
  where created_at between p_from and p_to
    and props->>'tag' is not null
    and (p_user is null or user_id = p_user)
  group by props->>'tag'
  order by uses desc
  limit 25;
end $$;

-- 4. Export formats breakdown (guarded version)
create or replace function echo_analytics_export_formats_guarded(
  p_from timestamptz, 
  p_to timestamptz
) returns table (format text, count bigint)
language plpgsql security definer set search_path = public as $$
begin
  perform admin_guard();
  return query
  select
    coalesce(props->>'format','unknown') as format,
    count(*)::bigint
  from analytics_events
  where name in ('echo_history_export_started','echo_history_export_bulk_started')
    and created_at between p_from and p_to
  group by 1
  order by 2 desc;
end $$;

-- 5. Most opened threads (guarded version)
create or replace function echo_analytics_top_threads_guarded(
  p_from timestamptz, 
  p_to timestamptz
) returns table (thread_id uuid, opens bigint, last_open_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  perform admin_guard();
  return query
  select
    (props->>'thread_id')::uuid as thread_id,
    count(*)::bigint as opens,
    max(created_at) as last_open_at
  from analytics_events
  where (name = 'echo_history_open_full' or name = 'echo_history_open_inline')
    and created_at between p_from and p_to
    and props->>'thread_id' is not null
  group by 1
  order by opens desc
  limit 20;
end $$;