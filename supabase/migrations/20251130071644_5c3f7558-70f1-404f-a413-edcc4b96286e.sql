-- Create RPC to get Top 100 course insights for a specific course
create or replace function get_top100_course_insights(
  target_course_id uuid,
  target_user_id uuid
)
returns jsonb
language plpgsql
as $$
declare
  result jsonb;
begin
  -- Top 100 memberships for this course
  with memberships as (
    select
      m.list_id,
      l.slug as list_slug,
      l.name as list_name,
      l.short_label,
      m.rank
    from course_top100_memberships m
    join top100_lists l on l.id = m.list_id
    where m.course_id = target_course_id
  ),
  user_activity as (
    select
      count(*) as total_rounds,
      min(played_at) as first_played_at,
      max(played_at) as last_played_at
    from user_courses
    where user_id = target_user_id
      and course_id = target_course_id
      and played = true
  ),
  community_activity as (
    select
      count(*) as total_rounds,
      count(distinct user_id) as unique_players
    from user_courses
    where course_id = target_course_id
      and played = true
  ),
  ratings as (
    select
      avg(rating)::numeric(4,2) as avg_rating,
      max(case when user_id = target_user_id then rating end) as user_rating
    from course_ratings
    where course_id = target_course_id
  )
  select jsonb_build_object(
    'course_id', target_course_id,
    'list_memberships', coalesce(
      (select jsonb_agg(jsonb_build_object(
        'list_slug', list_slug,
        'list_name', list_name,
        'short_label', short_label,
        'rank', rank
      )) from memberships),
      '[]'::jsonb
    ),
    'user_has_played', coalesce((select total_rounds > 0 from user_activity), false),
    'user_round_count', coalesce((select total_rounds from user_activity), 0),
    'user_last_played_at', (select last_played_at from user_activity),
    'unique_players', coalesce((select unique_players from community_activity), 0),
    'total_rounds', coalesce((select total_rounds from community_activity), 0),
    'avg_rating', (select avg_rating from ratings),
    'user_rating', (select user_rating from ratings)
  )
  into result;

  return result;
end;
$$;