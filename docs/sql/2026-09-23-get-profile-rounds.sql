-- get_profile_rounds — rounds for a member's profile Rounds tab, as the VIEWER sees them.
--
-- One gate, in one place: can_view_handicap(auth.uid(), p_user_id). Both halves of
-- the round (gam_round_stats AND whs_scores) are governed by this single check, so
-- a friends-only member seen by a clbhouz friend who is not an England Golf match
-- gets no rows at all — never rounds with silently-null whs_scores columns.
--
-- BRIEF_ROUNDS_TAB_FORM_STRIP_DIFFERENTIAL revision: adds the four differential
-- columns the form strip is built on — handicap_differential (played-to),
-- handicap_index_at_time (the index the member held THAT ROUND, never today's),
-- plus slope_rating and course_rating for provenance.
--
-- Ben runs all SQL by hand. If the earlier 14-column version was already applied,
-- the DROP below clears it; CREATE OR REPLACE alone cannot change the return shape.

DROP FUNCTION IF EXISTS public.get_profile_rounds(uuid);

CREATE FUNCTION public.get_profile_rounds(p_user_id uuid)
RETURNS TABLE (
  whs_score_id            uuid,
  play_date               date,
  course_id               uuid,
  course_name             text,
  course_par              integer,
  gross_score             integer,
  hcp_at_time             numeric,
  is_nine_hole            boolean,
  total_holes             integer,
  course_handicap         integer,
  handicap_differential   numeric,
  handicap_index_at_time  numeric,
  slope_rating            integer,
  course_rating           numeric,
  eagles                  integer,
  albatrosses             integer,
  holes_in_one            integer,
  clean_card              boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- The only gate. Nothing downstream re-checks.
  IF NOT can_view_handicap(auth.uid(), p_user_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    s.whs_score_id,
    s.play_date,
    s.course_id,
    s.course_name,
    s.course_par,
    s.gross_score,
    s.hcp_at_time,
    w.is_nine_hole,
    w.total_holes,
    w.course_handicap,
    w.handicap_differential,
    w.handicap_index_at_time,
    w.slope_rating,
    w.course_rating,
    s.eagles,
    s.albatrosses,
    s.holes_in_one,
    s.clean_card
  FROM public.gam_round_stats s
  LEFT JOIN public.whs_scores w ON w.id = s.whs_score_id
  WHERE s.user_id = p_user_id
  ORDER BY s.play_date DESC, s.created_at DESC
  LIMIT 1000;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_profile_rounds(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_rounds(uuid) TO authenticated;
