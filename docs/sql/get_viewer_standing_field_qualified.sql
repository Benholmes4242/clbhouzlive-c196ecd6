-- =====================================================================
-- FIX field_now: THE PRINTED "of N" MUST BE THE QUALIFIED COUNT
-- Ben's ruling on the board measurement, SS1. THIS IS A LIVE BUG FIX, not a
-- new feature, and it ships on its own.
--
-- THE FAULT. Both deployed overloads of public.get_viewer_standing compute
-- the field from `matched` - every member with an 18-hole round at the course
-- inside the pool - while the RANK is computed from `qualified`, the members
-- holding a round that clears the board's floor. On net and gross the two
-- populations are nearly identical (the par guard is the only difference), so
-- the figure has been almost right. On a floored board - birdies, stableford,
-- improved - they are not: a member reads "1st of 12" where only 3 members
-- hold a qualifying round. A field that counts a wider population than the
-- ranking is a figure that lies.
--
-- THE FIX. field_now counts the members who QUALIFY on the selected board,
-- read off dedup_now, which is already exactly one qualifying row per member
-- per course. Nothing else moves: the pool call, the collapse, the tiebreak,
-- the "then" stamp, the row order and the returned columns are the deployed
-- logic byte for byte.
--
-- BOTH OVERLOADS ARE FIXED. The one-argument function also feeds the rank
-- consequence cards through get_explore_stream, and their "of N" is the same
-- figure printed in a headline.
--
-- MEASURED ON PRODUCTION BEFORE AND AFTER, for Benjamin Holmes (index 1.3,
-- 243 rounds, 31 courses on this shelf):
--   net    31 courses, field sum 156 -> 154. Two courses move: Bearwood
--          Lakes 4 -> 3, Prince's (Shore, Dunes & Ocean) 6 -> 5. 29 unchanged.
--   gross  identical: 156 -> 154, the same two courses.
--   For the boards SS3 adds, the same members' fields move on nearly every
--   course: birdies avg 7.70 -> 5.20, stableford 8.00 -> 5.67,
--   improved 7.50 -> 5.67. That is the size of the lie this removes.
--
-- REPORTED, NOT CHANGED: last_change is still max(play_date) over `matched`,
-- so a NON-qualifying round still counts as "the board changed" and still
-- drives the row order. That is the same fault class one column over. It is
-- not in the ruling, and fixing it reorders the rail, so it is filed rather
-- than smuggled in here.
--
-- SECURITY INVOKER, SQL, STABLE, search_path=public - as deployed.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1 of 2: the one-argument function (gross, to par). Cards read this.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_viewer_standing(p_viewer uuid)
 RETURNS TABLE(course_id uuid, course_name text, region text, sub_country text, image_url text, rank_now integer, field_now integer, rank_then integer, delta integer, last_change_at timestamp with time zone, board text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with stamp as (
    select s.last_seen_at as seen_at
    from public.user_surface_last_seen s
    where s.user_id = p_viewer
      and s.surface_key = 'discover'
  ),
  pool as (
    select * from public.board_pool(
      p_viewer, 'everyone', 'all', null, null, 'played', null, 'any', 'any')
  ),
  matched as (
    select * from pool
    where ok_scope and ok_window and ok_region and ok_courses and ok_band
      and ok_competition
  ),
  qualified as (
    select m.*, (m.gross_score - m.course_par)::numeric as sv
    from matched m
    where public.board_qualifies('topar', m.gross_score, m.course_par,
            m.net_score, m.stableford_points, m.delta_index, m.birdies,
            m.play_date, m.holes_in_one, m.albatrosses, m.eagles, m.clean_card)
  ),
  dedup_now as (
    select q.* from (
      select q.*,
             row_number() over (
               partition by q.course_id, q.user_id
               order by q.sv asc, q.gross_score asc nulls last, q.play_date desc
             ) as rn
      from qualified q
    ) q
    where q.rn = 1
  ),
  rank_now_cte as (
    select d.*, rank() over (partition by d.course_id order by d.sv asc)::int as pos
    from dedup_now d
  ),
  dedup_then as (
    select q.* from (
      select q.*,
             row_number() over (
               partition by q.course_id, q.user_id
               order by q.sv asc, q.gross_score asc nulls last, q.play_date desc
             ) as rn
      from qualified q
      cross join stamp s
      where s.seen_at is not null
        and q.play_date <= s.seen_at::date
    ) q
    where q.rn = 1
  ),
  rank_then_cte as (
    select d.*, rank() over (partition by d.course_id order by d.sv asc)::int as pos
    from dedup_then d
  ),
  field as (
    -- THE FIX. dedup_now is one QUALIFYING row per member per course, so this
    -- counts the members actually being ranked. last_change is unchanged and
    -- still reads `matched` - see REPORTED, NOT CHANGED in the header.
    select d.course_id,
           count(*)::int as field_now,
           (select max(m.play_date) from matched m where m.course_id = d.course_id) as last_change
    from dedup_now d
    group by d.course_id
  )
  select
    rn.course_id,
    c.name,
    c.region,
    c.sub_country,
    c.thumbnail_image,
    rn.pos,
    f.field_now,
    rt.pos,
    (rt.pos - rn.pos)::int,
    f.last_change::timestamptz,
    'topar'::text
  from rank_now_cte rn
  join field f          on f.course_id = rn.course_id
  join public.golf_courses c on c.id   = rn.course_id
  left join rank_then_cte rt
         on rt.course_id = rn.course_id
        and rt.user_id   = p_viewer
  where rn.user_id = p_viewer
  order by f.last_change desc nulls last, c.name asc;
$function$;

-- ---------------------------------------------------------------------
-- 2 of 2: the two-argument overload (net / gross today). SS3 replaces this
-- one again to add three more boards and the qualified-field floor; this
-- statement is here so the figure is honest even if SS3 is not run.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_viewer_standing(p_viewer uuid, p_board text)
 RETURNS TABLE(course_id uuid, course_name text, region text, sub_country text, image_url text, rank_now integer, field_now integer, rank_then integer, delta integer, last_change_at timestamp with time zone, board text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with stamp as (
    select s.last_seen_at as seen_at
    from public.user_surface_last_seen s
    where s.user_id = p_viewer
      and s.surface_key = 'discover'
  ),
  pool as (
    select * from public.board_pool(
      p_viewer, 'everyone', 'all', null, null, 'played', null, 'any', 'any')
  ),
  matched as (
    select * from pool
    where ok_scope and ok_window and ok_region and ok_courses and ok_band
      and ok_competition
  ),
  qualified as (
    select m.*,
      case p_board
        when 'net'   then (m.net_score - m.course_par)::numeric
        when 'topar' then (m.gross_score - m.course_par)::numeric
      end as sv
    from matched m
    where p_board in ('net', 'topar')
      and public.board_qualifies(p_board, m.gross_score, m.course_par,
            m.net_score, m.stableford_points, m.delta_index, m.birdies,
            m.play_date, m.holes_in_one, m.albatrosses, m.eagles, m.clean_card)
  ),
  dedup_now as (
    select q.* from (
      select q.*,
             row_number() over (
               partition by q.course_id, q.user_id
               order by q.sv asc, q.gross_score asc nulls last, q.play_date desc
             ) as rn
      from qualified q
    ) q
    where q.rn = 1
  ),
  rank_now_cte as (
    select d.*, rank() over (partition by d.course_id order by d.sv asc)::int as pos
    from dedup_now d
  ),
  dedup_then as (
    select q.* from (
      select q.*,
             row_number() over (
               partition by q.course_id, q.user_id
               order by q.sv asc, q.gross_score asc nulls last, q.play_date desc
             ) as rn
      from qualified q
      cross join stamp s
      where s.seen_at is not null
        and q.play_date <= s.seen_at::date
    ) q
    where q.rn = 1
  ),
  rank_then_cte as (
    select d.*, rank() over (partition by d.course_id order by d.sv asc)::int as pos
    from dedup_then d
  ),
  field as (
    select d.course_id,
           count(*)::int as field_now,
           (select max(m.play_date) from matched m where m.course_id = d.course_id) as last_change
    from dedup_now d
    group by d.course_id
  )
  select
    rn.course_id,
    c.name,
    c.region,
    c.sub_country,
    c.thumbnail_image,
    rn.pos,
    f.field_now,
    rt.pos,
    (rt.pos - rn.pos)::int,
    f.last_change::timestamptz,
    p_board::text
  from rank_now_cte rn
  join field f          on f.course_id = rn.course_id
  join public.golf_courses c on c.id   = rn.course_id
  left join rank_then_cte rt
         on rt.course_id = rn.course_id
        and rt.user_id   = p_viewer
  where rn.user_id = p_viewer
  order by f.last_change desc nulls last, c.name asc;
$function$;
