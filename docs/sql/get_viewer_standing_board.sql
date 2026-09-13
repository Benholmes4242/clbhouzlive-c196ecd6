-- =====================================================================
-- get_viewer_standing(p_viewer uuid, p_board text) - THE BOARD SELECTOR
-- BRIEF: "WHERE YOU STAND GETS A BOARD SELECTOR" (Ben's ruling, §3).
--
-- ADDITIVE OVERLOAD, NOT A REPLACEMENT. The one-argument
-- public.get_viewer_standing(uuid) stays exactly as deployed and keeps
-- serving every existing caller unchanged - notably get_explore_stream,
-- which reads standing for the rank consequence cards. This file adds a
-- SECOND function with a distinct signature. p_board deliberately has NO
-- DEFAULT: a default would make the existing one-argument calls ambiguous
-- and every one of them would start failing.
--
-- BUILT ON THE DEPLOYED BODY. The body below was taken verbatim from
-- pg_get_functiondef(public.get_viewer_standing(uuid)) on production (SQL,
-- STABLE, SECURITY INVOKER, search_path=public) and changed in exactly
-- three places, marked BOARD PARAM below:
--   1. the sort value is chosen by board instead of hardcoding gross-to-par
--   2. board_qualifies is asked about p_board instead of 'topar'
--   3. the returned `board` column echoes p_board instead of the literal
-- Nothing else moved: the pool call, the per-course/per-member collapse, the
-- tiebreak order, the "then" stamp, the field count and the row order are
-- byte-for-byte the deployed logic.
--
-- ONLY TWO BOARDS ARE OFFERED: 'net' and 'topar' (lowest gross, to par).
-- Measured on production: net carries a score on 99.3% of qualifying rows and
-- covers the identical 217 courses gross does, while stableford reaches 46% of
-- gross's coverage with a typical field of 2 - which is not a standing. An
-- unknown board raises rather than silently ranking by play date.
--
-- WHY NET SORTS TO PAR. get_board_page's 'net' sort value is
-- (net_score - course_par). Copied here exactly: on a cross-course board a
-- net 68 at par 71 and a net 69 at par 74 are not comparable numbers. If this
-- expression and get_board_page's ever diverge, the shelf and the board the
-- member can open would disagree, which is the one thing this function exists
-- to prevent.
--
-- THE CARDS DO NOT READ THIS SELECTOR - see rankCards.ts. A card is a dated
-- statement about a round that happened; a headline that flips because a
-- dropdown moved stops being a record of anything.
-- =====================================================================

create or replace function public.get_viewer_standing(p_viewer uuid, p_board text)
returns table(
  course_id uuid,
  course_name text,
  region text,
  sub_country text,
  image_url text,
  rank_now integer,
  field_now integer,
  rank_then integer,
  delta integer,
  last_change_at timestamp with time zone,
  board text
)
language sql
stable
set search_path to 'public'
as $function$
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
    -- BOARD PARAM (1 of 3): the sort value per board, copied from
    -- get_board_page. Only the two offered boards exist here.
    select m.*,
      case p_board
        when 'net'   then (m.net_score - m.course_par)::numeric
        when 'topar' then (m.gross_score - m.course_par)::numeric
      end as sv
    from matched m
    -- BOARD PARAM (2 of 3): the floors stay in board_qualifies and nowhere
    -- else, so net inherits the same par guard and completeness guard.
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
    select m.course_id,
           count(distinct m.user_id)::int as field_now,
           max(m.play_date)               as last_change
    from matched m
    group by m.course_id
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
    -- BOARD PARAM (3 of 3): the answer says which board it is, so a client
    -- can never label a net rank as gross.
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

-- Same grants the one-argument function carries. No anon: this is an answer
-- about one signed-in member.
grant execute on function public.get_viewer_standing(uuid, text) to authenticated;
grant execute on function public.get_viewer_standing(uuid, text) to service_role;
