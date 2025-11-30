-- Create get_top100_season_stats RPC for season tracking
create or replace function public.get_top100_season_stats(
  target_user_id uuid,
  season_start timestamptz default date_trunc('year', now()),
  season_end   timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first_plays_season int;
  v_lists_touched      int;
  v_new_by_list        jsonb;
  v_first_play_dates   timestamptz[];
  v_lifetime_total     int;
begin
  -- All Top 100 activity for this user
  with user_top100 as (
    select
      uca.course_id,
      min(uca.last_played_at) as first_played_at
    from user_course_activity uca
    where uca.user_id = target_user_id
      and uca.is_top100 = true
    group by uca.course_id
  ),
  season_first_plays as (
    select *
    from user_top100
    where first_played_at >= season_start
      and first_played_at <  season_end
  ),
  season_with_lists as (
    select
      s.course_id,
      s.first_played_at,
      tl.slug as list_slug,
      tl.id   as list_id
    from season_first_plays s
    join course_top100_memberships ctm
      on ctm.course_id = s.course_id
    join top100_lists tl
      on tl.id = ctm.list_id
    where tl.is_active = true
  )
  select
    -- number of new Top 100 courses first played in this season
    (select count(*) from season_first_plays),
    -- distinct lists touched in this season
    (select count(distinct list_id) from season_with_lists),
    -- new courses per list, as { "gb-i-top-100": 3, "usa-top-100": 1, ... }
    coalesce((
      select jsonb_object_agg(list_slug, course_count)
      from (
        select list_slug, count(distinct course_id) as course_count
        from season_with_lists
        group by list_slug
      ) x
    ), '{}'::jsonb),
    -- all first-play timestamps (for streak calc on client)
    coalesce((
      select array_agg(first_played_at order by first_played_at)
      from season_first_plays
    ), '{}'),
    -- lifetime distinct Top 100 courses
    (
      select count(distinct course_id)
      from user_course_activity
      where user_id = target_user_id
        and is_top100 = true
    )
  into
    v_first_plays_season,
    v_lists_touched,
    v_new_by_list,
    v_first_play_dates,
    v_lifetime_total;

  return jsonb_build_object(
    'new_top100_this_season',   coalesce(v_first_plays_season, 0),
    'lists_touched_this_season', coalesce(v_lists_touched, 0),
    'new_by_list',              coalesce(v_new_by_list, '{}'::jsonb),
    'first_play_dates',         coalesce(v_first_play_dates, '{}'),
    'lifetime_total_top100',    coalesce(v_lifetime_total, 0)
  );
end;
$$;

grant execute on function public.get_top100_season_stats to authenticated;