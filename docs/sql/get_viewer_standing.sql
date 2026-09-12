-- ===========================================================================
-- BRIEF_EXPLORE_MAGAZINE — PHASE B1: get_viewer_standing(p_viewer uuid)
-- DRAFT FOR BEN TO RUN. Nothing in this file has been applied to production.
-- ===========================================================================
--
-- ONE ROW PER COURSE THE VIEWER HAS PLAYED: their rank on that course's
-- LOWEST GROSS board today, and their rank on the same board as it stood at
-- their last look at Discover.
--
-- WHY IT IS BUILT OUT OF board_pool / board_qualifies RATHER THAN OUT OF
-- gam_round_stats DIRECTLY. get_board_page (dumped with pg_get_functiondef on
-- 12 Sep 2026, before a line of this was written) is the live source of the
-- course Champions tab. If this function re-derived "best gross per member"
-- itself, the shelf and the Champions tab would answer the same question with
-- two implementations and would drift the first time either changed. So the
-- three parts that decide a rank are REUSED VERBATIM, not restated:
--
--   1. THE POOL           public.board_pool(..., p_courses => 'played')
--                         — the same 18-hole-only, par-guarded pool, already
--                         restricted to the viewer's played courses.
--   2. THE FLOOR          public.board_qualifies('topar', ...)
--                         — the par 62..80 and non-null gross guard, which
--                         lives there and nowhere else.
--   3. THE COLLAPSE AND THE TIEBREAK
--                         one row per member at their best gross:
--                           row_number() over (partition by user_id
--                             order by sv asc, gross_score asc nulls last,
--                                      play_date desc)
--                         and the RANK ITSELF:
--                           rank() over (order by sv asc)
--                         rank(), not row_number(): TIED MEMBERS SHARE A
--                         POSITION and the next position skips. That is
--                         get_board_page's 'topar' behaviour exactly; it is
--                         copied, not invented.
--
--   sv for the 'topar' board is (gross_score - course_par)::numeric.
--
-- field_now IS get_board_page's pool_members, NOT the count of ranked rows:
--   count(distinct user_id) over MATCHED (i.e. before board_qualifies), which
--   is the figure the board rail reports. Counting the ranked set instead
--   would make the shelf say "of 14" where the Champions tab says "of 18".
--
-- WINDOW: 'all'. board_window_from('all') falls to its else branch (1900-01-01),
--   which is the all-time board the Champions tab shows.
--
-- ID SPACE: gam_round_stats.course_id is the golf_courses id space, not the WHS
--   one. Evidence taken on production 12 Sep 2026:
--     3546 / 3554 gam_round_stats rows join golf_courses on id;
--        0 / 3554 join whs_to_golf_course_map on whs_course_id.
--   So NO bridge through whs_to_golf_course_map is applied here (the brief's
--   §2a bridge sentence describes whs_scores, which this path does not read).
--   board_pool already joins golf_courses on g.course_id for the same reason.
--
-- rank_then — "SINCE YOU LAST LOOKED":
--   the stamp is public.user_surface_last_seen.last_seen_at for surface_key
--   'discover' (the column is last_seen_at, not seen_at). Only rounds with
--   play_date <= that stamp count. NO STAMP MEANS NO REFERENCE: rank_then and
--   delta are NULL and the shelf draws no movement chip. A course whose board
--   had no qualifying round at or before the stamp is also NULL, because the
--   viewer had no position there to move from — that is unresolved, not zero.
--
-- delta = rank_then - rank_now. Positive means the viewer moved UP.
--
-- SECURITY INVOKER, as briefed: board_pool is itself INVOKER and STABLE, and
-- every table read here is already readable by the caller. The function takes
-- p_viewer rather than auth.uid() to match get_board_page's shape; it exposes
-- no row a caller could not read directly.
-- ===========================================================================

create or replace function public.get_viewer_standing(p_viewer uuid)
returns table (
  course_id      uuid,
  course_name    text,
  region         text,
  sub_country    text,
  image_url      text,
  rank_now       integer,
  field_now      integer,
  rank_then      integer,
  delta          integer,
  last_change_at timestamptz,
  board          text
)
language sql
stable
security invoker
set search_path = public
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
  -- ONE ROW PER MEMBER PER COURSE, at their lowest gross. The order clause is
  -- get_board_page's, character for character, with course_id added to the
  -- partition because this function ranks every course at once.
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
    -- THE EXISTING COURSE-IMAGE RESOLUTION: golf_courses.thumbnail_image, the
    -- same column useCourseCardMeta reads. No new join, no course_media pick.
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

-- EXECUTE, not table grants: the function reads through the caller's own
-- privileges (INVOKER) and adds no reach.
grant execute on function public.get_viewer_standing(uuid) to authenticated;
grant execute on function public.get_viewer_standing(uuid) to service_role;
