-- =====================================================================
-- "WHERE YOU STAND" GAINS FIVE BOARDS
-- Ben's rulings on the board measurement, SS2 and SS3. RUN AFTER
-- docs/sql/get_viewer_standing_field_qualified.sql (SS1) - this file assumes
-- the honest field and keeps it.
--
-- FIVE BOARDS: net (default), topar (gross), stableford, birdies, improved.
-- DROPPED, MEASURED: ace, albatross and clean_card - 5 aces, 1 albatross and
-- 15 bogey-free rounds in 3,557 rounds is a coincidence, not a standing.
-- DROPPED, ARGUED: recent. "1st most recent" is a coordinate wearing a rank's
-- clothes: it is a date order, and every member is 1st on it the day they play.
--
-- THE SHELF KEEPS BOARD VOCABULARY (SS2). These boards rank ROUNDS - a
-- member's best single round at the course. gam_course_legends ranks CAREERS -
-- a member's total at the course. Both are legitimate and they are NOT the
-- same idea. No cumulative per-course sort value is added here: that would be
-- a second implementation of Champions' logic in a different function, and the
-- two would drift. One definition per idea. The CLIENT LABELS say which
-- meaning is on screen ("Most birdies in a round", never "Most birdies").
--
-- FLOOR: MINIMUM QUALIFIED FIELD OF 2, matching CROWN_MIN_OTHERS in
-- src/features/champions/fieldGate.ts. One other member is a contest; a field
-- of one is not, and "1st of 1" was the real complaint. The floor is applied
-- to the QUALIFIED field, which is the only field this function now reports.
--
-- THE ONE-ARGUMENT FUNCTION IS NOT TOUCHED HERE. It feeds the rank consequence
-- cards through get_explore_stream; putting a field floor on it would change
-- which cards are emitted, which is a separate decision about the cards.
--
-- SORT VALUES ARE COPIED FROM get_board_page VERBATIM (stableford and birdies
-- negated so ascending still means better, improved sorting the raw delta so
-- the biggest cut leads). If these ever diverge from get_board_page the shelf
-- and the board a member can open would disagree, which is the single thing
-- this function exists to prevent. THE FLOORS STAY IN board_qualifies.
--
-- SECURITY INVOKER, SQL, STABLE, search_path=public - as deployed.
-- =====================================================================

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
    -- THE FLOOR. A field of one is not a contest.
    and f.field_now >= 2
  order by f.last_change desc nulls last, c.name asc;
$function$;

-- ---------------------------------------------------------------------
-- WHICH BOARDS THIS MEMBER ACTUALLY HAS (SS3: no greyed options).
-- The dropdown offers only boards where the member holds at least one course
-- with a qualified field of 2 or more. A disabled row is a promise the app
-- cannot keep, so the row is not drawn at all. One read answers for all five
-- boards; without it the client would have to call the standing function five
-- times to find out what to offer.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_viewer_standing_boards(p_viewer uuid)
 RETURNS TABLE(board text, courses integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with boards as (
    select unnest(array['net','topar','stableford','birdies','improved']) as board
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
    select b.board, m.*
    from matched m
    cross join boards b
    where public.board_qualifies(b.board, m.gross_score, m.course_par,
            m.net_score, m.stableford_points, m.delta_index, m.birdies,
            m.play_date, m.holes_in_one, m.albatrosses, m.eagles, m.clean_card)
  ),
  per_course as (
    select q.board, q.course_id,
           count(distinct q.user_id)::int as field_now,
           bool_or(q.user_id = p_viewer)  as viewer_in
    from qualified q
    group by q.board, q.course_id
  )
  select b.board,
         coalesce((
           select count(*)::int from per_course p
           where p.board = b.board and p.viewer_in and p.field_now >= 2
         ), 0)
  from boards b
  order by b.board;
$function$;

GRANT EXECUTE ON FUNCTION public.get_viewer_standing_boards(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_viewer_standing_boards(uuid) TO service_role;
