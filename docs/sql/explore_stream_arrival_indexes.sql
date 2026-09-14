-- =====================================================================
-- EXPLORE -- THE 500 IS A TIMEOUT, NOT AN EXCEPTION. THIS IS THE ONLY
-- MISSING INDEX ON THE COLUMN THE RANKER NOW SORTS AND DAMPS BY.
--
-- Draft for Ben to run. NOT applied by the agent. No backslash
-- meta-commands: this pastes into the Supabase SQL editor as-is.
--
-- EVIDENCE
--   PostgREST returned 500 with code 57014, "canceling statement due to
--   statement timeout" (client console, /amateur, repeated). The
--   authenticated role carries statement_timeout=8s; anon carries 3s.
--   57014 is a CANCELLATION, not a body fault: the deployed body of
--   public.get_explore_stream(8 args) is md5 9bcdaf9ad5a26db868576e66a689c93f,
--   45,007 bytes, and its consequence CASE is intact and well-formed after
--   the played_nochange retirement (verified by reading pg_get_functiondef).
--
-- WHY THESE INDEXES
--   The arrival-clock work and the gap damp made gam_round_stats.created_at
--   a RANKING COLUMN: the lane split, the freshness half-life and the
--   play-to-arrival gap all read it, and get_viewer_standing takes
--   min(created_at) per course. gam_round_stats currently has NO index on
--   created_at at all -- every index on it is keyed on play_date or
--   course_id. Under SECURITY INVOKER the ranker also re-reads the table
--   per viewer with RLS applied, so a sequential scan per call is the
--   expected shape of an 8s cancellation.
--
-- NOT MEASURED HERE, STATED PLAINLY: the exact heavy plan node is
-- unverified. The agent cannot execute get_explore_stream or SET ROLE
-- authenticated (42501 both ways), so no authenticated EXPLAIN ANALYZE
-- exists. As postgres, with RLS bypassed, get_viewer_standing runs in
-- 55 ms -- which is why the fault only appears for members.
--
-- SAFE BY CONSTRUCTION: additive indexes only. No function, policy,
-- grant, weight or row is touched. CONCURRENTLY cannot run inside a
-- transaction, so run each statement on its own.
-- =====================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gam_round_stats_created_at
  ON public.gam_round_stats (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gam_round_stats_user_created_at
  ON public.gam_round_stats (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gam_round_stats_course_created_at
  ON public.gam_round_stats (course_id, created_at DESC)
  WHERE course_id IS NOT NULL;

ANALYZE public.gam_round_stats;

-- AFTER RUNNING, confirm with a member's JWT (the function is INVOKER):
--   EXPLAIN (ANALYZE, BUFFERS)
--   SELECT * FROM public.get_explore_stream(auth.uid(), 'all', 'all',
--                                           NULL, 12, NULL, NULL, NULL);
-- Expected: no 57014, and the page returning well inside 8s.
