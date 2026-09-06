DROP FUNCTION IF EXISTS public.get_board_courses(uuid, text, text, text, text, text, uuid, text, text, integer);

CREATE OR REPLACE FUNCTION public.get_board_courses(
  p_viewer uuid,
  p_scope text DEFAULT 'everyone'::text,
  p_window text DEFAULT '14'::text,
  p_region_kind text DEFAULT NULL::text,
  p_region_value text DEFAULT NULL::text,
  p_courses text DEFAULT 'any'::text,
  p_course_id uuid DEFAULT NULL::uuid,
  p_band text DEFAULT 'any'::text,
  p_competition text DEFAULT 'any'::text,
  p_limit integer DEFAULT 6,
  p_sort text DEFAULT 'played'::text
)
RETURNS TABLE(
  course_id uuid,
  name text,
  area text,
  thumbnail_image text,
  rounds bigint,
  members bigint,
  plays_to numeric,
  prev_rounds bigint,
  low_gross integer,
  low_to_par integer,
  low_by text,
  eagle_rounds bigint,
  is_new boolean,
  total_courses bigint,
  rating numeric,
  rating_count bigint
)
LANGUAGE sql
STABLE
AS $function$
  with edge as (
    select public.board_window_from(p_window)          as cur_from,
           (p_window in ('14','30','90','year'))       as bounded
  ),
  bounds as (
    select e.cur_from, e.bounded,
      case when e.bounded
           then e.cur_from - ((current_date - e.cur_from) + 1) end as prev_from,
      case when e.bounded then e.cur_from end                      as prev_to
    from edge e
  ),
  pool as (
    select p.* from public.board_pool(
      p_viewer, p_scope, 'all', p_region_kind, p_region_value,
      p_courses, p_course_id, p_band, p_competition) p
    where p.ok_scope and p.ok_region and p.ok_courses and p.ok_band and p.ok_competition
      and p.course_id is not null
  ),
  agg as (
    select
      pl.course_id,
      count(*) filter (where pl.play_date >= (select cur_from from bounds))            as rounds,
      count(distinct pl.user_id) filter (where pl.play_date >= (select cur_from from bounds)) as members,
      avg(pl.gross_score - pl.course_par) filter (
        where pl.play_date >= (select cur_from from bounds)
          and pl.gross_score is not null and pl.course_par between 62 and 80)          as plays_to,
      case when (select bounded from bounds) then count(*) filter (
        where pl.play_date >= (select prev_from from bounds)
          and pl.play_date <  (select prev_to   from bounds)) end                      as prev_rounds,
      min(pl.play_date)                                                                as first_ever,
      (array_agg(pl.user_id order by (pl.gross_score - pl.course_par) asc, pl.play_date desc)
         filter (where pl.play_date >= (select cur_from from bounds)
                   and pl.gross_score is not null
                   and pl.course_par between 62 and 80))[1]                            as low_user,
      (array_agg(pl.gross_score order by (pl.gross_score - pl.course_par) asc, pl.play_date desc)
         filter (where pl.play_date >= (select cur_from from bounds)
                   and pl.gross_score is not null
                   and pl.course_par between 62 and 80))[1]                            as low_gross,
      (array_agg(pl.gross_score - pl.course_par order by (pl.gross_score - pl.course_par) asc, pl.play_date desc)
         filter (where pl.play_date >= (select cur_from from bounds)
                   and pl.gross_score is not null
                   and pl.course_par between 62 and 80))[1]                            as low_to_par,
      count(*) filter (where pl.play_date >= (select cur_from from bounds)
                         and coalesce(pl.eagles, 0) > 0)                               as eagle_rounds
    from pool pl
    group by pl.course_id
  ),
  kept as (
    select a.*, c.name, coalesce(c.region, c.sub_country) as area_name, c.thumbnail_image
    from agg a
    join public.golf_courses c on c.id = a.course_id
    where a.rounds > 0
  ),
  fin as (
    select
      k.course_id, k.name, k.area_name, k.thumbnail_image,
      k.rounds, k.members, round(k.plays_to, 1) as plays_to,
      k.prev_rounds, k.low_gross, k.low_to_par,
      lu.display_name as low_by, k.eagle_rounds,
      case when (select bounded from bounds)
           then k.first_ever >= (select cur_from from bounds)
           else false end                       as is_new,
      count(*) over ()                          as total_courses,
      rt.rating, rt.rating_count
    from kept k
    left join public.user_profiles lu on lu.id = k.low_user
    left join lateral (
      select round(avg(cr.rating)::numeric, 2) as rating, count(*) as rating_count
      from public.course_ratings cr
      where cr.course_id = k.course_id
        and cr.rating is not null
        and coalesce(cr.is_mock, false) = false
    ) rt on true
  )
  -- THE LIMIT SELECTS ON THE SAME AXIS IT ORDERS ON: each board's own key leads,
  -- so a board never ranks the survivors of a most-played cut.
  select f.course_id, f.name, f.area_name, f.thumbnail_image,
         f.rounds, f.members, f.plays_to, f.prev_rounds,
         f.low_gross, f.low_to_par, f.low_by, f.eagle_rounds,
         f.is_new, f.total_courses, f.rating, f.rating_count
  from fin f
  order by
    case when p_sort = 'hardest' then f.plays_to end desc nulls last,
    case when p_sort = 'easiest' then f.plays_to end asc  nulls last,
    case when p_sort = 'low'     then f.low_to_par end asc nulls last,
    case when p_sort = 'new'     then (case when f.is_new then 0 else 1 end) end asc,
    case when p_sort = 'new'     then f.rounds end desc nulls last,
    case when p_sort = 'rated'   then f.rating end desc nulls last,
    case when p_sort = 'rated'   then f.rating_count end desc nulls last,
    f.rounds desc, f.members desc, f.name
  limit p_limit;
$function$;

GRANT EXECUTE ON FUNCTION public.get_board_courses(uuid, text, text, text, text, text, uuid, text, text, integer, text) TO anon, authenticated, service_role;