-- =====================================================================
-- EXPLORE -- played_nochange IS RETIRED COMPLETELY, INCLUDING THE
-- VIEWER'S OWN UNMOVED ROUND.
--
-- Draft for Ben to run. NOT applied by the agent. No backslash
-- meta-commands: this pastes into the Supabase SQL editor as-is.
--
-- WHY THIS EXISTS
-- explore_stream_retire_standing_claims.sql retired rank_hold and
-- played_nochange ON OTHER MEMBERS' ROUNDS, but deliberately KEPT
-- played_nochange on the viewer's own news-lane round. The client had
-- already retired that case as well (consequences.ts returns null on an
-- unmoved own round; rankCards.ts strips a server-sent played_nochange),
-- so raw RPC output and the rendered page disagree again -- exactly the
-- layering the previous patch set out to end. David Lang's page shows it
-- at positions 2, 7 and 9; Ben's at position 8. All own rounds.
--
-- THE RULE, STATED ONCE
-- A STANDING CLAIM REQUIRES A CHANGE. There is no surviving consequence
-- whose content is "nothing changed", for anybody's round, in any lane.
-- An unmoved own round falls to the plain sentence ("You went round in
-- 73.") and keeps its photo, chip, hole shape and dots.
--
-- WHAT CHANGES
--   1. The last played_nochange emission is removed. rank_up (own,
--      news, delta > 0) is the only own-round consequence left.
--   2. THE POOL DOES NOT SHRINK. Own rounds used to enter the candidate
--      set by earning played_nochange. Candidacy is now stated directly
--      for them, as it already is for other members' rounds.
--   3. The weight table still lists played_nochange and rank_hold. Both
--      entries are now unreachable and are left in place deliberately:
--      they are weights, not claims. Filed, not done quietly.
--
-- WHAT DOES NOT CHANGE
--   The client gate (applyRankCardRule) STAYS -- Ben's standing ruling.
--   The one-card-per-course-per-change election stays client-side; it is
--   an election over the rows that survive placement.
--   Lanes, backlog rules, cadence key, author cap, record floor, gap
--   damp, notability floor, ring model and the cursor are untouched.
-- =====================================================================

BEGIN;

DO $patch$
DECLARE
  v_src text; v_new text; v_hits int;

  -- 1. THE LAST played_nochange EMISSION --------------------------------
  k1_old text :=
    '          -- rank_hold IS RETIRED AND IS NOT EMITTED. A hold is not a change,' || E'\n' ||
    '          -- and a card that announces one is a card about nothing. The' || E'\n' ||
    '          -- weight table below still lists it; that entry is now' || E'\n' ||
    '          -- unreachable and is left alone deliberately.' || E'\n' ||
    '          WHEN s.kind = ''round'' AND s.is_self AND s.lane_k = ''news'' THEN ''played_nochange''' || E'\n';
  k1_new text :=
    '          -- rank_hold AND played_nochange ARE BOTH RETIRED AND NEITHER IS' || E'\n' ||
    '          -- EMITTED, for anybody''s round, in any lane. A card whose whole' || E'\n' ||
    '          -- content is that nothing changed is a card about nothing. An' || E'\n' ||
    '          -- unmoved own round carries NO consequence and renders the plain' || E'\n' ||
    '          -- sentence, keeping its photo, chip, shape and dots. The weight' || E'\n' ||
    '          -- table below still lists both kinds; those entries are now' || E'\n' ||
    '          -- unreachable and are left alone deliberately.' || E'\n';

  -- 2. CANDIDACY FOR THE VIEWER'S OWN UNMOVED ROUND ---------------------
  k2_old text :=
    '             OR (t.kind = ''round'' AND t.rank_now IS NOT NULL' || E'\n' ||
    '                 AND t.course_id IS NOT NULL AND t.whs_score_id IS NOT NULL)';
  k2_new text :=
    '             OR (t.kind = ''round'' AND t.rank_now IS NOT NULL' || E'\n' ||
    '                 AND t.course_id IS NOT NULL AND t.whs_score_id IS NOT NULL)' || E'\n' ||
    '             -- THE VIEWER''S OWN ROUND IS A CANDIDATE ON ITS OWN ACCOUNT.' || E'\n' ||
    '             -- It used to enter the pool by earning played_nochange; that' || E'\n' ||
    '             -- consequence is retired, so its candidacy is stated here.' || E'\n' ||
    '             -- The SAME rows qualify, carrying no standing claim.' || E'\n' ||
    '             OR (t.kind = ''round'' AND t.is_self' || E'\n' ||
    '                 AND t.course_id IS NOT NULL AND t.whs_score_id IS NOT NULL)';
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_src
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

  IF v_src IS NULL THEN RAISE EXCEPTION 'get_explore_stream(8 args) not found'; END IF;
  RAISE NOTICE 'built on md5 % (% bytes)', md5(v_src), length(v_src);

  -- The chain: every accepted patch must already be in the body.
  IF v_src NOT LIKE '%gap_damp_floor%'  THEN RAISE EXCEPTION 'deployed body predates the gap damp'; END IF;
  IF v_src NOT LIKE '%is_record_shown%' THEN RAISE EXCEPTION 'deployed body predates the record floor'; END IF;
  IF v_src NOT LIKE '%c_auth_cap%'      THEN RAISE EXCEPTION 'deployed body predates the author cap'; END IF;
  IF v_src NOT LIKE '%A STANDING CLAIM REQUIRES A CHANGE, AND A NEWS LANE%'
    THEN RAISE EXCEPTION 'deployed body predates the standing-claim retirement'; END IF;
  IF v_src NOT LIKE '%THEN ''played_nochange''%' THEN RAISE EXCEPTION 'already applied'; END IF;

  v_new := v_src;

  v_hits := (length(v_new) - length(replace(v_new, k1_old, ''))) / length(k1_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 1 (own played_nochange) matched %', v_hits; END IF;
  v_new := replace(v_new, k1_old, k1_new);

  v_hits := (length(v_new) - length(replace(v_new, k2_old, ''))) / length(k2_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 2 (own candidacy) matched %', v_hits; END IF;
  v_new := replace(v_new, k2_old, k2_new);

  -- The retirement, asserted rather than assumed.
  IF v_new LIKE '%THEN ''played_nochange''%' THEN RAISE EXCEPTION 'played_nochange is still emitted'; END IF;
  IF v_new LIKE '%THEN ''rank_hold''%'       THEN RAISE EXCEPTION 'rank_hold is still emitted'; END IF;

  EXECUTE v_new;
  RAISE NOTICE 'get_explore_stream patched: played_nochange fully retired, 2/2 sites replaced';
END
$patch$;

SELECT p.proname, p.prosecdef AS security_definer, p.provolatile AS volatility,
       p.proconfig AS search_path, pg_get_userbyid(p.proowner) AS owner,
       md5(pg_get_functiondef(p.oid)) AS new_md5,
       length(pg_get_functiondef(p.oid)) AS new_len,
       pg_get_functiondef(p.oid) LIKE '%THEN ''played_nochange''%' AS still_emits_played_nochange,
       pg_get_functiondef(p.oid) LIKE '%THEN ''rank_hold''%'       AS still_emits_rank_hold
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

COMMIT;

-- =====================================================================
-- RAW CONFIRMATION, to run as an authenticated member (the function is
-- SECURITY INVOKER, so it must be called with a member's JWT):
--
-- SELECT id, kind, ring, lane, score, consequence ->> 'kind' AS cons
--   FROM public.get_explore_stream(auth.uid(), 'all', 'all', NULL, 20,
--                                  NULL, NULL, NULL);
--
-- Expected: no row where cons IN ('played_nochange','rank_hold'), for
-- any viewer, on any page.
-- =====================================================================
