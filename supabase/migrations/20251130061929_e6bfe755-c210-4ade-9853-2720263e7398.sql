-- Create RPC for Top 100 Course Leaderboard
create or replace function public.get_top100_course_leaderboard(
  scope_param text,
  time_range_param text,
  limit_param int,
  offset_param int
)
returns table (
  course_id uuid,
  course_name text,
  country text,
  sub_country text,
  thumbnail_url text,
  list_slug text,
  times_played int,
  avg_rating numeric
)
language plpgsql
as $$
declare
  from_date timestamptz;
  list_ids uuid[];
begin
  -- Time window
  if time_range_param = 'this_year' then
    from_date := date_trunc('year', now());
  elsif time_range_param = 'this_month' then
    from_date := date_trunc('month', now());
  else
    from_date := null;
  end if;

  -- List filter
  if scope_param = 'worldwide' then
    select array_agg(id) into list_ids
    from top100_lists
    where is_active = true;
  else
    select array_agg(id) into list_ids
    from top100_lists
    where is_active = true
      and slug = scope_param;
  end if;

  if list_ids is null or array_length(list_ids, 1) = 0 then
    return;
  end if;

  return query
  select
    gc.id as course_id,
    gc.name as course_name,
    gc.country,
    gc.sub_country,
    gc.thumbnail_image as thumbnail_url,
    t.slug as list_slug,
    count(distinct uca.user_id)::int as times_played,
    avg(cr.rating)::numeric as avg_rating
  from user_course_activity uca
  join course_top100_memberships ctm
    on ctm.course_id = uca.course_id
   and ctm.list_id = any(list_ids)
  join top100_lists t
    on t.id = ctm.list_id
  join golf_courses gc
    on gc.id = uca.course_id
  left join course_ratings cr
    on cr.course_id = gc.id
  where uca.is_top100 = true
    and (from_date is null or uca.last_played_at >= from_date)
  group by gc.id, gc.name, gc.country, gc.sub_country, gc.thumbnail_image, t.slug
  order by times_played desc, avg_rating desc nulls last, gc.name asc
  limit limit_param
  offset offset_param;
end;
$$;

-- Grant execute permissions
grant execute on function public.get_top100_course_leaderboard to authenticated;