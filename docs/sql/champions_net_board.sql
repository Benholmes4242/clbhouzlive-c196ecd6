-- =====================================================================
-- CHAMPIONS GAINS A NET BOARD (BRIEF_STANDING_TAP §2b). Ben runs this.
--
-- THE GAP: get_course_legends serves gam_course_legends, which carries
-- lowest_gross, best_stableford, most_birdies, most_eagles, most_aces,
-- most_albatrosses, most_rounds, best_score_diff and lowest_gross_women.
-- THERE IS NO NET BOARD. The standing shelf defaults to NET, so a member
-- tapping a Net tile arrived at a tab that could not show the board they came
-- from.
--
-- HOW PARITY WITH get_viewer_standing IS GUARANTEED - the only property that
-- matters here, because two surfaces stating different ranks for the same
-- board is worse than the missing board:
--
--   1. NO SECOND IMPLEMENTATION OF THE POOL. This function calls the SAME
--      public.board_pool and the SAME public.board_qualifies('net', ...) that
--      get_viewer_standing calls, with the same ok_* conjunction. It scopes
--      with p_courses => 'one' instead of 'played', which selects the same
--      rows for the course in question - 'played' is only the viewer's course
--      set, never a row filter within a course.
--   2. THE SORT VALUE IS THE SAME EXPRESSION, CHARACTER FOR CHARACTER:
--        (net_score - course_par)::numeric, ascending.
--   3. THE SAME COLLAPSE: one row per (course_id, user_id), row_number over
--      sv asc, gross_score asc nulls last, play_date desc.
--   4. THE SAME TIEBREAK AND RANK FUNCTION: rank() over (order by sv asc), so
--      equal net-to-par shares a position on both surfaces.
--   5. THE SAME QUALIFIED FIELD: board_qualifies owns the floors, and the
--      field is the count of collapsed qualified members.
--
-- If these two functions must ever change, they change together: the shelf and
-- the board a member opens from it cannot be allowed to drift.
--
-- WHAT DELIBERATELY DIFFERS, AND WHY:
--   - THE FIELD FLOOR OF 2 IS NOT APPLIED HERE. It is a rule about which
--     COURSES the shelf offers ("1st of 1 is not a standing"), not about how a
--     board ranks. A member who opens a course directly sees its board as it
--     is. Ranks are unaffected either way.
--   - rank_30d / delta are computed against a 30-DAY-AGO board, matching
--     get_course_legends' own movement column. The SHELF's delta is measured
--     from the member's last Discover visit - a different question, already
--     stated as such on that surface.
--
-- SHAPE: identical to get_course_legends' RETURNS TABLE, so the client merges
-- the rows into the same board machinery with no second row type. The category
-- is the new literal 'lowest_net_all_time'.
--
-- PRIVACY: the same champions_visibility rule as get_course_legends -
-- everyone, friends-only via are_friends, or self.
--
-- SECURITY DEFINER, STABLE, search_path pinned - as get_course_legends is.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_course_net_board(
  p_course_id uuid,
  p_viewer_id uuid DEFAULT auth.uid()
)
 RETURNS TABLE(category text, rank integer, user_id uuid, user_display_name text,
               user_photo_url text, user_home_club text, value numeric,
               attained_at timestamp with time zone, is_self boolean,
               total_count_in_category integer, rank_30d integer, delta integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  with pool as (
    -- SAME PRIMITIVE, SAME ARGUMENTS, scoped to this one course.
    select * from public.board_pool(
      p_viewer_id, 'everyone', 'all', null, null, 'one', p_course_id, 'any', 'any')
  ),
  matched as (
    select * from pool
    where ok_scope and ok_window and ok_region and ok_courses and ok_band
      and ok_competition
  ),
  qualified as (
    select m.*, (m.net_score - m.course_par)::numeric as sv
    from matched m
    where public.board_qualifies('net', m.gross_score, m.course_par,
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
    select d.*, rank() over (order by d.sv asc)::int as pos
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
      where q.play_date <= (now() - interval '30 days')::date
    ) q
    where q.rn = 1
  ),
  rank_then_cte as (
    select d.*, rank() over (order by d.sv asc)::int as pos
    from dedup_then d
  ),
  visible as (
    select rn.*, rt.pos as pos_then,
           up.display_name, up.profile_photo_url, up.home_club,
           up.champions_visibility
    from rank_now_cte rn
    join public.user_profiles up on up.id = rn.user_id
    left join rank_then_cte rt   on rt.user_id = rn.user_id
    where rn.user_id = p_viewer_id
       or coalesce(up.champions_visibility, 'everyone') = 'everyone'
       or (up.champions_visibility = 'friends'
           and public.are_friends(p_viewer_id, rn.user_id))
  )
  select
    'lowest_net_all_time'::text,
    v.pos,
    v.user_id,
    v.display_name,
    v.profile_photo_url,
    v.home_club,
    -- THE FIGURE IS THE NET SCORE, not net-to-par: the shelf ranks on
    -- net-to-par and displays the net score, and the two surfaces must show
    -- the same number as well as the same order.
    v.net_score::numeric,
    v.play_date::timestamptz,
    (v.user_id = p_viewer_id),
    (select count(*)::int from visible),
    v.pos_then,
    case when v.pos_then is null then null else (v.pos_then - v.pos) end
  from visible v
  order by v.pos asc, v.display_name asc;
$function$;

GRANT EXECUTE ON FUNCTION public.get_course_net_board(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_course_net_board(uuid, uuid) TO service_role;

-- ---------------------------------------------------------------------
-- PARITY CHECK to run after applying, for any course the shelf offers. The two
-- result sets must be identical on (user, rank).
--
--   select rank, user_id from public.get_course_net_board('<course>', '<viewer>');
--   select rank_now from public.get_viewer_standing('<viewer>', 'net')
--   where course_id = '<course>';
-- ---------------------------------------------------------------------
