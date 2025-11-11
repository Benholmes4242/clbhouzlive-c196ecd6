-- KPI period-over-period delta calculation
create or replace function echo_analytics_overview_delta(
  p_from timestamptz,
  p_to timestamptz
) returns table (
  metric text,
  current_value bigint,
  previous_value bigint,
  delta bigint
)
language plpgsql security definer set search_path = public as $$
declare
  v_period_duration interval;
  v_prev_from timestamptz;
  v_prev_to timestamptz;
begin
  perform admin_guard();
  
  -- Calculate period duration and previous period
  v_period_duration := p_to - p_from;
  v_prev_to := p_from;
  v_prev_from := p_from - v_period_duration;
  
  return query
  with curr as (
    select
      count(distinct props->>'thread_id') as threads,
      count(*) filter (where name in ('echo_history_export_started','echo_history_export_bulk_started')) as exports,
      count(*) filter (where name in ('echo_share_created','echo_share_opened_public')) as shares,
      count(distinct user_id) as users
    from analytics_events
    where created_at between p_from and p_to
      and user_id is not null
  ),
  prev as (
    select
      count(distinct props->>'thread_id') as threads,
      count(*) filter (where name in ('echo_history_export_started','echo_history_export_bulk_started')) as exports,
      count(*) filter (where name in ('echo_share_created','echo_share_opened_public')) as shares,
      count(distinct user_id) as users
    from analytics_events
    where created_at between v_prev_from and v_prev_to
      and user_id is not null
  )
  select 'threads'::text, curr.threads::bigint, prev.threads::bigint, (curr.threads - prev.threads)::bigint from curr, prev
  union all
  select 'exports'::text, curr.exports::bigint, prev.exports::bigint, (curr.exports - prev.exports)::bigint from curr, prev
  union all
  select 'shares'::text, curr.shares::bigint, prev.shares::bigint, (curr.shares - prev.shares)::bigint from curr, prev
  union all
  select 'users'::text, curr.users::bigint, prev.users::bigint, (curr.users - prev.users)::bigint from curr, prev;
end $$;