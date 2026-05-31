create or replace function public.get_player_titles_in_reach(
  p_user_id uuid,
  p_window  text default '90d',
  p_limit   int  default 6
)
returns table (
  course_id      uuid,
  course_name    text,
  hero_image_url text,
  category       text,
  user_rank      int,
  user_value     numeric,
  leader_value   numeric,
  gap            numeric,
  attained_at    timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with viewer as (
    select v.course_id, v.course_name, v.category,
           v.rank as user_rank, v.value as user_value, v.attained_at
    from gam_course_legends_view v
    where v.user_id = p_user_id
      and v.is_current = true
      and v.rank > 1
      and v.category like '%_' || p_window
  ),
  leaders as (
    select l.course_id, l.category, l.value as leader_value
    from gam_course_legends_view l
    where l.is_current = true
      and l.rank = 1
      and l.category like '%_' || p_window
  )
  select
    viewer.course_id,
    viewer.course_name,
    gc.thumbnail_image                       as hero_image_url,
    viewer.category,
    viewer.user_rank,
    viewer.user_value,
    leaders.leader_value,
    abs(viewer.user_value - leaders.leader_value) as gap,
    viewer.attained_at
  from viewer
  join leaders
    on leaders.course_id = viewer.course_id
   and leaders.category  = viewer.category
  left join golf_courses gc on gc.id = viewer.course_id
  order by viewer.user_rank asc, gap asc
  limit p_limit;
$$;

grant execute on function public.get_player_titles_in_reach(uuid, text, int) to authenticated, anon;