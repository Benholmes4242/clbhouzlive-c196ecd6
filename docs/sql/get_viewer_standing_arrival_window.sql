-- =====================================================================
-- STANDING MOVES TO THE ARRIVAL CLOCK.
--
-- Draft for Ben to run. NOT applied by the agent. No backslash
-- meta-commands: this pastes into the Supabase SQL editor as-is.
--
-- THE FAULT
-- The stream was moved to ARRIVAL-keyed freshness. Standing was left on
-- PLAY DATE. Both overloads of get_viewer_standing build the "then"
-- ranking with `q.play_date <= s.seen_at::date`, so a round that arrived
-- AFTER the viewer's last look still sits in their "before" picture
-- whenever it was PLAYED before it. For Ben, 92 of the 106 rounds that
-- arrived since his stamp have older play dates, so "then" and "now" are
-- the same ranking and every delta is 0 BY CONSTRUCTION.
--
-- THE RULE, NOW SHARED BY THE STREAM AND THIS FUNCTION
-- A round the viewer has not seen yet does not belong in their "before"
-- picture merely because it was played a while ago. A rank card says
-- "this changed since you looked", and ARRIVAL is when it changed for
-- them. PLAY DATE DECIDES THE KICKER; ARRIVAL DECIDES THE WINDOW.
-- Do not re-split these two clocks.
--
-- WHERE ARRIVAL COMES FROM
-- board_pool exposes no arrival column, so arrival is read from
-- public.gam_round_stats.created_at joined on whs_score_id - the same
-- column get_explore_stream keys its lanes on. All 3,557 rows carry both
-- created_at and whs_score_id, but duplicates exist (26 groups), so it is
-- read as a scalar MIN sub-select: a join would multiply "then" rows.
-- Where no stats row exists the round's play date stands in, so an
-- unmapped round is never silently dropped out of "then".
--
-- WHAT DOES NOT CHANGE
-- The pool call, the qualification test, the board vocabulary and sort
-- values, the per-course/per-member collapse and its tiebreak, the field
-- count, the field floor of 2 on the two-argument overload, the row
-- order, the returned columns, security mode, volatility, search_path and
-- grants. Only the "then" window predicate moves.
-- =====================================================================

BEGIN;

DO $guard$
DECLARE
  v1 text; v2 text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname='public' AND p.proname='get_viewer_standing' AND p.pronargs=1;
  SELECT pg_get_functiondef(p.oid) INTO v2 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname='public' AND p.proname='get_viewer_standing' AND p.pronargs=2;

  IF v1 IS NULL THEN RAISE EXCEPTION 'get_viewer_standing(uuid) not found'; END IF;
  IF v2 IS NULL THEN RAISE EXCEPTION 'get_viewer_standing(uuid,text) not found'; END IF;

  RAISE NOTICE 'one-arg md5 % (% bytes)', md5(v1), length(v1);
  RAISE NOTICE 'two-arg md5 % (% bytes)', md5(v2), length(v2);

  -- The chain: these are the bodies this patch was written against.
  IF md5(v1) <> 'b066f64a1d1b6f1299d0378931c3261b'
    THEN RAISE EXCEPTION 'one-arg body is not the expected deployed body (md5 %)', md5(v1); END IF;
  IF md5(v2) <> '21e60a0386a287fb961530163f3e8ae4'
    THEN RAISE EXCEPTION 'two-arg body is not the expected deployed body (md5 %)', md5(v2); END IF;

  IF v1 LIKE '%ARRIVAL DECIDES THE WINDOW%' THEN RAISE EXCEPTION 'already applied'; END IF;
END
$guard$;

-- ---------------------------------------------------------------- one arg
create or replace function public.get_viewer_standing(p_viewer uuid)
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
        -- ARRIVAL DECIDES THE WINDOW, play date decides the kicker. A round
        -- the viewer has not seen yet is not part of their "before" picture
        -- however long ago it was played. Same clock as get_explore_stream.
        and coalesce(
              (select min(g.created_at) from public.gam_round_stats g
                where g.whs_score_id = q.whs_score_id),
              q.play_date::timestamptz
            ) <= s.seen_at
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

-- --------------------------------------------------------------- two args
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
    select m.*,
      case p_board
        when 'net'        then (m.net_score - m.course_par)::numeric
        when 'topar'      then (m.gross_score - m.course_par)::numeric
        when 'stableford' then -m.stableford_points::numeric
        when 'birdies'    then -m.birdies::numeric
        when 'improved'   then m.delta_index
      end as sv
    from matched m
    where p_board in ('net', 'topar', 'stableford', 'birdies', 'improved')
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
        -- ARRIVAL DECIDES THE WINDOW, play date decides the kicker. Same
        -- clock as get_explore_stream and as the one-argument overload.
        and coalesce(
              (select min(g.created_at) from public.gam_round_stats g
                where g.whs_score_id = q.whs_score_id),
              q.play_date::timestamptz
            ) <= s.seen_at
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
    -- THE FLOOR. A field of one is not a contest.
    and f.field_now >= 2
  order by f.last_change desc nulls last, c.name asc;
$function$;

SELECT p.pronargs, p.prosecdef AS security_definer, p.provolatile AS volatility,
       p.proconfig AS search_path, pg_get_userbyid(p.proowner) AS owner,
       md5(pg_get_functiondef(p.oid)) AS new_md5,
       length(pg_get_functiondef(p.oid)) AS new_len
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname='public' AND p.proname='get_viewer_standing'
 ORDER BY p.pronargs;

COMMIT;
