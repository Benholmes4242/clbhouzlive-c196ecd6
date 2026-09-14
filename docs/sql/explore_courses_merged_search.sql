-- =====================================================================
-- BRIEF_COURSES_MERGED  §6 SEARCH  /  §2 ONE MIXED POOL
-- UNAPPLIED PROPOSAL. Ben's to run. Nothing in the app depends on it:
-- the merged Courses view ships working today (see the report), and this
-- file is the SERVER-SIDE path that would replace two client-side reads
-- with one ranked answer.
-- =====================================================================
--
-- WHAT SHIPPED WITHOUT SQL, AND WHY IT IS HONEST
--
--   Search reads the CANDIDATE INDEX (src/features/explore-magazine/
--   useCourseCandidateIndex.ts): every rated course, every course with a
--   tracked round, and every review with prose - 330 candidate courses
--   and 152 reviews on the production base today. That is the COMPLETE
--   set of anything §8 allows to be a card, so the search does not lie
--   about its own results. It is not a filter over one fetched page.
--
-- WHAT THIS PROPOSAL ADDS THAT THE CLIENT CANNOT HAVE
--
--   1. Courses with NO round and NO rating (23,296 rows in golf_courses)
--      could be matched by NAME. Today they cannot be cards at all, so
--      they are deliberately absent. If Ben wants "Augusta" to answer
--      with a course that nobody here has played or rated, it needs a
--      deliberate treatment, not a silent one - hence a server path and a
--      match_kind column that the client can render differently.
--   2. Ranking. The client orders by the course ladder; the server can
--      order by match quality (name prefix > name contains > place >
--      reviewer > words inside a review).
--   3. Scale. The index is cheap at 330 candidates. It is not the shape
--      to keep if the rated base grows by an order of magnitude.
--
-- SECURITY: SECURITY INVOKER, so RLS decides what the caller may read -
-- the same posture as get_explore_stream. No SECURITY DEFINER here.

CREATE OR REPLACE FUNCTION public.search_explore_courses(
  p_query   text,
  p_limit   integer DEFAULT 40,
  p_offset  integer DEFAULT 0
)
RETURNS TABLE(
  course_id   uuid,
  review_id   uuid,
  match_kind  text,   -- 'name' | 'place' | 'reviewer' | 'words'
  rank        numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  WITH q AS (
    SELECT btrim(coalesce(p_query, '')) AS raw,
           lower(btrim(coalesce(p_query, ''))) AS needle
  ),
  candidate AS (
    -- THE CANDIDATE RULE, §8: neither a tracked round nor a rating is not
    -- a candidate. Kept identical to the client index so the two agree.
    SELECT c.id, c.name, c.region, c.sub_country, c.country
    FROM public.golf_courses c
    WHERE EXISTS (SELECT 1 FROM public.gam_round_stats s
                   WHERE s.course_id = c.id AND s.holes_played = 18)
       OR EXISTS (SELECT 1 FROM public.course_ratings r
                   WHERE r.course_id = c.id AND coalesce(r.is_mock, false) = false)
  ),
  by_name AS (
    SELECT c.id AS course_id, NULL::uuid AS review_id, 'name'::text AS match_kind,
           CASE WHEN lower(c.name) LIKE (SELECT needle FROM q) || '%' THEN 4.0 ELSE 3.0 END AS rank
    FROM candidate c, q
    WHERE length(q.needle) >= 2 AND lower(c.name) LIKE '%' || q.needle || '%'
  ),
  by_place AS (
    SELECT c.id, NULL::uuid, 'place'::text, 2.0
    FROM candidate c, q
    WHERE length(q.needle) >= 2
      AND (lower(coalesce(c.region, '')) LIKE '%' || q.needle || '%'
        OR lower(coalesce(c.sub_country, '')) LIKE '%' || q.needle || '%'
        OR lower(coalesce(c.country, '')) LIKE '%' || q.needle || '%')
  ),
  by_reviewer AS (
    SELECT r.course_id, r.id, 'reviewer'::text, 1.5
    FROM public.course_ratings r
    JOIN public.user_profiles up ON up.id = r.user_id, q
    WHERE length(q.needle) >= 2
      AND coalesce(r.is_mock, false) = false
      AND btrim(coalesce(r.review, '')) <> ''
      AND (lower(coalesce(up.display_name, '')) LIKE '%' || q.needle || '%'
        OR lower(coalesce(up.username, ''))     LIKE '%' || q.needle || '%')
  ),
  by_words AS (
    -- THE ONE §6 CALLS OUT: "heathland", "links", "windy" are how a
    -- golfer actually looks for a course.
    SELECT r.course_id, r.id, 'words'::text, 1.0
    FROM public.course_ratings r, q
    WHERE length(q.needle) >= 2
      AND coalesce(r.is_mock, false) = false
      AND btrim(coalesce(r.review, '')) <> ''
      AND lower(r.review) LIKE '%' || q.needle || '%'
  ),
  unioned AS (
    SELECT * FROM by_name
    UNION ALL SELECT * FROM by_place
    UNION ALL SELECT * FROM by_reviewer
    UNION ALL SELECT * FROM by_words
  )
  SELECT DISTINCT ON (course_id, review_id) course_id, review_id, match_kind, rank
  FROM unioned
  ORDER BY course_id, review_id, rank DESC
  OFFSET greatest(coalesce(p_offset, 0), 0)
  LIMIT least(greatest(coalesce(p_limit, 40), 1), 200);
$function$;

GRANT EXECUTE ON FUNCTION public.search_explore_courses(text, integer, integer)
  TO authenticated, service_role;

-- =====================================================================
-- §2 THE MERGED POOL, ALSO UNAPPLIED
--
-- get_explore_stream's pool is keyed by view:
--
--   SELECT * FROM courses WHERE v_view = 'courses'
--
-- The merged view would be one line:
--
--   SELECT * FROM courses WHERE v_view = 'courses'
--   UNION ALL
--   SELECT * FROM reviews WHERE v_view IN ('all', 'reviews', 'courses')
--
-- and the cadence key for 'courses' would become
--
--   'course:' || coalesce(t.course_event, 'reviewed')
--
-- so a run of reviews cannot repeat any more than a run of stable course
-- cards can. UNTIL THAT RUNS the client asks the RPC for BOTH pools and
-- interleaves them by the score the RPC itself assigned - composition,
-- not re-ranking. That is deliberate and is reported, not hidden.
-- =====================================================================
