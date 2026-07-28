-- Align the Discover toughest / friendliest rails with the Courses page.
-- Both now rank from public.stat_browse_base (the same view the Courses stat
-- browse reads), so the set and the order match. No minimum-rounds filter is
-- applied; the app flags low-sample courses as EARLY DATA instead.
-- The p_min_rounds argument is retained for caller compatibility only.

CREATE OR REPLACE FUNCTION public.get_notable_difficult_courses(p_min_rounds integer DEFAULT 1, p_limit integer DEFAULT 8)
 RETURNS TABLE(course_id uuid, course_name text, course_region text, course_country text, avg_over_par numeric, hardest_hole_no integer, hardest_hole_par integer, hardest_hole_si integer, hardest_avg_to_par numeric, total_rounds integer, thumbnail_image text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with base as (
    select b.course_id, b.name, b.region, b.country,
           b.avg_to_par, b.rounds, b.image_url
    from public.stat_browse_base b
    where b.avg_to_par is not null
    order by b.avg_to_par desc
    limit p_limit
  ),
  mapping as (
    select distinct on (golf_course_id)
           golf_course_id, whs_course_id
    from public.whs_to_golf_course_map
    where golf_course_id in (select course_id from base)
      and (reviewed_at is not null or match_confidence >= 0.70)
    order by golf_course_id,
             (reviewed_at is not null) desc,
             match_confidence desc nulls last
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
      and ws.course_id in (select whs_course_id from mapping)
    group by ws.course_id, wsh.hole_no, wsh.par, wsh.stroke_index
  ),
  hardest as (
    select whs_course_id, hole_no, par, stroke_index, avg_to_par
    from hole_stats
    where rn = 1
  )
  select
    b.course_id,
    b.name                 as course_name,
    b.region               as course_region,
    b.country              as course_country,
    b.avg_to_par           as avg_over_par,
    h.hole_no              as hardest_hole_no,
    h.par                  as hardest_hole_par,
    h.stroke_index         as hardest_hole_si,
    round(h.avg_to_par, 2) as hardest_avg_to_par,
    b.rounds               as total_rounds,
    b.image_url            as thumbnail_image
  from base b
  left join mapping m on m.golf_course_id = b.course_id
  left join hardest h on h.whs_course_id = m.whs_course_id
  order by b.avg_to_par desc;
$function$;

CREATE OR REPLACE FUNCTION public.get_notable_friendly_courses(p_min_rounds integer DEFAULT 1, p_limit integer DEFAULT 8)
 RETURNS TABLE(course_id uuid, course_name text, course_region text, course_country text, avg_over_par numeric, hardest_hole_no integer, hardest_hole_par integer, hardest_hole_si integer, hardest_avg_to_par numeric, total_rounds integer, thumbnail_image text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with base as (
    select b.course_id, b.name, b.region, b.country,
           b.avg_to_par, b.rounds, b.image_url
    from public.stat_browse_base b
    where b.avg_to_par is not null
    order by b.avg_to_par asc
    limit p_limit
  ),
  mapping as (
    select distinct on (golf_course_id)
           golf_course_id, whs_course_id
    from public.whs_to_golf_course_map
    where golf_course_id in (select course_id from base)
      and (reviewed_at is not null or match_confidence >= 0.70)
    order by golf_course_id,
             (reviewed_at is not null) desc,
             match_confidence desc nulls last
  ),
  hole_stats as (
    select ws.course_id as whs_course_id,
           wsh.hole_no,
           wsh.par,
           wsh.stroke_index,
           avg(coalesce(wsh.actual_gross, wsh.adjusted_gross) - wsh.par)::numeric as avg_to_par,
           row_number() over (
             partition by ws.course_id
             order by avg(coalesce(wsh.actual_gross, wsh.adjusted_gross) - wsh.par) asc nulls last
           ) as rn
    from public.whs_score_holes wsh
    join public.whs_scores ws on ws.id = wsh.score_id
    where wsh.par is not null
      and (wsh.actual_gross is not null or wsh.adjusted_gross is not null)
      and ws.course_id in (select whs_course_id from mapping)
    group by ws.course_id, wsh.hole_no, wsh.par, wsh.stroke_index
  ),
  hardest as (
    select whs_course_id, hole_no, par, stroke_index, avg_to_par
    from hole_stats
    where rn = 1
  )
  select
    b.course_id,
    b.name                 as course_name,
    b.region               as course_region,
    b.country              as course_country,
    b.avg_to_par           as avg_over_par,
    h.hole_no              as hardest_hole_no,
    h.par                  as hardest_hole_par,
    h.stroke_index         as hardest_hole_si,
    round(h.avg_to_par, 2) as hardest_avg_to_par,
    b.rounds               as total_rounds,
    b.image_url            as thumbnail_image
  from base b
  left join mapping m on m.golf_course_id = b.course_id
  left join hardest h on h.whs_course_id = m.whs_course_id
  order by b.avg_to_par asc;
$function$;
