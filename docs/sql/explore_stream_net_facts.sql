-- ============================================================================
-- EXPLORE ROUND CARDS GAIN NET, PLAYING HANDICAP, A NET RECORD AND A CUT
-- (BRIEF C4). Ben runs this as postgres. NOT APPLIED BY THE AGENT.
--
-- WHAT IT ADDS to facts, for kind 'round' ONLY:
--   course_handicap  the player's playing handicap FOR THAT ROUND
--   net              gross - course_handicap
--   net_record       true when the round took rank 1 on the course's NET board
--                    at the moment it arrived, under the SAME floor and the
--                    SAME tie rejection the gross crown uses
--   handicap_cut     { from, to } when the player's index went DOWN as a result
--                    of this round, else absent
--
-- ONE DEFINITION OF NET, AND IT IS NOT A NEW ONE.
--   public.get_course_net_board  (docs/sql/champions_net_board.sql)  and
--   public.get_viewer_standing(uuid[,text])  (docs/sql/get_viewer_standing*.sql)
--   both read net from public.board_pool, whose ONLY net source is
--     LEFT JOIN public.gam_round_net n ON n.whs_score_id = g.whs_score_id
--   and public.gam_round_net is:
--     whs_course_handicap(hcp_at_time, slope_rating, course_rating, course_par)
--       AS course_handicap,
--     gross_score - whs_course_handicap(...) AS net_score
--   with whs_course_handicap = ROUND(index * slope/113 + (rating - par)) as an
--   integer, half-up, NULL if any input is NULL. Index source: the round's own
--   gam_round_stats.hcp_at_time. Allowance: 100% (none applied anywhere).
--   THE TWO SURFACES DO NOT DISAGREE - they are the same view through the same
--   primitive - so this file adds NO arithmetic of its own. It reads
--   gam_round_net, and the board floors stay in public.board_qualifies('net',...).
--
-- PRIVACY. Net minus gross IS the handicap, so all four fields are withheld
-- unless public.can_view_handicap(p_viewer, player) is true - the same
-- viewer-aware helper board_pool's hcp band relies on and the same one
-- get_course_legends'/get_course_net_board's handicap disclosure defers to.
-- whs_connection_publicly_visible is NOT used anywhere in this file.
--
-- IT ALSO CLOSES AN EXISTING LEAK. The deployed body already publishes
-- 'net' => r -> 'net_score' with NO viewer check, so a private-handicap
-- player's index is currently derivable from any Explore round card of theirs
-- (gross - net). After this patch 'net' comes from the GATED lookup and a
-- private player's card carries no net at all. Reported rather than left.
--
-- NO NEW COLUMNS IN THE CANDIDATE UNION. The candidate CTEs are one positional
-- UNION ALL across seven kinds; four new columns there means twenty-eight new
-- NULL placeholders and a rebuild of every branch. Instead the lookup is
-- PAGE-SCOPED: it runs on the <= v_limit rows that were already placed, as
-- MATERIALIZED CTEs joined by whs_score_id in the final projection. Nothing in
-- the pool, the scoring, the cadence or the keyset is touched, and the ranker
-- still scans the same universe it scans today. NO CORRELATED SUB-SELECT
-- ANYWHERE (the 28-second lesson): every per-round value arrives through a
-- JOIN on a MATERIALIZED CTE.
--
-- CHAIN GUARD - every accepted patch in docs/sql that touched this function is
-- asserted present before anything is rebuilt, by one distinctive string each:
--   explore_stream_gap_damp.sql                -> c_gap_half
--   (config floor)                             -> gap_damp_floor
--   explore_stream_record_floor_author_cap.sql  -> is_record_shown, c_auth_cap
--   explore_stream_relax_cadence.sql           -> ADJACENCY IS A GUARANTEE TOO
--   explore_stream_retire_standing_claims.sql  -> A STANDING CLAIM REQUIRES A
--                                                 CHANGE, AND A NEWS LANE
--   explore_stream_retire_played_nochange.sql  -> played_nochange / rank_hold
--                                                 branches ABSENT
--   explore_stream_scores_cadence_author.sql   -> scores:CONSEQUENCE:AUTHOR
--   explore_stream_field_join.sql              -> field AS MATERIALIZED
--   explore_stream_anchor_cursor.sql           -> v_anchor   (REQUIRED by that
--                                                 file's header: any future
--                                                 patch must assert its md5
--                                                 AND the v_anchor fingerprint)
-- DEPLOYED md5 ASSERTED: e1ee958dd62fc7ea8ef71dc954563e12 (46661 bytes).
--
-- RERUN GUARD: v_net_facts. A second run aborts.
-- Every replacement asserts its exact expected hit count before the rebuilt
-- definition is EXECUTEd, and the body is read back afterwards.
-- No backslash meta-commands: this file is plain SQL.
--
-- The patch block (BEGIN ... COMMIT) and each MEASURE / VERIFY query below are
-- SEPARATE runs in the SQL editor.
-- ============================================================================

BEGIN;

DO $patch$
DECLARE
  c_md5 constant text := 'e1ee958dd62fc7ea8ef71dc954563e12';
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
  IF v_src NOT LIKE '%v_anchor%'
    THEN RAISE EXCEPTION 'deployed body predates the anchored cursor'; END IF;

  -- ---- rerun guard ---------------------------------------------------------
  IF v_src LIKE '%v_net_facts%' THEN
    RAISE EXCEPTION 'already applied: v_net_facts is present';
  END IF;

  -- ---- the primitives this patch leans on must exist -----------------------
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                  WHERE n.nspname = 'public' AND c.relname = 'gam_round_net') THEN
    RAISE EXCEPTION 'public.gam_round_net is missing - net has no single definition to reuse';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                  WHERE n.nspname = 'public' AND p.proname = 'board_qualifies') THEN
    RAISE EXCEPTION 'public.board_qualifies is missing - the net floors live there';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                  WHERE n.nspname = 'public' AND p.proname = 'can_view_handicap'
                    AND p.pronargs = 2) THEN
    RAISE EXCEPTION 'public.can_view_handicap(uuid,uuid) is missing - the gate is not optional';
  END IF;

  v_new := v_src;

  -- =========================================================================
  -- 1. THE PAGE-SCOPED LOOKUP. Inserted as CTEs on the FINAL projection only.
  --    v_net_facts (in the comment) is this patch's fingerprint.
  -- =========================================================================
  v_from := '  RETURN QUERY' || E'\n' || '  SELECT' || E'\n' || '    r ->> ''cid'',';
  v_to   := '  -- v_net_facts: NET, PLAYING HANDICAP, THE NET CROWN AND THE CUT.'   || E'\n'
         || '  -- PAGE-SCOPED. These CTEs see only the rows already placed on this'  || E'\n'
         || '  -- page, so the ranker''s pool, scoring, cadence and keyset are'      || E'\n'
         || '  -- untouched. MATERIALIZED joins throughout: no correlated'           || E'\n'
         || '  -- sub-select is allowed anywhere near a per-round lookup.'           || E'\n'
         || '  RETURN QUERY'                                                         || E'\n'
         || '  WITH page_rounds AS MATERIALIZED ('                                   || E'\n'
         || '    -- THE GATE IS THE FIRST THING THAT HAPPENS. A player whose'        || E'\n'
         || '    -- handicap this viewer may not see never reaches the lookup, so'   || E'\n'
         || '    -- all four fields are absent for them - net included, because'     || E'\n'
         || '    -- gross minus net IS the handicap.'                                || E'\n'
         || '    SELECT DISTINCT'                                                    || E'\n'
         || '           (e ->> ''whs_score_id'')::uuid   AS score_id,'               || E'\n'
         || '           (e ->> ''user_id'')::uuid        AS user_id,'                || E'\n'
         || '           (e ->> ''course_id'')::uuid      AS course_id,'              || E'\n'
         || '           (e ->> ''arrived_at'')::timestamptz AS arrived_at'           || E'\n'
         || '      FROM jsonb_array_elements(v_out) e'                               || E'\n'
         || '     WHERE e ->> ''kind'' = ''round'''                                  || E'\n'
         || '       AND (e -> ''whs_score_id'') IS NOT NULL'                         || E'\n'
         || '       AND (e -> ''user_id'') IS NOT NULL'                              || E'\n'
         || '       AND public.can_view_handicap(p_viewer, (e ->> ''user_id'')::uuid)'|| E'\n'
         || '  ),'                                                                   || E'\n'
         || '  page_net AS MATERIALIZED ('                                           || E'\n'
         || '    -- ONE DEFINITION OF NET: public.gam_round_net, the view'           || E'\n'
         || '    -- board_pool reads, which is what the Champions net board and'     || E'\n'
         || '    -- get_viewer_standing both rank on. No arithmetic here.'           || E'\n'
         || '    SELECT pr.score_id, pr.user_id, pr.course_id, pr.arrived_at,'       || E'\n'
         || '           n.course_handicap, n.net_score'                              || E'\n'
         || '      FROM page_rounds pr'                                              || E'\n'
         || '      JOIN public.gam_round_net n ON n.whs_score_id = pr.score_id'      || E'\n'
         || '  ),'                                                                   || E'\n'
         || '  page_courses AS MATERIALIZED ('                                       || E'\n'
         || '    SELECT DISTINCT course_id FROM page_net WHERE course_id IS NOT NULL' || E'\n'
         || '  ),'                                                                   || E'\n'
         || '  net_field AS MATERIALIZED ('                                          || E'\n'
         || '    -- THE SAME CONTEST FLOOR THE GROSS CROWN USES: distinct players'   || E'\n'
         || '    -- with a scored round at the course through the reviewed WHS'      || E'\n'
         || '    -- mapping, course-wide and including the subject, so >= 2 IS'      || E'\n'
         || '    -- CROWN_MIN_OTHERS = 1. A course with no mapping counts 0 and the' || E'\n'
         || '    -- claim is withheld: an unprovable record is not a record.'        || E'\n'
         || '    SELECT m.golf_course_id AS course_id,'                               || E'\n'
         || '           count(DISTINCT wc.user_id)::int AS players'                   || E'\n'
         || '      FROM public.whs_to_golf_course_map m'                              || E'\n'
         || '      JOIN public.whs_scores ws ON ws.course_id = m.whs_course_id'       || E'\n'
         || '      JOIN public.whs_connections wc ON wc.id = ws.connection_id'        || E'\n'
         || '     WHERE m.golf_course_id IN (SELECT course_id FROM page_courses)'     || E'\n'
         || '     GROUP BY m.golf_course_id'                                          || E'\n'
         || '  ),'                                                                    || E'\n'
         || '  net_rivals AS MATERIALIZED ('                                          || E'\n'
         || '    -- EVERY QUALIFYING NET ROUND ON THE PAGE''S COURSES, with the'      || E'\n'
         || '    -- board''s own floors (board_qualifies owns them, here as'          || E'\n'
         || '    -- everywhere) and the board''s own sort value, net TO PAR.'         || E'\n'
         || '    SELECT g.course_id, g.whs_score_id, g.user_id, g.created_at,'        || E'\n'
         || '           (n.net_score - g.course_par)::numeric AS sv'                  || E'\n'
         || '      FROM public.gam_round_stats g'                                     || E'\n'
         || '      JOIN public.gam_round_net n ON n.whs_score_id = g.whs_score_id'    || E'\n'
         || '     WHERE g.holes_played = 18'                                          || E'\n'
         || '       AND g.course_id IN (SELECT course_id FROM page_courses)'          || E'\n'
         || '       AND public.board_qualifies(''net'', g.gross_score, g.course_par,' || E'\n'
         || '             n.net_score, g.stableford_points, g.delta_index, g.birdies,'|| E'\n'
         || '             g.play_date, g.holes_in_one, g.albatrosses, g.eagles,'      || E'\n'
         || '             g.clean_card)'                                              || E'\n'
         || '  ),'                                                                    || E'\n'
         || '  net_crown AS MATERIALIZED ('                                           || E'\n'
         || '    -- RANK 1 AT THE MOMENT IT ARRIVED, TIES REJECTED. A round is the'   || E'\n'
         || '    -- net record only if NO other qualifying round already on the'      || E'\n'
         || '    -- board was as good, which is the gross rule''s "count = 1"'        || E'\n'
         || '    -- holder condition expressed in time.'                              || E'\n'
         || '    SELECT pn.score_id,'                                                 || E'\n'
         || '           (coalesce(nf.players, 0) >= 2'                                || E'\n'
         || '            AND me.sv IS NOT NULL'                                       || E'\n'
         || '            AND NOT EXISTS ('                                            || E'\n'
         || '              SELECT 1 FROM net_rivals rv'                               || E'\n'
         || '               WHERE rv.course_id = pn.course_id'                        || E'\n'
         || '                 AND rv.whs_score_id <> pn.score_id'                     || E'\n'
         || '                 AND rv.created_at <= pn.arrived_at'                     || E'\n'
         || '                 AND rv.sv <= me.sv)) AS net_record'                     || E'\n'
         || '      FROM page_net pn'                                                  || E'\n'
         || '      JOIN net_rivals me ON me.whs_score_id = pn.score_id'               || E'\n'
         || '      LEFT JOIN net_field nf ON nf.course_id = pn.course_id'             || E'\n'
         || '  ),'                                                                    || E'\n'
         || '  page_snaps AS MATERIALIZED ('                                          || E'\n'
         || '    -- THE INDEX EITHER SIDE OF THE ROUND. Snapshots hang off the WHS'   || E'\n'
         || '    -- connection, which the score row names.'                           || E'\n'
         || '    SELECT pn.score_id, pn.arrived_at, s.observed_at, s.handicap_index'  || E'\n'
         || '      FROM page_net pn'                                                  || E'\n'
         || '      JOIN public.whs_scores w ON w.whs_score_id = pn.score_id'                    || E'\n'
         || '      JOIN public.whs_handicap_snapshots s'                              || E'\n'
         || '        ON s.connection_id = w.connection_id'                            || E'\n'
         || '  ),'                                                                    || E'\n'
         || '  snap_before AS MATERIALIZED ('                                         || E'\n'
         || '    SELECT DISTINCT ON (score_id) score_id, handicap_index'              || E'\n'
         || '      FROM page_snaps WHERE observed_at <= arrived_at'                    || E'\n'
         || '     ORDER BY score_id, observed_at DESC'                                || E'\n'
         || '  ),'                                                                    || E'\n'
         || '  snap_after AS MATERIALIZED ('                                          || E'\n'
         || '    SELECT DISTINCT ON (score_id) score_id, handicap_index'              || E'\n'
         || '      FROM page_snaps WHERE observed_at > arrived_at'                     || E'\n'
         || '     ORDER BY score_id, observed_at ASC'                                 || E'\n'
         || '  ),'                                                                     || E'\n'
         || '  net_facts AS MATERIALIZED ('                                            || E'\n'
         || '    -- A CUT ONLY. An index that rose, or did not move, is not a cut'     || E'\n'
         || '    -- and carries nothing.'                                              || E'\n'
         || '    SELECT pn.score_id, pn.course_handicap, pn.net_score,'                || E'\n'
         || '           coalesce(nc.net_record, false) AS net_record,'                 || E'\n'
         || '           CASE WHEN sb.handicap_index IS NOT NULL'                       || E'\n'
         || '                 AND sa.handicap_index IS NOT NULL'                       || E'\n'
         || '                 AND sa.handicap_index < sb.handicap_index'               || E'\n'
         || '                THEN jsonb_build_object(''from'', sb.handicap_index,'      || E'\n'
         || '                                        ''to'',   sa.handicap_index)'     || E'\n'
         || '           END AS handicap_cut'                                           || E'\n'
         || '      FROM page_net pn'                                                   || E'\n'
         || '      LEFT JOIN net_crown  nc ON nc.score_id = pn.score_id'               || E'\n'
         || '      LEFT JOIN snap_before sb ON sb.score_id = pn.score_id'              || E'\n'
         || '      LEFT JOIN snap_after  sa ON sa.score_id = pn.score_id'              || E'\n'
         || '  )'                                                                      || E'\n'
         || '  SELECT'                                                                 || E'\n'
         || '    r ->> ''cid'',';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'site 1 (page-scoped CTEs): expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  -- =========================================================================
  -- 2. NET BECOMES THE GATED VALUE. r -> 'net_score' is ungated and leaks the
  --    index of a private-handicap player through gross - net.
  -- =========================================================================
  v_from := '      ''to_par'', r -> ''to_par'', ''net'', r -> ''net_score'',';
  v_to   := '      ''to_par'', r -> ''to_par'','                                  || E'\n'
         || '      -- GATED NET, from the viewer-checked lookup. A player whose'  || E'\n'
         || '      -- handicap is withheld carries no net: gross minus net is'    || E'\n'
         || '      -- the handicap.'                                              || E'\n'
         || '      ''net'', to_jsonb(nfj.net_score),';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'site 2 (gated net): expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  -- =========================================================================
  -- 3. THE THREE NEW FACTS, beside hcp_at_time.
  -- =========================================================================
  v_from := '      ''hcp_at_time'', r -> ''hcp_at_time'',';
  v_to   := '      ''hcp_at_time'', r -> ''hcp_at_time'','                        || E'\n'
         || '      -- C4. All three share the net gate. net_record is FALSE-out,' || E'\n'
         || '      -- not null-out, so a card can tell "no crown" from "no data"' || E'\n'
         || '      -- only through the presence of course_handicap beside it.'    || E'\n'
         || '      ''course_handicap'', to_jsonb(nfj.course_handicap),'            || E'\n'
         || '      ''net_record'', to_jsonb(nfj.net_record),'                      || E'\n'
         || '      ''handicap_cut'', nfj.handicap_cut,';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'site 3 (new facts): expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  -- =========================================================================
  -- 4. THE JOIN. One LEFT JOIN on the MATERIALIZED lookup; a non-round row and
  --    a withheld handicap both simply miss it.
  -- =========================================================================
  v_from := '  FROM jsonb_array_elements(v_out) AS r;';
  v_to   := '  FROM jsonb_array_elements(v_out) AS r'                             || E'\n'
         || '  LEFT JOIN net_facts nfj'                                           || E'\n'
         || '         ON (r -> ''whs_score_id'') IS NOT NULL'                     || E'\n'
         || '        AND nfj.score_id = (r ->> ''whs_score_id'')::uuid;';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'site 4 (join): expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  -- ---- post-conditions -----------------------------------------------------
  IF v_new NOT LIKE '%v_net_facts%' THEN
    RAISE EXCEPTION 'fingerprint v_net_facts did not land';
  END IF;
  IF (length(v_new) - length(replace(v_new, 'can_view_handicap', ''))) / 17 <> 1 THEN
    RAISE EXCEPTION 'expected exactly 1 can_view_handicap gate, found %',
      (length(v_new) - length(replace(v_new, 'can_view_handicap', ''))) / 17;
  END IF;
  IF v_new LIKE '%whs_connection_publicly_visible%' THEN
    RAISE EXCEPTION 'the weak visibility helper must never appear in this body';
  END IF;
  IF v_new LIKE '%r -> ''net_score''%' THEN
    RAISE EXCEPTION 'the ungated net is still published';
  END IF;

  EXECUTE v_new;

  RAISE NOTICE 'rebuilt: % bytes', length(v_new);
END
$patch$;

COMMIT;

-- ---------------------------------------------------------------------------
-- READ THE BODY BACK (separate run). Record the new md5 for the next patch.
-- ---------------------------------------------------------------------------
SELECT md5(pg_get_functiondef(p.oid)) AS new_md5,
       length(pg_get_functiondef(p.oid)) AS bytes,
       pg_get_functiondef(p.oid) LIKE '%v_net_facts%' AS fingerprint_present,
       pg_get_functiondef(p.oid) LIKE '%v_anchor%'    AS anchor_still_present,
       p.provolatile AS volatility
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

-- ---------------------------------------------------------------------------
-- MEASURE (separate runs, member role, BEFORE and AFTER the patch).
-- Baseline to beat: about 831 ms / 142.7k buffers.
-- ---------------------------------------------------------------------------
BEGIN;
SELECT set_config('request.jwt.claim.sub',
         (SELECT id::text FROM auth.users WHERE email = 'benjamin@clbhouz.co.uk'), true);
SET LOCAL ROLE authenticated;
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.get_explore_stream(
  (SELECT id FROM auth.users WHERE email = 'benjamin@clbhouz.co.uk'),
  'all', 'world', NULL, 12, NULL, NULL, NULL);
ROLLBACK;

-- ---------------------------------------------------------------------------
-- VERIFY 1. Twenty of Ben's rounds: gross, playing handicap, net - beside what
-- the Champions NET board states for the same rounds. net and board_net MUST
-- match on every row; a mismatch means two definitions of net exist again.
-- ---------------------------------------------------------------------------
WITH me AS (
  SELECT id FROM auth.users WHERE email = 'benjamin@clbhouz.co.uk'
),
mine AS (
  SELECT g.whs_score_id, g.course_id, g.play_date, g.gross_score, g.course_par,
         n.course_handicap, n.net_score
    FROM public.gam_round_stats g
    JOIN public.gam_round_net n ON n.whs_score_id = g.whs_score_id
   WHERE g.user_id = (SELECT id FROM me) AND g.holes_played = 18
   ORDER BY g.play_date DESC
   LIMIT 20
),
board AS (
  SELECT m.whs_score_id, b.value AS board_net_to_par
    FROM mine m
    CROSS JOIN LATERAL public.get_course_net_board(m.course_id, (SELECT id FROM me)) b
   WHERE b.is_self
)
SELECT m.play_date, m.gross_score, m.course_par, m.course_handicap,
       m.net_score,
       (m.net_score - m.course_par) AS net_to_par,
       bd.board_net_to_par,
       (m.net_score - m.course_par) = bd.board_net_to_par AS agrees
  FROM mine m LEFT JOIN board bd ON bd.whs_score_id = m.whs_score_id
 ORDER BY m.play_date DESC;

-- ---------------------------------------------------------------------------
-- VERIFY 2. A private-handicap player gets nulls. Every round card of theirs
-- must carry no net, no course_handicap and no cut.
-- ---------------------------------------------------------------------------
WITH me AS (
  SELECT id FROM auth.users WHERE email = 'benjamin@clbhouz.co.uk'
),
priv AS (
  SELECT up.id
    FROM public.user_profiles up
   WHERE up.handicap_visibility = 'private'
     AND up.id <> (SELECT id FROM me)
     AND EXISTS (SELECT 1 FROM public.gam_round_stats g
                  WHERE g.user_id = up.id AND g.holes_played = 18)
   LIMIT 5
)
SELECT count(*) FILTER (WHERE facts ? 'net')             AS leaked_net,
       count(*) FILTER (WHERE facts ? 'course_handicap')  AS leaked_hcp,
       count(*) FILTER (WHERE facts ? 'handicap_cut')     AS leaked_cut,
       count(*)                                          AS their_round_cards
  FROM public.get_explore_stream((SELECT id FROM me), 'scores', 'world', NULL, 60,
                                 NULL, NULL, NULL) s
 WHERE s.kind = 'round'
   AND (s.who ->> 'user_id')::uuid IN (SELECT id FROM priv);
-- Expected: leaked_net = 0, leaked_hcp = 0, leaked_cut = 0.
