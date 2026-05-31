create or replace function public.get_notable_difficult_courses(
  p_min_rounds int default 30,
  p_limit      int default 8
)
returns table (
  course_id          uuid,
  course_name        text,
  course_region      text,
  course_country     text,
  avg_over_par       numeric,
  hardest_hole_no    int,
  hardest_hole_par   int,
  hardest_hole_si    int,
  hardest_avg_to_par numeric,
  total_rounds       int
)
language sql
stable
security definer
set search_path = public
as $$
  with mapping as (
    select distinct on (whs_course_id)
           whs_course_id, golf_course_id
    from public.whs_to_golf_course_map
    where reviewed_at is not null or match_confidence >= 0.70
    order by whs_course_id,
             (reviewed_at is not null) desc,
             match_confidence desc nulls last
  ),
  course_par as (
    -- Most recent round with full hole data per WHS course gives canonical par.
    select distinct on (ws.course_id)
           ws.course_id as whs_course_id,
           (select sum(par) from public.whs_score_holes where score_id = ws.id) as par
    from public.whs_scores ws
    where ws.hole_by_hole_fetched = true
    order by ws.course_id, ws.play_date desc
  ),
  course_stats as (
    select ws.course_id as whs_course_id,
           count(*)::int as total_rounds,
           round(avg(ws.adjusted_gross - cp.par)::numeric, 1) as avg_over_par
    from public.whs_scores ws
    join course_par cp on cp.whs_course_id = ws.course_id
    where ws.adjusted_gross is not null
      and cp.par is not null
    group by ws.course_id
  ),
  hole_stats as (
    select ws.course_id as whs_course_id,
           wsh.hole_no,
           wsh.par,
           wsh.stroke_index,
           avg(coalesce(wsh.actual_gross, wsh.adjusted_gross) - wsh.par)::numeric as avg_to_par,
           row_number() over (
             partition by ws.course_id
             order by avg(coalesce(wsh.actual_gross, wsh.adjusted_gross) - wsh.par) desc nulls last
           ) as rn
    from public.whs_score_holes wsh
    join public.whs_scores ws on ws.id = wsh.score_id
    where wsh.par is not null
      and (wsh.actual_gross is not null or wsh.adjusted_gross is not null)
    group by ws.course_id, wsh.hole_no, wsh.par, wsh.stroke_index
  ),
  hardest as (
    select whs_course_id, hole_no, par, stroke_index, avg_to_par
    from hole_stats
    where rn = 1
  )
  select
    m.golf_course_id                            as course_id,
    gc.name                                     as course_name,
    gc.region                                   as course_region,
    gc.country                                  as course_country,
    cs.avg_over_par,
    h.hole_no                                   as hardest_hole_no,
    h.par                                       as hardest_hole_par,
    h.stroke_index                              as hardest_hole_si,
    round(h.avg_to_par, 2)                      as hardest_avg_to_par,
    cs.total_rounds
  from course_stats cs
  join mapping m              on m.whs_course_id = cs.whs_course_id
  join public.golf_courses gc on gc.id = m.golf_course_id
  left join hardest h         on h.whs_course_id = cs.whs_course_id
  where cs.total_rounds >= p_min_rounds
    and cs.avg_over_par is not null
  order by cs.avg_over_par desc
  limit p_limit;
$$;

grant execute on function public.get_notable_difficult_courses(int, int) to authenticated, anon;