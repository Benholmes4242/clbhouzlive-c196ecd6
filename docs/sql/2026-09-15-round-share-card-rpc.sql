-- =====================================================================
-- ROUND SHARE CARD - THE ONE ANONYMOUS READ A CRAWLER IS ALLOWED
-- 2026-09-15. DRAFT - NOT APPLIED. Ben runs this.
--
-- WHY THIS FILE EXISTS (reported, not assumed): the link-preview Functions run
-- with the ANON key only, and gam_round_stats has NO anon policy at all - its
-- three SELECT policies are granted to `authenticated`. Verified live: an anon
-- PostgREST read of gam_round_stats returns [] for every row. So an OG card for
-- /round/:id cannot be built the way /courses and /profile are, from anon table
-- reads. It needs one narrow, security-definer read that returns ONLY the
-- fields a share card prints, and ONLY for a round that is already publicly
-- visible.
--
-- PRIVACY IS THE SAME PREDICATE THE APP USES: whs_score_publicly_visible(),
-- which already mirrors can_view_handicap's guards (profile public, not
-- suspended, not deleted, handicap_visibility = 'public', eg_visible). A
-- private round, a friends-only handicap or a deleted account returns NO ROW,
-- and the Function then serves the generic clbhouz card. The score never
-- crosses.
--
-- NOTHING ELSE IS EXPOSED: no handicap index, no differential, no hole data,
-- no member id.
--
-- Until this is applied, functions/round/[whsScoreId].js gets nothing back and
-- serves the generic card. It fails closed by construction.
-- =====================================================================

BEGIN;

DO $guard$
BEGIN
  IF to_regprocedure('public.round_share_card(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'ALREADY APPLIED: public.round_share_card(uuid) exists';
  END IF;
  IF to_regprocedure('public.whs_score_publicly_visible(uuid)') IS NULL THEN
    RAISE EXCEPTION 'CHAIN BROKEN: public.whs_score_publicly_visible(uuid) is missing';
  END IF;
END
$guard$;

CREATE FUNCTION public.round_share_card(p_score_id uuid)
RETURNS TABLE (
  player_name  text,
  gross_score  integer,
  course_par   integer,
  play_date    date,
  course_name  text,
  course_image text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    COALESCE(up.display_name, up.username)             AS player_name,
    g.gross_score::integer                             AS gross_score,
    g.course_par::integer                              AS course_par,
    g.play_date                                        AS play_date,
    gc.name                                            AS course_name,
    gc.thumbnail_image                                 AS course_image
  FROM public.gam_round_stats g
  JOIN public.user_profiles up ON up.id = g.user_id
  LEFT JOIN public.golf_courses gc ON gc.id = g.course_id
  WHERE g.whs_score_id = p_score_id
    AND public.whs_score_publicly_visible(p_score_id)
    AND up.deleted_at IS NULL
    AND COALESCE(up.is_suspended, false) = false
    AND COALESCE(up.is_public, true) = true
  LIMIT 1
$function$;

REVOKE ALL ON FUNCTION public.round_share_card(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.round_share_card(uuid) TO anon, authenticated, service_role;

DO $verify$
DECLARE v_def text;
BEGIN
  SELECT pg_get_functiondef(to_regprocedure('public.round_share_card(uuid)')) INTO v_def;
  IF v_def IS NULL OR v_def NOT LIKE '%whs_score_publicly_visible%' THEN
    RAISE EXCEPTION 'VERIFY FAILED: round_share_card is missing its visibility gate';
  END IF;
  IF NOT has_function_privilege('anon', to_regprocedure('public.round_share_card(uuid)'), 'EXECUTE') THEN
    RAISE EXCEPTION 'VERIFY FAILED: anon cannot execute round_share_card';
  END IF;
  RAISE NOTICE 'verified public.round_share_card(uuid) md5=%', md5(v_def);
END
$verify$;

COMMIT;
