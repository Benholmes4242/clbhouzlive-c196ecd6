-- ===========================================================================
-- ONE DEFINITION OF "CIRCLE" (BRIEF_CIRCLE_DEFINITION §6)
--
-- Four definitions of a member's circle were in use. This is the one:
--
--   A member's circle is the set of PERSONAL profiles they follow: rows in
--   public.follows where follower_actor_type AND following_actor_type are both
--   'personal'.
--
-- WHY EACH CLAUSE IS LOAD-BEARING:
--
-- 1. BUSINESS FOLLOWS ARE NOT CIRCLE MEMBERS. `follows` is actor-aware and
--    carries follows of business profiles (94 of 554 rows). Counting them told
--    48 members they had a circle; the pool then queried for people and found
--    none, so those members got the circle branch of every Explore surface with
--    an empty circle behind it.
--
-- 2. A PENDING FRIEND REQUEST IS NOT CONSENT, AND MUST NEVER CONFER CIRCLE
--    MEMBERSHIP. The previous version of the circle CTE unioned
--    public.user_friends with NO STATUS FILTER. Read that as an action a member
--    can take: I send you a friend request; you have not accepted it and have
--    not seen it; my rounds are now on your leaderboard. That is not a
--    definition disagreement, it is an authorisation gap - and it went
--    unnoticed precisely because the board looked populated. 18 members had
--    pending-only rows and no other circle edge, so for those eighteen the
--    ENTIRE circle board was people they never agreed to follow. The status
--    question is why this function no longer reads user_friends at all.
--    Do not put it back.
--
-- 3. user_friends IS NOT A SOURCE OF CIRCLE MEMBERSHIP. Accepted friendships
--    already carry a follow edge, created by
--    public.auto_follow_on_friend_accept on acceptance. The follow table is
--    therefore complete for every friendship between two live members, and
--    reading friendships as well can only add rows the member did not consent
--    to (see 2).
--
-- 4. WHY public.follows AND NOT public.user_follows. They are a bidirectional
--    mirror with named writers on both sides (auto_follow_on_friend_accept plus
--    the mirror triggers, ON CONFLICT DO NOTHING, terminating), so either is
--    trustworthy - honest debt, NOT the un-written denormalised copy pattern
--    banned earlier this week. `follows` is chosen because it is the actor-aware
--    superset and therefore the only table that can STATE, rather than
--    accidentally imply, that business edges are excluded.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.board_pool(p_viewer uuid, p_scope text DEFAULT 'everyone'::text, p_window text DEFAULT '14'::text, p_region_kind text DEFAULT NULL::text, p_region_value text DEFAULT NULL::text, p_courses text DEFAULT 'any'::text, p_course_id uuid DEFAULT NULL::uuid, p_band text DEFAULT 'any'::text, p_competition text DEFAULT 'any'::text)
 RETURNS TABLE(user_id uuid, whs_score_id uuid, play_date date, course_id uuid, course_name text, country text, sub_country text, gross_score integer, course_par integer, net_score integer, stableford_points integer, delta_index numeric, birdies integer, eagles integer, albatrosses integer, holes_in_one integer, clean_card boolean, beat_par boolean, sub_80 boolean, sub_70 boolean, is_competition boolean, hcp_at_time numeric, ok_scope boolean, ok_window boolean, ok_region boolean, ok_courses boolean, ok_band boolean, ok_competition boolean)
 LANGUAGE sql
 STABLE
AS $function$
  with viewer as (
    select up.id,
           coalesce(up.eg_handicap_index, up.manual_handicap_index) as idx,
           up.primary_club_id
    from public.user_profiles up
    where up.id = p_viewer
  ),
  -- THE CIRCLE. See the header comment: personal profiles this member follows,
  -- plus the member. No business edges (they are not people) and no friendship
  -- rows (a pending request is not consent, and an accepted one already has a
  -- follow edge).
  circle as (
    select f.following_actor_id as uid
    from public.follows f
    where f.follower_actor_id    = p_viewer
      and f.follower_actor_type  = 'personal'
      and f.following_actor_type = 'personal'
    union
    select p_viewer
  ),
  played as (
    select distinct g.course_id
    from public.gam_round_stats g
    where g.user_id = p_viewer and g.holes_played = 18 and g.course_id is not null
  ),
  cutoff as (
    select public.board_window_from(p_window) as from_date
  )
  select
    g.user_id, g.whs_score_id, g.play_date,
    g.course_id, g.course_name, c.country, c.sub_country,
    g.gross_score, g.course_par, n.net_score,
    g.stableford_points, g.delta_index, g.birdies,
    g.eagles, g.albatrosses, g.holes_in_one,
    g.clean_card, g.beat_par, g.sub_80, g.sub_70,
    g.is_competition, g.hcp_at_time,

    -- ok_scope
    case p_scope
      when 'circle' then exists (select 1 from circle where circle.uid = g.user_id)
      when 'club'   then g.user_id in (
                          select up.id from public.user_profiles up
                          where up.primary_club_id is not null
                            and up.primary_club_id = (select primary_club_id from viewer)
                        )
      when 'you'    then g.user_id = p_viewer
      else true
    end,

    -- ok_window
    g.play_date >= (select from_date from cutoff),

    -- ok_region. A round with no geography fails a NAMED region and passes
    -- "Everywhere" - it is never silently counted into an area.
    case
      when p_region_kind is null then true
      when p_region_kind = 'country'     then c.country     = p_region_value
      when p_region_kind = 'sub_country' then c.sub_country = p_region_value
      else true
    end,

    -- ok_courses
    case p_courses
      when 'top100' then exists (
        select 1 from public.course_top100_memberships m where m.course_id = g.course_id)
      when 'played' then g.course_id in (select course_id from played)
      when 'one'    then g.course_id = p_course_id
      else true
    end,

    -- ok_band. hcp_at_time is NULL both when absent and when can_view_handicap()
    -- withheld it. A NULL FAILS every named band and is never defaulted.
    case p_band
      when 'any'  then true
      when 'near' then g.hcp_at_time is not null
                     and (select idx from viewer) is not null
                     and abs(g.hcp_at_time - (select idx from viewer)) <= 4.0
      when 'plus' then g.hcp_at_time is not null and g.hcp_at_time <  0
      when 'b0'   then g.hcp_at_time between 0    and 4.9
      when 'b5'   then g.hcp_at_time between 5    and 9.9
      when 'b10'  then g.hcp_at_time between 10   and 14.9
      when 'b15'  then g.hcp_at_time between 15   and 19.9
      when 'b20'  then g.hcp_at_time between 20   and 27.9
      when 'b28'  then g.hcp_at_time >= 28
      else true
    end,


    -- ok_competition. is_competition is fully populated (1927 / 1485, no
    -- nulls), so 'unknown' is not a state this axis has to represent.
    case p_competition
      when 'competition' then g.is_competition is true
      when 'social'      then g.is_competition is false
      else true
    end

  from public.gam_round_stats g
  left join public.golf_courses c on c.id = g.course_id
  left join public.gam_round_net n on n.whs_score_id = g.whs_score_id
  where g.holes_played = 18;
$function$;

-- ===========================================================================
-- THE "PRE-TRIGGER ORPHAN" DOES NOT EXIST. NOTHING IS BACKFILLED.
--
-- The plan was one separate, named INSERT for the single accepted friendship
-- with no follow edge (2 rows, one per direction, out of 100 accepted
-- friendships). That INSERT was written and attempted, and the database refused
-- it:
--
--   ERROR 23503: insert or update on table "follows" violates foreign key
--   constraint "follows_follower_user_fk"
--   DETAIL: Key (follower_actor_id)=(c71f43c4-1fd2-4c75-8970-cc241c4139a2) is
--   not present in table "user_profiles".
--
-- That user id is in NEITHER user_profiles NOR auth.users. It is a DELETED
-- ACCOUNT whose public.user_friends row was never cleaned up. So the friendship
-- lacks a follow edge for the ordinary reason that one of the two people no
-- longer exists - it is not a pre-trigger orphan, and clause 3 above holds with
-- no exception: every accepted friendship between two live members carries its
-- follow edge.
--
-- The dangling friendship row is filed, not deleted. Deleting rows is not this
-- migration's remit, and the circle definition is unaffected by it: a deleted
-- account has no rounds to put on anybody's board.
-- ===========================================================================
