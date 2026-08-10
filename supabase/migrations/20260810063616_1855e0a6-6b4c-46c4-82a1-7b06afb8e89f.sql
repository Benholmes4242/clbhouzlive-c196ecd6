-- get_platform_reach() aggregates three tables. gam_round_stats is RLS-guarded
-- (own rounds / friends / publicly-visible scores only), so a STABLE INVOKER
-- function returned 0 rounds for anon and a personal figure for authenticated -
-- not the platform total the business empty state claims. SECURITY DEFINER is
-- safe here: the function takes no arguments and returns six COUNT(*) values,
-- so no row-level data can leak through it.
CREATE OR REPLACE FUNCTION public.get_platform_reach()
 RETURNS TABLE(courses_total bigint, courses_delta bigint, rounds_total bigint, rounds_delta bigint, reviews_total bigint, reviews_delta bigint)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    -- COURSES: the catalogue a business would be found in. No soft-delete or
    -- published flag exists on this table, so every row counts.
    (SELECT COUNT(*) FROM golf_courses),
    (SELECT COUNT(*) FROM golf_courses gc
      WHERE gc.created_at > now() - INTERVAL '30 days'),

    -- ROUNDS: 18-hole rounds tracked. The activity figure.
    -- NOTE play_date, not played_at.
    (SELECT COUNT(*) FROM gam_round_stats grs
      WHERE grs.holes_played = 18),
    (SELECT COUNT(*) FROM gam_round_stats grs
      WHERE grs.holes_played = 18
        AND grs.play_date > (now() - INTERVAL '30 days')),

    -- REVIEWS: real ratings only. is_mock rows must NOT inflate a figure shown
    -- to a prospective customer.
    (SELECT COUNT(*) FROM course_ratings cr
      WHERE cr.rating IS NOT NULL
        AND COALESCE(cr.is_mock, false) = false),
    (SELECT COUNT(*) FROM course_ratings cr
      WHERE cr.rating IS NOT NULL
        AND COALESCE(cr.is_mock, false) = false
        AND cr.created_at > now() - INTERVAL '30 days');
$function$;

GRANT EXECUTE ON FUNCTION public.get_platform_reach() TO anon, authenticated, service_role;