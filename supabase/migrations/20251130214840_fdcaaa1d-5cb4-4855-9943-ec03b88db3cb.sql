-- Phase 1: Switch Top 100 progress to "rated courses" (not played)

-- 1) Create view: source of truth for Top 100 progress
--    "courses where the user has submitted an overall rating"
create or replace view public.user_top100_rated_courses
as
select
  cr.user_id,
  ctm.course_id,
  min(cr.created_at) as first_rated_at,
  max(cr.created_at) as last_rated_at
from public.course_ratings cr
join public.course_top100_memberships ctm
  on ctm.course_id = cr.course_id
where cr.rating is not null
group by cr.user_id, ctm.course_id;

-- 2) Rewrite get_top100_progress_for_user to use the new view
create or replace function public.get_top100_progress_for_user(
  target_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to public
as $$
declare
  result jsonb;
begin
  -- rated = all Top 100 courses this user has actually RATED
  with rated as (
    select
      urc.course_id,
      urc.first_rated_at,
      urc.last_rated_at,
      ctm.list_id
    from public.user_top100_rated_courses urc
    join public.course_top100_memberships ctm
      on ctm.course_id = urc.course_id
    where urc.user_id = target_user_id
  ),
  per_list as (
    select
      l.id   as list_id,
      l.slug as list_slug,
      l.name as list_name,
      count(distinct ctm.course_id)         as total_in_list,
      count(distinct rated.course_id)       as played_in_list
    from public.top100_lists l
    left join public.course_top100_memberships ctm
      on ctm.list_id = l.id
    left join rated
      on rated.course_id = ctm.course_id
    where l.is_active = true
    group by l.id, l.slug, l.name
  ),
  totals as (
    select
      count(distinct rated.course_id) as total_rated,
      count(distinct rated.list_id)   as regions_count
    from rated
  ),
  recent as (
    select
      r.course_id,
      max(r.last_rated_at) as last_rated_at
    from rated r
    group by r.course_id
    order by last_rated_at desc
    limit 5
  )
  select jsonb_build_object(
    'user_id', target_user_id,

    -- NEW canonical field name
    'total_top100_rated', coalesce((select total_rated    from totals), 0),

    -- BACK-COMPAT: keep the old name so the existing frontend doesn't break
    'total_played_top100', coalesce((select total_rated   from totals), 0),

    'regions_count',      coalesce((select regions_count  from totals), 0),

    'lists', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'listId',   list_id,
          'listSlug', list_slug,
          'listName', list_name,
          'played',   played_in_list,
          'total',    total_in_list
        )
        order by list_slug
      )
      from per_list
    ), '[]'::jsonb),

    'recent_courses', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'course_id',      course_id,
          'last_rated_at',  last_rated_at
        )
        order by last_rated_at desc
      )
      from recent
    ), '[]'::jsonb)
  )
  into result;

  return result;
end;
$$;