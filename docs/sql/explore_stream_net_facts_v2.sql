-- ============================================================================
-- EXPLORE ROUND CARDS GAIN NET, PLAYING HANDICAP AND A NET RECORD (BRIEF C4).
-- v2. Ben runs this as postgres. NOT APPLIED BY THE AGENT.
--
-- SUPERSEDES explore_stream_net_facts.sql, which was applied, broke every
-- Explore call with 42703 (whs_scores.whs_score_id does not exist) and was
-- rolled back. See explore_stream_net_facts_ROLLBACK.sql.
--
-- ============================================================================
-- STANDING RULE FOR EVERY PATCH TO THIS FUNCTION - A GUARD IS NOT A TEST.
--   PL/pgSQL does not resolve column names until a query executes, so a body
--   that cannot run still installs, still fingerprints and still reads back.
--   Therefore, in the SAME transaction as the EXECUTE and BEFORE COMMIT, this
--   file CALLS the rebuilt function for real on both views, on a page that
--   contains rounds with a visible handicap so the new CTEs actually join, and
--   RAISEs unless at least one returned round carries facts->>'net'. Any
--   run-time error aborts the transaction and nothing reaches members.
--   The md5 guard proves WHICH body you patched. Only a call proves it runs.
--   Also written into docs/sql/README.md.
-- STANDING RULE - PROVE COLUMNS, DO NOT RECALL THEM. Every table and column
--   the new CTEs touch is asserted from information_schema.columns, and every
--   function signature from pg_proc, before anything is rebuilt.
-- ============================================================================
--
-- WHAT IT ADDS to facts, for kind 'round' ONLY:
--   course_handicap  the player's playing handicap FOR THAT ROUND
--   net              gross - course_handicap  (now GATED; see PRIVACY)
--   net_record       true when the round took rank 1 on the course's NET board
--                    at the moment it arrived, under the SAME contest floor and
--                    the SAME tie rejection the gross crown uses
--
-- HANDICAP CUT IS DELIBERATELY NOT IN THIS PATCH (Ben's ruling). page_snaps /
-- snap_before / snap_after and the handicap_cut key are gone: the attribution
-- rule is not settled, the client has it disabled, and that join is exactly
-- what broke the feed. It returns in its own patch once the rule is agreed.
--
-- ONE DEFINITION OF NET, AND IT IS NOT A NEW ONE.
--   public.get_viewer_standing(uuid) and get_viewer_standing(uuid,text), and
--   public.get_board_page(...,'net',...) all read net from public.board_pool,
--   whose ONLY net source is
--     LEFT JOIN public.gam_round_net n ON n.whs_score_id = g.whs_score_id
--   and public.gam_round_net is:
--     whs_course_handicap(hcp_at_time, slope_rating, course_rating, course_par)
--       AS course_handicap,
--     gross_score - whs_course_handicap(...) AS net_score
--   with whs_course_handicap(p_index, p_slope_rating, p_course_rating, p_par)
--   = ROUND(index * slope/113 + (rating - par)) as an integer, half-up, NULL if
--   any input is NULL. Index source: the round's own gam_round_stats
--   .hcp_at_time. Allowance: 100% (none applied anywhere). The surfaces cannot
--   disagree - they are the same view through the same primitive - so this file
--   adds NO arithmetic of its own. Board floors stay in board_qualifies('net').
--   NOTE: public.get_course_net_board does NOT exist on production (it is still
--   only the draft docs/sql/champions_net_board.sql), so VERIFY 1 below compares
--   against get_board_page(...,'net',...), which is the deployed net board.
--
-- PRIVACY. Net minus gross IS the handicap, so all three fields are withheld
-- unless public.can_view_handicap(_viewer, _target) is true - the same
-- viewer-aware helper the boards' handicap disclosure defers to. Exactly ONE
-- call to it appears in the rebuilt body, asserted below.
-- whs_connection_publicly_visible is NOT used anywhere in this file.
--
-- IT ALSO CLOSES AN EXISTING LEAK. The deployed body publishes
-- 'net' => r -> 'net_score' with NO viewer check, so a private-handicap
-- player's index is currently derivable from any Explore round card of theirs
-- (gross - net). After this patch 'net' comes from the GATED lookup only.
--
-- NO NEW COLUMNS IN THE CANDIDATE UNION. The lookup is PAGE-SCOPED: it runs on
-- the <= v_limit rows already placed, as MATERIALIZED CTEs joined by
-- whs_score_id in the final projection. Pool, scoring, cadence and keyset are
-- untouched. NO CORRELATED SUB-SELECT anywhere near a per-round lookup (the
-- 28-second lesson). No new now().
--
-- THE JOIN KEY, PROVEN BY SAMPLING (not recalled):
--   gam_round_stats.whs_score_id (uuid) = whs_scores.id (uuid).
--   whs_scores has NO whs_score_id column; whs_score_uid is a DIFFERENT text
--   value (e.g. score eb44bf1b-f597-4c68-afa7-7646e5938352 has
--   whs_score_uid 4240d8c3-1e43-4a32-97d3-83e92482f133).
--   Sampled on production: 3557 of 3557 gam_round_stats rows with a
--   whs_score_id join to whs_scores.id. The guard re-proves this at run time.
--
-- COLUMNS AND SIGNATURES ASSERTED IN THE GUARD BLOCK:
--   gam_round_stats: whs_score_id, user_id, course_id, course_par, play_date,
--     gross_score, stableford_points, delta_index, birdies, eagles,
--     albatrosses, holes_in_one, clean_card, holes_played, created_at
--   gam_round_net:   whs_score_id, user_id, course_id, course_handicap,
--     net_score, gross_score, play_date
--   whs_scores:      id, connection_id, course_id
--   whs_connections: id, user_id
--   whs_to_golf_course_map: whs_course_id, golf_course_id
--   functions: board_qualifies(text,integer,integer,integer,integer,numeric,
--     integer,date,integer,integer,integer,boolean),
--     can_view_handicap(uuid,uuid), whs_course_handicap(numeric,numeric,
--     numeric,numeric), get_explore_stream(8 args)
--   (whs_handicap_snapshots is NOT touched: the cut is out of this patch.)
--
-- CHAIN GUARD - every accepted patch that touched this function is asserted
-- present by one distinctive string each: c_gap_half, gap_damp_floor,
-- is_record_shown, c_auth_cap, 'ADJACENCY IS A GUARANTEE TOO', the standing
-- claim rule, the retired played_nochange / rank_hold branches,
-- 'scores:CONSEQUENCE:AUTHOR', 'field AS MATERIALIZED', and v_anchor (required
-- by explore_stream_anchor_cursor.sql's header).
-- DEPLOYED md5 ASSERTED: e1ee958dd62fc7ea8ef71dc954563e12 (46661 bytes).
-- RERUN GUARD: v_net_facts. A second run aborts.
--
-- The patch block (BEGIN ... COMMIT) and each MEASURE / VERIFY query below are
-- SEPARATE runs in the SQL editor. No backslash meta-commands anywhere.
-- ============================================================================

BEGIN;

DO $patch$
DECLARE
  c_md5   constant text := 'e1ee958dd62fc7ea8ef71dc954563e12';
  c_email constant text := 'benjamin@clbhouz.co.uk';
  v_src   text;
  v_new   text;
  v_from  text;
  v_to    text;
  v_n     int;
  v_join  int;
  v_total int;
  v_ben   uuid;
  v_rows  int;
  v_net   int;
  r       record;
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

  -- =========================================================================
  -- COLUMNS, PROVEN. Every relation and column the new CTEs name is checked
  -- here, by name, and the failure names the missing one. This is the check
  -- v1 did not have and the reason v1 shipped a body that could not run.
  -- =========================================================================
  FOR r IN
    SELECT * FROM (VALUES
      ('gam_round_stats','whs_score_id'),
      ('gam_round_stats','user_id'),
      ('gam_round_stats','course_id'),
      ('gam_round_stats','course_par'),
      ('gam_round_stats','play_date'),
      ('gam_round_stats','gross_score'),
      ('gam_round_stats','stableford_points'),
      ('gam_round_stats','delta_index'),
      ('gam_round_stats','birdies'),
      ('gam_round_stats','eagles'),
      ('gam_round_stats','albatrosses'),
      ('gam_round_stats','holes_in_one'),
      ('gam_round_stats','clean_card'),
      ('gam_round_stats','holes_played'),
      ('gam_round_stats','created_at'),
      ('gam_round_net','whs_score_id'),
      ('gam_round_net','user_id'),
      ('gam_round_net','course_id'),
      ('gam_round_net','course_handicap'),
      ('gam_round_net','net_score'),
      ('gam_round_net','gross_score'),
      ('gam_round_net','play_date'),
      ('whs_scores','id'),
      ('whs_scores','connection_id'),
      ('whs_scores','course_id'),
      ('whs_connections','id'),
      ('whs_connections','user_id'),
      ('whs_to_golf_course_map','whs_course_id'),
      ('whs_to_golf_course_map','golf_course_id')
    ) AS t(tbl, col)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
       WHERE c.table_schema = 'public' AND c.table_name = r.tbl AND c.column_name = r.col
    ) THEN
      RAISE EXCEPTION 'missing column public.%.% - this patch names it; fix the draft, do not install',
        r.tbl, r.col;
    END IF;
  END LOOP;

  -- whs_scores has NO whs_score_id. Assert the wrong guess can never return.
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'whs_scores'
                AND column_name = 'whs_score_id') THEN
    RAISE NOTICE 'note: whs_scores.whs_score_id now exists; this patch still uses whs_scores.id';
  END IF;

  -- The join key, re-proven on live data rather than trusted.
  SELECT count(*) INTO v_join
    FROM public.gam_round_stats g JOIN public.whs_scores w ON w.id = g.whs_score_id;
  SELECT count(*) INTO v_total
    FROM public.gam_round_stats g WHERE g.whs_score_id IS NOT NULL;
  IF v_join = 0 OR v_join <> v_total THEN
    RAISE EXCEPTION 'join key unproven: % of % gam_round_stats.whs_score_id rows match whs_scores.id',
      v_join, v_total;
  END IF;
  RAISE NOTICE 'join key proven: %/% gam_round_stats.whs_score_id = whs_scores.id', v_join, v_total;

  -- ---- function signatures, exactly -----------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'board_qualifies'
       AND pg_get_function_identity_arguments(p.oid) =
           'p_board text, p_gross integer, p_par integer, p_net integer, p_sf integer, p_delta numeric, p_birdies integer, p_play_date date, p_ace integer, p_alb integer, p_eagle integer, p_clean boolean'
  ) THEN
    RAISE EXCEPTION 'public.board_qualifies does not have the expected 12-argument signature - the net floors call below would bind to something else';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'can_view_handicap'
       AND pg_get_function_identity_arguments(p.oid) = '_viewer uuid, _target uuid'
  ) THEN
    RAISE EXCEPTION 'public.can_view_handicap(_viewer uuid, _target uuid) is missing - the gate is not optional';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'whs_course_handicap'
  ) THEN
    RAISE EXCEPTION 'public.whs_course_handicap is missing - gam_round_net has no definition of net';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                  WHERE n.nspname = 'public' AND c.relname = 'gam_round_net') THEN
    RAISE EXCEPTION 'public.gam_round_net is missing - net has no single definition to reuse';
  END IF;

  v_new := v_src;

  -- =========================================================================
  -- 1. THE PAGE-SCOPED LOOKUP. CTEs on the FINAL projection only.
  --    v_net_facts (in the comment) is this patch's fingerprint.
  -- =========================================================================
  v_from := '  RETURN QUERY' || E'\n' || '  SELECT' || E'\n' || '    r ->> ''cid'',';
  v_to   := '  -- v_net_facts: NET, PLAYING HANDICAP AND THE NET CROWN.'          || E'\n'
         || '  -- PAGE-SCOPED. These CTEs see only the rows already placed on'    || E'\n'
         || '  -- this page, so the ranker''s pool, scoring, cadence and keyset'  || E'\n'
         || '  -- are untouched. MATERIALIZED joins throughout: no correlated'    || E'\n'
         || '  -- sub-select anywhere near a per-round lookup.'                   || E'\n'
         || '  -- Handicap cut is NOT here: its attribution rule is unsettled.'   || E'\n'
         || '  RETURN QUERY'                                                      || E'\n'
         || '  WITH page_rounds AS MATERIALIZED ('                                || E'\n'
         || '    -- THE GATE IS THE FIRST THING THAT HAPPENS. A player whose'     || E'\n'
         || '    -- handicap this viewer may not see never reaches the lookup,'   || E'\n'
         || '    -- so all three fields are absent for them - net included,'      || E'\n'
         || '    -- because gross minus net IS the handicap.'                     || E'\n'
         || '    SELECT DISTINCT'                                                 || E'\n'
         || '           (e ->> ''whs_score_id'')::uuid   AS score_id,'            || E'\n'
         || '           (e ->> ''user_id'')::uuid        AS user_id,'             || E'\n'
         || '           (e ->> ''course_id'')::uuid      AS course_id,'           || E'\n'
         || '           (e ->> ''arrived_at'')::timestamptz AS arrived_at'        || E'\n'
         || '      FROM jsonb_array_elements(v_out) e'                            || E'\n'
         || '     WHERE e ->> ''kind'' = ''round'''                               || E'\n'
         || '       AND (e -> ''whs_score_id'') IS NOT NULL'                      || E'\n'
         || '       AND (e -> ''user_id'') IS NOT NULL'                           || E'\n'
         || '       AND public.can_view_handicap(p_viewer, (e ->> ''user_id'')::uuid)' || E'\n'
         || '  ),'                                                                || E'\n'
         || '  page_net AS MATERIALIZED ('                                        || E'\n'
         || '    -- ONE DEFINITION OF NET: public.gam_round_net, the view'        || E'\n'
         || '    -- board_pool reads, which is what get_board_page(''net'') and'  || E'\n'
         || '    -- get_viewer_standing both rank on. No arithmetic here.'        || E'\n'
         || '    SELECT pr.score_id, pr.user_id, pr.course_id, pr.arrived_at,'    || E'\n'
         || '           n.course_handicap, n.net_score'                           || E'\n'
         || '      FROM page_rounds pr'                                           || E'\n'
         || '      JOIN public.gam_round_net n ON n.whs_score_id = pr.score_id'   || E'\n'
         || '  ),'                                                                || E'\n'
         || '  page_courses AS MATERIALIZED ('                                    || E'\n'
         || '    SELECT DISTINCT course_id FROM page_net WHERE course_id IS NOT NULL' || E'\n'
         || '  ),'                                                                || E'\n'
         || '  net_field AS MATERIALIZED ('                                       || E'\n'
         || '    -- THE SAME CONTEST FLOOR THE GROSS CROWN USES: distinct players'|| E'\n'
         || '    -- with a scored round at the course through the reviewed WHS'   || E'\n'
         || '    -- mapping, course-wide and including the subject, so >= 2 IS'   || E'\n'
         || '    -- CROWN_MIN_OTHERS = 1. A course with no mapping counts 0 and'  || E'\n'
         || '    -- the claim is withheld: an unprovable record is not a record.' || E'\n'
         || '    -- Keys: whs_scores.course_id is the WHS course; the map turns'  || E'\n'
         || '    -- it into a golf_courses id; the connection names the player.'  || E'\n'
         || '    SELECT m.golf_course_id AS course_id,'                           || E'\n'
         || '           count(DISTINCT wc.user_id)::int AS players'               || E'\n'
         || '      FROM public.whs_to_golf_course_map m'                          || E'\n'
         || '      JOIN public.whs_scores ws ON ws.course_id = m.whs_course_id'   || E'\n'
         || '      JOIN public.whs_connections wc ON wc.id = ws.connection_id'    || E'\n'
         || '     WHERE m.golf_course_id IN (SELECT course_id FROM page_courses)' || E'\n'
         || '     GROUP BY m.golf_course_id'                                      || E'\n'
         || '  ),'                                                                || E'\n'
         || '  net_rivals AS MATERIALIZED ('                                      || E'\n'
         || '    -- EVERY QUALIFYING NET ROUND ON THE PAGE''S COURSES, with the'  || E'\n'
         || '    -- board''s own floors (board_qualifies owns them, here as'      || E'\n'
         || '    -- everywhere) and the board''s own sort value, net TO PAR.'     || E'\n'
         || '    SELECT g.course_id, g.whs_score_id, g.user_id, g.created_at,'    || E'\n'
         || '           (n.net_score - g.course_par)::numeric AS sv'              || E'\n'
         || '      FROM public.gam_round_stats g'                                 || E'\n'
         || '      JOIN public.gam_round_net n ON n.whs_score_id = g.whs_score_id'|| E'\n'
         || '     WHERE g.holes_played = 18'                                      || E'\n'
         || '       AND g.course_id IN (SELECT course_id FROM page_courses)'      || E'\n'
         || '       AND public.board_qualifies(''net'', g.gross_score, g.course_par,' || E'\n'
         || '             n.net_score, g.stableford_points, g.delta_index, g.birdies,' || E'\n'
         || '             g.play_date, g.holes_in_one, g.albatrosses, g.eagles,'  || E'\n'
         || '             g.clean_card)'                                          || E'\n'
         || '  ),'                                                                || E'\n'
         || '  net_crown AS MATERIALIZED ('                                       || E'\n'
         || '    -- RANK 1 AT THE MOMENT IT ARRIVED, TIES REJECTED. A round is'   || E'\n'
         || '    -- the net record only if NO other qualifying round already on'  || E'\n'
         || '    -- the board was as good, which is the gross rule''s "count = 1"'|| E'\n'
         || '    -- holder condition expressed in time.'                          || E'\n'
         || '    SELECT pn.score_id,'                                             || E'\n'
         || '           (coalesce(nf.players, 0) >= 2'                            || E'\n'
         || '            AND me.sv IS NOT NULL'                                   || E'\n'
         || '            AND NOT EXISTS ('                                        || E'\n'
         || '              SELECT 1 FROM net_rivals rv'                           || E'\n'
         || '               WHERE rv.course_id = pn.course_id'                    || E'\n'
         || '                 AND rv.whs_score_id <> pn.score_id'                 || E'\n'
         || '                 AND rv.created_at <= pn.arrived_at'                 || E'\n'
         || '                 AND rv.sv <= me.sv)) AS net_record'                 || E'\n'
         || '      FROM page_net pn'                                              || E'\n'
         || '      JOIN net_rivals me ON me.whs_score_id = pn.score_id'           || E'\n'
         || '      LEFT JOIN net_field nf ON nf.course_id = pn.course_id'         || E'\n'
         || '  ),'                                                                || E'\n'
         || '  net_facts AS MATERIALIZED ('                                       || E'\n'
         || '    SELECT pn.score_id, pn.course_handicap, pn.net_score,'           || E'\n'
         || '           coalesce(nc.net_record, false) AS net_record'             || E'\n'
         || '      FROM page_net pn'                                              || E'\n'
         || '      LEFT JOIN net_crown nc ON nc.score_id = pn.score_id'           || E'\n'
         || '  )'                                                                 || E'\n'
         || '  SELECT'                                                            || E'\n'
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
  -- 3. THE TWO NEW FACTS, beside hcp_at_time. No handicap_cut key.
  -- =========================================================================
  v_from := '      ''hcp_at_time'', r -> ''hcp_at_time'',';
  v_to   := '      ''hcp_at_time'', r -> ''hcp_at_time'','                        || E'\n'
         || '      -- C4. Both share the net gate. net_record is FALSE-out, not' || E'\n'
         || '      -- null-out; a card tells "no crown" from "no data" by the'   || E'\n'
         || '      -- presence of course_handicap beside it.'                    || E'\n'
         || '      ''course_handicap'', to_jsonb(nfj.course_handicap),'           || E'\n'
         || '      ''net_record'', to_jsonb(nfj.net_record),';
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

  -- ---- post-conditions on the TEXT -----------------------------------------
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
  IF v_new LIKE '%handicap_cut%' OR v_new LIKE '%whs_handicap_snapshots%' THEN
    RAISE EXCEPTION 'the cut is out of this patch: no handicap_cut key and no snapshot join';
  END IF;
  IF v_new LIKE '%whs_scores w ON%' THEN
    RAISE EXCEPTION 'this patch must not join whs_scores per round at all';
  END IF;
  IF v_new NOT LIKE '%v_anchor%' THEN
    RAISE EXCEPTION 'the anchored cursor was lost by a replacement';
  END IF;

  EXECUTE v_new;
  RAISE NOTICE 'rebuilt: % bytes', length(v_new);

  -- =========================================================================
  -- 5. THE RULE: CALL IT. Still inside this transaction, so a run-time error
  --    like the 42703 that broke the feed aborts everything and members never
  --    see it. Dynamic EXECUTE so no stale plan can be reused.
  -- =========================================================================
  SELECT id INTO v_ben FROM auth.users WHERE email = c_email;
  IF v_ben IS NULL THEN
    RAISE EXCEPTION 'cannot self-test: no auth.users row for % - name a member whose page carries rounds with a visible handicap', c_email;
  END IF;

  EXECUTE 'SELECT count(*) FROM public.get_explore_stream($1, ''all'', ''world'', NULL, 12, NULL, NULL, NULL)'
    INTO v_rows USING v_ben;
  RAISE NOTICE 'called view=all limit=12: % rows', v_rows;

  EXECUTE 'SELECT count(*) FROM public.get_explore_stream($1, ''scores'', ''world'', NULL, 30, NULL, NULL, NULL)'
    INTO v_rows USING v_ben;
  RAISE NOTICE 'called view=scores limit=30: % rows', v_rows;

  -- Not merely "nothing threw": the new CTEs must have produced a value.
  EXECUTE 'SELECT count(*) FROM public.get_explore_stream($1, ''scores'', ''world'', NULL, 30, NULL, NULL, NULL) s'
       || ' WHERE s.kind = ''round'' AND (s.facts ->> ''net'') IS NOT NULL'
    INTO v_net USING v_ben;
  RAISE NOTICE 'rounds carrying a gated net: %', v_net;

  IF v_net = 0 THEN
    RAISE EXCEPTION 'self-test failed: the page returned no round with facts->>''net'' - the new CTEs never joined, so nothing here is proven. Aborting.';
  END IF;

  -- course_handicap must travel with net, or the client cannot show the chips.
  EXECUTE 'SELECT count(*) FROM public.get_explore_stream($1, ''scores'', ''world'', NULL, 30, NULL, NULL, NULL) s'
       || ' WHERE s.kind = ''round'' AND (s.facts ->> ''net'') IS NOT NULL'
       || '   AND (s.facts ->> ''course_handicap'') IS NULL'
    INTO v_rows USING v_ben;
  IF v_rows > 0 THEN
    RAISE EXCEPTION 'self-test failed: % rounds carry net without course_handicap', v_rows;
  END IF;

  RAISE NOTICE 'self-test passed - committing';
END
$patch$;

COMMIT;

-- ---------------------------------------------------------------------------
-- READ THE BODY BACK (separate run). Record the new md5 for the next patch.
-- ---------------------------------------------------------------------------
SELECT md5(pg_get_functiondef(p.oid)) AS new_md5,
       length(pg_get_functiondef(p.oid)) AS bytes,
       pg_get_functiondef(p.oid) LIKE '%v_net_facts%'  AS fingerprint_present,
       pg_get_functiondef(p.oid) LIKE '%v_anchor%'     AS anchor_still_present,
       pg_get_functiondef(p.oid) LIKE '%handicap_cut%' AS cut_absent_must_be_false,
       p.provolatile AS volatility
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

-- ---------------------------------------------------------------------------
-- MEASURE. Run this block BEFORE the patch and again AFTER, same session shape.
-- Baseline to beat: about 831 ms / 142.7k buffers.
-- The role is set BEFORE the claim is written, because set_config on
-- request.jwt.claim.sub must be the last thing before the call and the call
-- must run as authenticated so RLS is the member's, not postgres's.
-- ---------------------------------------------------------------------------
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',
         (SELECT id::text FROM auth.users WHERE email = 'benjamin@clbhouz.co.uk'), true);
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.get_explore_stream(
  (SELECT id FROM auth.users WHERE email = 'benjamin@clbhouz.co.uk'),
  'all', 'world', NULL, 12, NULL, NULL, NULL);
ROLLBACK;

-- Same again for the scores view, which is the heavier page.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',
         (SELECT id::text FROM auth.users WHERE email = 'benjamin@clbhouz.co.uk'), true);
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.get_explore_stream(
  (SELECT id FROM auth.users WHERE email = 'benjamin@clbhouz.co.uk'),
  'scores', 'world', NULL, 30, NULL, NULL, NULL);
ROLLBACK;

-- ---------------------------------------------------------------------------
-- VERIFY 1. Twenty of Ben's rounds: gross, playing handicap, net - beside what
-- the DEPLOYED net board states for the same round. net_to_par and
-- board_sort_value MUST match on every row that the board carries; a mismatch
-- means two definitions of net exist again.
-- (get_course_net_board does NOT exist on production - champions_net_board.sql
-- is still a draft - so this compares against get_board_page('net', ...).)
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
  SELECT DISTINCT m.whs_score_id, b.net_score AS board_net, b.sort_value AS board_sv, b.pos
    FROM mine m
    CROSS JOIN LATERAL public.get_board_page(
      (SELECT id FROM me), 'net', 'everyone', 'all', NULL, NULL, 'played',
      m.course_id, 'any', 'any', 200, 0) b
   WHERE b.whs_score_id = m.whs_score_id
)
SELECT m.play_date, m.gross_score, m.course_par, m.course_handicap, m.net_score,
       (m.net_score - m.course_par) AS net_to_par,
       bd.board_net, bd.board_sv, bd.pos,
       (bd.board_net IS NULL)                              AS not_on_board,
       (m.net_score = bd.board_net)                        AS net_agrees,
       ((m.net_score - m.course_par)::numeric = bd.board_sv) AS sort_agrees
  FROM mine m LEFT JOIN board bd ON bd.whs_score_id = m.whs_score_id
 ORDER BY m.play_date DESC;
-- Expected: every row with a board_net has net_agrees = true and
-- sort_agrees = true. not_on_board = true is fine (board_qualifies floors).

-- ---------------------------------------------------------------------------
-- VERIFY 2. A private-handicap player gets nothing. Run as the member, not as
-- postgres, or can_view_handicap is answering for the wrong viewer.
-- ---------------------------------------------------------------------------
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',
         (SELECT id::text FROM auth.users WHERE email = 'benjamin@clbhouz.co.uk'), true);

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
SELECT count(*)                                                    AS their_round_cards,
       count(*) FILTER (WHERE (s.facts ->> 'net') IS NOT NULL)             AS leaked_net,
       count(*) FILTER (WHERE (s.facts ->> 'course_handicap') IS NOT NULL) AS leaked_hcp,
       count(*) FILTER (WHERE s.facts ? 'handicap_cut')                    AS cut_present
  FROM public.get_explore_stream((SELECT id FROM me), 'scores', 'world', NULL, 60,
                                 NULL, NULL, NULL) s
 WHERE s.kind = 'round'
   AND (s.who ->> 'user_id')::uuid IN (SELECT id FROM priv);
ROLLBACK;
-- Expected: leaked_net = 0, leaked_hcp = 0, cut_present = 0.
-- (their_round_cards = 0 proves nothing; find a private player who appears.)

-- ---------------------------------------------------------------------------
-- VERIFY 3. The net crown is rare and never claimed on an unmapped course.
-- ---------------------------------------------------------------------------
SELECT count(*)                                                   AS round_cards,
       count(*) FILTER (WHERE (s.facts ->> 'net_record') = 'true') AS net_crowns
  FROM public.get_explore_stream(
    (SELECT id FROM auth.users WHERE email = 'benjamin@clbhouz.co.uk'),
    'scores', 'world', NULL, 60, NULL, NULL, NULL) s
 WHERE s.kind = 'round';
