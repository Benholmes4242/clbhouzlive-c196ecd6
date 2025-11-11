-- Admin Insights RPC for dashboard snapshot
create or replace function echo_admin_insights(p_days int default 30)
returns table (
  conv_total bigint,
  conv_24h bigint,
  users_active bigint,
  shares_active bigint,
  export_count bigint,
  avg_query_ms numeric,
  tags jsonb
)
language sql
security definer
set search_path = public
as $$
  with
  window_dates as (
    select now() - (p_days||' days')::interval as since
  ),
  conv as (
    select count(*)::bigint as total,
           count(*) filter (where created_at >= now() - (p_days||' days')::interval)::bigint as last_n
    from echo_threads
  ),
  active_users as (
    select count(distinct user_id)::bigint as cnt
    from echo_threads
    where updated_at >= (select since from window_dates)
  ),
  shares as (
    select count(*)::bigint as cnt
    from echo_shares
    where revoked_at is null
  ),
  exports as (
    -- Count exports from analytics_events
    select count(*)::bigint as cnt
    from analytics_events
    where name like 'echo_history_export%'
      and created_at >= (select since from window_dates)
  ),
  top_tags as (
    select jsonb_agg(jsonb_build_object('name', t.name, 'count', x.c) order by x.c desc)
    from (
      select tt.tag_id, count(*) as c
      from echo_thread_tags tt
      join echo_threads th on th.id = tt.thread_id
      where th.updated_at >= (select since from window_dates)
      group by tt.tag_id
      order by c desc
      limit 5
    ) x
    join echo_tags t on t.id = x.tag_id
  )
  select
    (select total from conv)           as conv_total,
    (select last_n from conv)          as conv_24h,
    (select cnt from active_users)     as users_active,
    (select cnt from shares)           as shares_active,
    (select cnt from exports)          as export_count,
    0::numeric                          as avg_query_ms,
    coalesce((select * from top_tags), '[]'::jsonb) as tags;
$$;

-- Guard function for admin-only access
create or replace function echo_admin_insights_guard(p_days int default 30)
returns table (
  conv_total bigint,
  conv_24h bigint,
  users_active bigint,
  shares_active bigint,
  export_count bigint,
  avg_query_ms numeric,
  tags jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare 
  ok boolean;
begin
  select is_admin() into ok;
  if not ok then
    raise exception 'Forbidden: Admin access required';
  end if;
  return query select * from echo_admin_insights(p_days);
end $$;

-- Grant execute only to authenticated users (RLS handled by guard)
grant execute on function echo_admin_insights_guard to authenticated;