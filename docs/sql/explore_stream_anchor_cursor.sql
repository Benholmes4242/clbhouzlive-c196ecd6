-- ============================================================================
-- ANCHOR get_explore_stream's CURSOR IN TIME
--
-- APPLIED 15 Sep 2026, deployed md5 e1ee958dd62fc7ea8ef71dc954563e12.
-- Verified: now_count 1, volatility 's', anchor + seen anchor + both cursor
-- keys present; page 1 x page 2 = 12 x 12 rows, overlap 0; member-role timing
-- 830.7 ms / 142,713 buffers before, 831.6 ms / 142,691 buffers after.
-- Any future patch to get_explore_stream must assert that md5 and the
-- v_anchor fingerprint.
--
-- Ben runs this as postgres. The patch block (BEGIN ... COMMIT) and each
-- VERIFY query below are SEPARATE runs in the SQL editor.
--
-- RULE FOR FUTURE PATCHES OF THIS SHAPE: an injected comment must never
-- contain a string the patch counts. The first run of this file aborted on
-- "expected exactly 1 now() after the patch, found 2" because the site-2
-- comment contained the literal text "now()"; the count picked it up.
--
-- WHY. The keyset is (q.sc < v_cur_s OR (q.sc = v_cur_s AND q.cid > v_cur_i)),
-- but sc is not stable between calls:
--   * freshness decays from now() on every call, so a row served just above the
--     page-1 boundary falls below it and is served again on page 2;
--   * is_seen reads the LIVE public.user_surface_last_seen stamp, and Explore
--     writes that stamp on visibilitychange, so backgrounding the app between
--     pages flips page-1 rows to seen, halves their consequence and ring terms
--     and pushes them below the boundary;
--   * the lane split and the candidate windows also read now(), so the pool
--     itself moves between pages.
-- The result is the duplicate round dedupeStream.ts reports.
--
-- FIX. Every page of one stream is scored at the moment page 1 was scored,
-- against the seen stamp page 1 saw. Page 1 (null cursor, or a cursor without
-- 'at') anchors; later pages reuse the anchor the cursor carries. Pull to
-- refresh and a new session start with a null cursor and so get a fresh
-- anchor - intended.
--
-- WHAT IT DOES NOT CHANGE. Weights, cadence, caps, lanes, the deferred carry,
-- the keyset itself, grants, volatility, signature.
--
-- DEPLOYED BODY THIS PATCH WAS BUILT ON
--   pg_get_functiondef md5 = 0d432d4e7221eb14aeb49742f46b692c  (45660 bytes)
--   now() occurrences      = 8
--   user_surface_last_seen = 1 read (the stamp CTE)
--
-- CHAIN GUARD. Every accepted patch in docs/sql that touched this function is
-- asserted present before anything is rebuilt, by one distinctive string each:
--   explore_stream_gap_damp.sql               -> c_gap_half
--   explore_stream_record_floor_author_cap.sql-> is_record_shown, c_auth_cap
--   (config floor)                            -> gap_damp_floor
--   explore_stream_relax_cadence.sql          -> ADJACENCY IS A GUARANTEE TOO
--   explore_stream_retire_standing_claims.sql -> A STANDING CLAIM REQUIRES A
--                                                CHANGE, AND A NEWS LANE
--   explore_stream_retire_played_nochange.sql -> THEN 'played_nochange' and
--                                                THEN 'rank_hold' are ABSENT
--                                                (that patch removed them)
--   explore_stream_scores_cadence_author.sql  -> scores:CONSEQUENCE:AUTHOR
--   explore_stream_field_join.sql             -> field AS MATERIALIZED
-- If any assertion fails the transaction aborts and nothing changes.
--
-- RERUN GUARD. v_anchor. A second run aborts.
--
-- Every replacement asserts its exact expected hit count before the rebuilt
-- definition is executed. No backslash meta-commands: this file is plain SQL.
-- ============================================================================

BEGIN;

DO $patch$
DECLARE
  c_md5 constant text := '0d432d4e7221eb14aeb49742f46b692c';
  v_src  text;
  v_new  text;
  v_from text;
  v_to   text;
  v_n    int;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_src
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

  IF v_src IS NULL THEN
    RAISE EXCEPTION 'public.get_explore_stream(8 args) not found';
  END IF;

  RAISE NOTICE 'built on md5 % (% bytes)', md5(v_src), length(v_src);

  IF md5(v_src) <> c_md5 THEN
    RAISE EXCEPTION 'chain guard: deployed body is %, expected % - the body moved since this draft was written; re-draft rather than patch blind',
      md5(v_src), c_md5;
  END IF;

  -- ---- chain: every accepted patch must be present -------------------------
  IF v_src NOT LIKE '%c_gap_half%'       THEN RAISE EXCEPTION 'deployed body predates the gap damp'; END IF;
  IF v_src NOT LIKE '%gap_damp_floor%'   THEN RAISE EXCEPTION 'deployed body predates the gap damp floor'; END IF;
  IF v_src NOT LIKE '%is_record_shown%'  THEN RAISE EXCEPTION 'deployed body predates the record floor'; END IF;
  IF v_src NOT LIKE '%c_auth_cap%'       THEN RAISE EXCEPTION 'deployed body predates the author cap'; END IF;
  IF v_src NOT LIKE '%ADJACENCY IS A GUARANTEE TOO%'
    THEN RAISE EXCEPTION 'deployed body predates the relaxed cadence'; END IF;
  IF v_src NOT LIKE '%A STANDING CLAIM REQUIRES A CHANGE, AND A NEWS LANE%'
    THEN RAISE EXCEPTION 'deployed body predates the standing-claim retirement'; END IF;
  IF v_src LIKE '%THEN ''played_nochange''%'
    THEN RAISE EXCEPTION 'deployed body predates the played_nochange retirement'; END IF;
  IF v_src LIKE '%THEN ''rank_hold''%'
    THEN RAISE EXCEPTION 'deployed body predates the rank_hold retirement'; END IF;
  IF v_src NOT LIKE '%scores:CONSEQUENCE:AUTHOR%'
    THEN RAISE EXCEPTION 'deployed body predates the scores cadence author rule'; END IF;
  IF v_src NOT LIKE '%field AS MATERIALIZED%'
    THEN RAISE EXCEPTION 'deployed body predates the field join'; END IF;

  -- ---- rerun guard ---------------------------------------------------------
  IF v_src LIKE '%v_anchor%' THEN
    RAISE EXCEPTION 'already applied: v_anchor is present';
  END IF;

  -- ---- pre-count now() -----------------------------------------------------
  v_n := (length(v_src) - length(replace(v_src, 'now()', ''))) / 5;
  IF v_n <> 8 THEN
    RAISE EXCEPTION 'expected 8 now() occurrences, found %', v_n;
  END IF;

  v_new := v_src;

  -- =========================================================================
  -- 1. DECLARE the anchors.
  -- =========================================================================
  v_from := '  v_out      jsonb := ''[]''::jsonb;' || E'\n' || 'BEGIN';
  v_to   := '  v_out      jsonb := ''[]''::jsonb;' || E'\n'
         || '  -- ONE STREAM IS SCORED AT ONE MOMENT. Page 1 anchors the clock and the' || E'\n'
         || '  -- seen stamp; every later page reuses what the cursor carries, so a row' || E'\n'
         || '  -- cannot decay or turn seen across a page seam and be served twice.' || E'\n'
         || '  v_anchor      timestamptz;' || E'\n'
         || '  v_seen_anchor timestamptz;' || E'\n'
         || 'BEGIN';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'site 1 (declare): expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  -- =========================================================================
  -- 2. Anchor the clock at the very top of the body, before any read.
  -- =========================================================================
  v_from := 'BEGIN' || E'\n' || '  SELECT' || E'\n'
         || '    coalesce(max(value) FILTER (WHERE key = ''w_consequence''),  6),';
  v_to   := 'BEGIN' || E'\n'
         || '  -- The ONLY clock read left in this body. A cursor that carries ''at''' || E'\n'
         || '  -- pins the page to the moment page 1 was scored.' || E'\n'
         || '  v_anchor := coalesce((p_cursor ->> ''at'')::timestamptz, now());' || E'\n'
         || E'\n'
         || '  SELECT' || E'\n'
         || '    coalesce(max(value) FILTER (WHERE key = ''w_consequence''),  6),';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'site 2 (anchor init): expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  -- =========================================================================
  -- 3. Anchor the seen stamp. Presence is tested with ? so a JSON null counts
  --    as present: a first-page viewer with no stamp stores null, and later
  --    pages must KEEP null rather than read a stamp written since.
  -- =========================================================================
  v_from := '  v_view  := lower(coalesce(nullif(btrim(p_view),  ''''), ''all''));';
  v_to   := '  -- SEEN IS ANCHORED TOO. Explore writes the discover stamp on' || E'\n'
         || '  -- visibilitychange, so a live read would flip page-1 rows to seen between' || E'\n'
         || '  -- pages. ? (not ->>) so a stored JSON null is still "present".' || E'\n'
         || '  IF p_cursor ? ''seen'' THEN' || E'\n'
         || '    v_seen_anchor := (p_cursor ->> ''seen'')::timestamptz;' || E'\n'
         || '  ELSE' || E'\n'
         || '    SELECT s.last_seen_at INTO v_seen_anchor' || E'\n'
         || '      FROM public.user_surface_last_seen s' || E'\n'
         || '     WHERE s.user_id = p_viewer AND s.surface_key = ''discover'';' || E'\n'
         || '  END IF;' || E'\n'
         || E'\n'
         || '  v_view  := lower(coalesce(nullif(btrim(p_view),  ''''), ''all''));';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'site 3 (seen anchor): expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  -- The stamp CTE stops reading the table and serves the anchored value, so
  -- every consumer of (SELECT last_seen_at FROM stamp) is anchored unchanged.
  v_from := '    WITH stamp AS (' || E'\n'
         || '      SELECT s.last_seen_at FROM public.user_surface_last_seen s' || E'\n'
         || '      WHERE s.user_id = p_viewer AND s.surface_key = ''discover''' || E'\n'
         || '    ),';
  v_to   := '    WITH stamp AS (' || E'\n'
         || '      -- Anchored above; the table is read at most once per stream, on page 1.' || E'\n'
         || '      SELECT v_seen_anchor AS last_seen_at' || E'\n'
         || '    ),';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'site 4 (stamp CTE): expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  IF v_new LIKE '%public.user_surface_last_seen%' AND
     (length(v_new) - length(replace(v_new, 'public.user_surface_last_seen', ''))) / 29 <> 1 THEN
    RAISE EXCEPTION 'expected exactly 1 stamp read (the anchored one), found %',
      (length(v_new) - length(replace(v_new, 'public.user_surface_last_seen', ''))) / 29;
  END IF;

  -- =========================================================================
  -- 5. Every remaining now() becomes v_anchor: the two candidate windows, the
  --    story publication window, the lane split and the freshness decay
  --    (twice, two now() each).
  -- =========================================================================
  v_from := 'AND r.created_at >= now() - interval ''30 days''';
  v_to   := 'AND r.created_at >= v_anchor - interval ''30 days''';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'site 5a (ratings burst window): expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  v_from := 'AND g.play_date >= (now() - interval ''30 days'')::date';
  v_to   := 'AND g.play_date >= (v_anchor - interval ''30 days'')::date';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'site 5b (recent low window): expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  v_from := 'WHERE s.published_at IS NOT NULL AND s.published_at <= now()';
  v_to   := 'WHERE s.published_at IS NOT NULL AND s.published_at <= v_anchor';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'site 5c (story window): expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  v_from := 'AND p.arrived_at < now() - (c_news || '' days'')::interval THEN ''backlog''';
  v_to   := 'AND p.arrived_at < v_anchor - (c_news || '' days'')::interval THEN ''backlog''';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'site 5d (lane split): expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  v_from := 'extract(epoch FROM (now() - coalesce(s.arrived_at, now())))';
  v_to   := 'extract(epoch FROM (v_anchor - coalesce(s.arrived_at, v_anchor)))';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 2 THEN RAISE EXCEPTION 'site 5e (freshness decay): expected 2 hits, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  -- Exactly one now() may remain: the coalesce that seeds the anchor.
  v_n := (length(v_new) - length(replace(v_new, 'now()', ''))) / 5;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'expected exactly 1 now() after the patch (the anchor seed), found %', v_n;
  END IF;
  IF v_new NOT LIKE '%coalesce((p_cursor ->> ''at'')::timestamptz, now())%' THEN
    RAISE EXCEPTION 'the surviving now() is not the anchor seed';
  END IF;

  -- =========================================================================
  -- 6. next_cursor carries the anchors. The NULL end-of-stream branch is
  --    untouched.
  -- =========================================================================
  v_from := 'ELSE jsonb_build_object(''s'', v_last_s, ''i'', v_last_i,';
  v_to   := 'ELSE jsonb_build_object(''s'', v_last_s, ''i'', v_last_i,' || E'\n'
         || '                ''at'', v_anchor, ''seen'', v_seen_anchor,';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'site 6 (cursor build): expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  -- ---- nothing else moved -------------------------------------------------
  IF v_new NOT LIKE '%c_auth_cap%'
     OR v_new NOT LIKE '%is_record_shown%'
     OR v_new NOT LIKE '%c_gap_half%'
     OR v_new NOT LIKE '%ADJACENCY IS A GUARANTEE TOO%'
     OR v_new NOT LIKE '%scores:CONSEQUENCE:AUTHOR%'
     OR v_new NOT LIKE '%field AS MATERIALIZED%' THEN
    RAISE EXCEPTION 'a chain feature went missing during the rebuild - refusing';
  END IF;

  EXECUTE v_new;

  RAISE NOTICE 'anchored cursor applied; new md5 %', md5(v_new);
END
$patch$;

COMMIT;

-- ============================================================================
-- VERIFY (run as postgres, after the patch)
-- ============================================================================

-- V1. Shape of the deployed body.
SELECT md5(pg_get_functiondef(p.oid))                                      AS new_md5,
       pg_get_functiondef(p.oid) LIKE '%v_anchor%'                         AS has_anchor,
       pg_get_functiondef(p.oid) LIKE '%v_seen_anchor%'                     AS has_seen_anchor,
       (length(pg_get_functiondef(p.oid))
        - length(replace(pg_get_functiondef(p.oid), 'now()', ''))) / 5      AS now_count,   -- must be 1
       pg_get_functiondef(p.oid) LIKE '%''at'', v_anchor%'                  AS cursor_has_at,
       pg_get_functiondef(p.oid) LIKE '%''seen'', v_seen_anchor%'           AS cursor_has_seen,
       p.provolatile                                                        AS volatility   -- must stay 's'
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

-- V2. NO OVERLAP between page 1 and page 2, and the cursor carries the anchors.
-- The viewer is resolved by email, never by a pasted uuid.
WITH me AS (
  SELECT id FROM auth.users WHERE email = 'benjamin@clbhouz.co.uk'
),
p1 AS (
  SELECT * FROM me, public.get_explore_stream(me.id, 'all', 'world', NULL, 12) s
),
cur AS (
  SELECT (SELECT next_cursor FROM p1 WHERE next_cursor IS NOT NULL LIMIT 1) AS c
),
p2 AS (
  SELECT * FROM me, cur, public.get_explore_stream(me.id, 'all', 'world', cur.c, 12) s
)
SELECT (SELECT count(*) FROM p1)                                        AS page1_rows,
       (SELECT count(*) FROM p2)                                        AS page2_rows,
       (SELECT count(*) FROM p1 JOIN p2 USING (id))                     AS overlap,      -- must be 0
       (SELECT c ? 'at'   FROM cur)                                     AS cursor_has_at,
       (SELECT c ? 'seen' FROM cur)                                     AS cursor_has_seen,
       (SELECT c ->> 'at' FROM cur)                                     AS anchored_at;

-- V3. PAGE 2 USES THE CURSOR'S SEEN VALUE, NOT THE TABLE.
-- Left: page 2 with the cursor exactly as served. Right: the same cursor with
-- 'seen' forced to now(). Compare row by row on the id column:
--   * seen must be identical wherever the row's arrival is BEFORE the original
--     anchored stamp (those rows were already seen and stay seen);
--   * rows that arrived between the original stamp and now() flip to seen only
--     in the forced run - which is the proof that the cursor value, and not the
--     live table, decided it.
-- If every row arrived before the original stamp the two sets are identical;
-- that is a pass, not a failure.
WITH me AS (
  SELECT id FROM auth.users WHERE email = 'benjamin@clbhouz.co.uk'
),
cur AS (
  SELECT (SELECT next_cursor FROM me, public.get_explore_stream(me.id, 'all', 'world', NULL, 12) s
           WHERE next_cursor IS NOT NULL LIMIT 1) AS c
),
as_served AS (
  SELECT s.id, s.seen, (s.facts ->> 'published_at') AS arrived
    FROM me, cur, public.get_explore_stream(me.id, 'all', 'world', cur.c, 12) s
),
forced AS (
  SELECT s.id, s.seen
    FROM me, cur,
         public.get_explore_stream(me.id, 'all', 'world',
           jsonb_set(cur.c, '{seen}', to_jsonb(now())), 12) s
)
SELECT a.id,
       a.arrived,
       a.seen        AS seen_with_served_cursor,
       f.seen        AS seen_with_forced_now,
       (SELECT c ->> 'seen' FROM cur) AS original_stamp
  FROM as_served a FULL JOIN forced f USING (id)
 ORDER BY a.id;

-- V4. MEMBER-ROLE TIMING. Run the block below BEFORE the patch and again
-- AFTER, and compare. Timing must be reported for the member role, not
-- postgres, because RLS on the pooled tables is part of the cost.
--   Turn timing on in your client first (psql: timing on) or read the
--   EXPLAIN ANALYZE total below.
BEGIN;
  SET LOCAL role authenticated;
  SET LOCAL request.jwt.claims = '{"role":"authenticated","sub":"REPLACE_WITH_THE_UUID_FROM_V2"}';
  EXPLAIN (ANALYZE, BUFFERS)
    SELECT * FROM public.get_explore_stream(
      'REPLACE_WITH_THE_UUID_FROM_V2'::uuid, 'all', 'world', NULL, 12);
ROLLBACK;
-- Page 2 timing, same session shape, using the cursor V2 printed:
BEGIN;
  SET LOCAL role authenticated;
  SET LOCAL request.jwt.claims = '{"role":"authenticated","sub":"REPLACE_WITH_THE_UUID_FROM_V2"}';
  EXPLAIN (ANALYZE, BUFFERS)
    SELECT * FROM public.get_explore_stream(
      'REPLACE_WITH_THE_UUID_FROM_V2'::uuid, 'all', 'world',
      'REPLACE_WITH_THE_next_cursor_FROM_V2'::jsonb, 12);
ROLLBACK;
-- Expectation: unchanged within noise. The patch removes a per-page stamp read
-- on pages 2+ and replaces now() with a variable; neither adds work.
-- ============================================================================
