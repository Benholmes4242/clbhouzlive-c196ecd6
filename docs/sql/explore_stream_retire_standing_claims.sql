-- =====================================================================
-- EXPLORE -- §1 THE STANDING-CLAIM RETIREMENT MOVES DOWN INTO SQL
-- Draft for Ben to run. NOT applied by the agent. No backslash
-- meta-commands: this file pastes into the Supabase SQL editor as-is.
--
-- Built ON the deployed body of public.get_explore_stream(8 args), md5
--   f5e903e32921df1c4465ee286801a6aa (40110 bytes), plus §3 and §2 if run.
-- The guard is the chain: fingerprints of the accepted work, an
-- already-applied check, one hit per site, re-create from own definition.
--
-- WHY
-- A FUNCTION THAT STATES CLAIMS THE CLIENT MUST DELETE IS A FUNCTION NOBODY
-- CAN READ AT FACE VALUE. The retirement of rank_hold, and of standing claims
-- on backlog rounds, shipped client-side only (applyRankCardRule in
-- src/features/explore-magazine/rankCards.ts). Raw RPC output has since been
-- read four times to diagnose problems and misled the reader every time,
-- including a false alarm about a reverted deploy. This pushes the rules that
-- CAN be expressed set-based down into the function.
--
-- WHAT MOVES DOWN
--   1. rank_hold is NO LONGER EMITTED AT ALL. A standing claim requires a
--      change; there is no such thing as a hold worth a card.
--   2. NO STANDING CLAIM ON A BACKLOG ROUND, ever: rank_down, rank_up and
--      played_nochange all now require lane_k = 'news'. A round that arrived
--      outside the news window did not change anything this week.
--   3. NO STANDING CLAIM WITHOUT MOVEMENT: rank_down additionally requires
--      the viewer's standing delta to be present and non-zero, which is
--      client rules 1 and 2 (no stamp -> no card; delta 0 -> no card).
--   4. played_nochange IS NO LONGER EMITTED ON ANOTHER MEMBER'S ROUND. It was
--      a standing claim with no movement behind it and the client stripped
--      100% of them. The viewer's OWN played_nochange survives, in news only.
--
-- WHAT STAYS CLIENT-SIDE, AND WHY
--   THE ONE-CARD-PER-COURSE-PER-CHANGE ELECTION. It cannot be expressed in
--   the RPC cheaply, and more importantly it cannot be expressed CORRECTLY:
--   the election is over the rows that actually LAND ON THIS PAGE, after
--   cadence, the outer-ring cap, the author cap, the deferral queue and the
--   relaxation pass have all had their say. SQL would have to elect a winner
--   before knowing which rounds survive placement, and would then either
--   suppress the claim on a card that ships or keep it on one that does not.
--   Rule 5 (attribution is the newest occasion) and rule 6 (no occasion, no
--   card) belong with it. They stay in applyRankCardRule.
--
--   THE CLIENT GATE STAYS EITHER WAY - Ben's ruling. applyRankCardRule is NOT
--   removed when SQL starts doing part of the same job. Defence in depth on a
--   claim this page has already got wrong twice. Two layers agreeing is fine;
--   one layer silently carrying the other is what we are ending. Do not
--   "simplify" this later by deleting the client gate.
--
-- SIDE EFFECTS, STATED RATHER THAN DISCOVERED LATER
--   a. THE POOL DOES NOT SHRINK. Non-self rounds at courses the viewer has
--      played qualified as candidates through played_nochange; the gated WHERE
--      gains an explicit clause so exactly the same rows remain candidates
--      with no consequence attached. They render as plain or notable cards,
--      which is what the client already showed after stripping.
--   b. ORDER MOVES, AND THAT IS THE POINT. A retired claim no longer earns
--      the consequence weight it never deserved (played_nochange 3/14,
--      rank_hold 10/14), so those cards fall. The client was already showing
--      them without the claim while the RPC was still ranking them with it.
--   c. THE WEIGHT TABLE STILL LISTS rank_hold. It is now unreachable and left
--      in place deliberately: it is a weight, not a claim, and removing it is
--      a byte of churn with no behaviour. Filed, not done quietly.
-- =====================================================================

BEGIN;

DO $patch$
DECLARE
  v_src text; v_new text; v_hits int;

  -- 1. THE CONSEQUENCE LADDER -------------------------------------------
  k1_old text :=
    '          WHEN s.kind = ''round'' AND NOT s.is_self AND s.rank_now IS NOT NULL' || E'\n' ||
    '               AND s.gross_score IS NOT NULL AND s.my_best IS NOT NULL' || E'\n' ||
    '               AND s.gross_score < s.my_best THEN ''rank_down''' || E'\n' ||
    '          WHEN s.kind = ''round'' AND NOT s.is_self AND s.on_list THEN ''list_first''' || E'\n' ||
    '          WHEN s.kind = ''round'' AND NOT s.is_self AND s.rank_now IS NOT NULL THEN ''played_nochange''' || E'\n' ||
    '          WHEN s.kind = ''round'' AND NOT s.is_self AND s.is_circle THEN ''circle_round''';
  k1_new text :=
    '          -- A STANDING CLAIM REQUIRES A CHANGE, AND A NEWS LANE. Retired' || E'\n' ||
    '          -- client-side first (applyRankCardRule); now retired HERE so raw' || E'\n' ||
    '          -- RPC output can be read at face value. lane_k = news: a round' || E'\n' ||
    '          -- that arrived outside the news window changed nothing this week.' || E'\n' ||
    '          -- delta present and non-zero: no stamp is not a movement, and a' || E'\n' ||
    '          -- board that has not moved is not news either.' || E'\n' ||
    '          -- THE ONE-CARD-PER-COURSE-PER-CHANGE ELECTION IS NOT HERE. It is' || E'\n' ||
    '          -- an election over the rows that survive PLACEMENT, which is not' || E'\n' ||
    '          -- known at this point in the query. It stays in the client.' || E'\n' ||
    '          WHEN s.kind = ''round'' AND NOT s.is_self AND s.lane_k = ''news''' || E'\n' ||
    '               AND s.rank_now IS NOT NULL' || E'\n' ||
    '               AND s.delta IS NOT NULL AND s.delta <> 0' || E'\n' ||
    '               AND s.gross_score IS NOT NULL AND s.my_best IS NOT NULL' || E'\n' ||
    '               AND s.gross_score < s.my_best THEN ''rank_down''' || E'\n' ||
    '          WHEN s.kind = ''round'' AND NOT s.is_self AND s.on_list THEN ''list_first''' || E'\n' ||
    '          -- played_nochange ON SOMEBODY ELSE''S ROUND IS RETIRED. It was a' || E'\n' ||
    '          -- standing claim with no movement behind it, and the client' || E'\n' ||
    '          -- stripped every one. The row is still a candidate (see the gated' || E'\n' ||
    '          -- WHERE); it simply no longer speaks about the viewer.' || E'\n' ||
    '          WHEN s.kind = ''round'' AND NOT s.is_self AND s.is_circle THEN ''circle_round''';

  -- 2. THE VIEWER'S OWN ROUNDS, AND rank_hold ---------------------------
  k2_old text :=
    '          WHEN s.kind = ''round'' AND s.is_self AND s.delta IS NOT NULL AND s.delta > 0 THEN ''rank_up''' || E'\n' ||
    '          WHEN s.kind = ''round'' AND s.is_self AND s.rank_then IS NOT NULL AND s.delta = 0 THEN ''rank_hold''' || E'\n' ||
    '          WHEN s.kind = ''round'' AND s.is_self THEN ''played_nochange''';
  k2_new text :=
    '          WHEN s.kind = ''round'' AND s.is_self AND s.lane_k = ''news''' || E'\n' ||
    '               AND s.delta IS NOT NULL AND s.delta > 0 THEN ''rank_up''' || E'\n' ||
    '          -- rank_hold IS RETIRED AND IS NOT EMITTED. A hold is not a change,' || E'\n' ||
    '          -- and a card that announces one is a card about nothing. The' || E'\n' ||
    '          -- weight table below still lists it; that entry is now' || E'\n' ||
    '          -- unreachable and is left alone deliberately.' || E'\n' ||
    '          WHEN s.kind = ''round'' AND s.is_self AND s.lane_k = ''news'' THEN ''played_nochange''';

  -- 3. THE POOL DOES NOT SHRINK -----------------------------------------
  k3_old text :=
    '      WHERE (t.kind <> ''round''' || E'\n' ||
    '             OR t.cons_kind IS NOT NULL' || E'\n' ||
    '             OR (t.ring_k IN (''county'',''country'',''world'') AND t.course_id IS NOT NULL' || E'\n' ||
    '                 AND t.whs_score_id IS NOT NULL))';
  k3_new text :=
    '      WHERE (t.kind <> ''round''' || E'\n' ||
    '             OR t.cons_kind IS NOT NULL' || E'\n' ||
    '             -- CANDIDACY IS NOT A CLAIM. A round at a course the viewer has' || E'\n' ||
    '             -- played used to enter the pool by earning played_nochange. That' || E'\n' ||
    '             -- consequence is retired, so candidacy is now stated directly:' || E'\n' ||
    '             -- the SAME rows, carrying no standing claim, rendering as the' || E'\n' ||
    '             -- plain or notable cards the client already showed after' || E'\n' ||
    '             -- stripping. Removing them instead would delete cards the' || E'\n' ||
    '             -- retirement never touched.' || E'\n' ||
    '             OR (t.kind = ''round'' AND t.rank_now IS NOT NULL' || E'\n' ||
    '                 AND t.course_id IS NOT NULL AND t.whs_score_id IS NOT NULL)' || E'\n' ||
    '             OR (t.ring_k IN (''county'',''country'',''world'') AND t.course_id IS NOT NULL' || E'\n' ||
    '                 AND t.whs_score_id IS NOT NULL))';
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_src
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

  IF v_src IS NULL THEN RAISE EXCEPTION 'get_explore_stream(8 args) not found'; END IF;
  RAISE NOTICE 'built on md5 % (% bytes)', md5(v_src), length(v_src);

  IF v_src NOT LIKE '%gap_damp_floor%' THEN RAISE EXCEPTION 'deployed body predates the gap damp'; END IF;
  IF v_src NOT LIKE '%is_record_shown%' THEN RAISE EXCEPTION 'deployed body predates the record floor'; END IF;
  IF v_src NOT LIKE '%c_auth_cap%'      THEN RAISE EXCEPTION 'deployed body predates the author cap'; END IF;
  IF v_src LIKE '%A STANDING CLAIM REQUIRES A CHANGE, AND A NEWS LANE%' THEN RAISE EXCEPTION 'already applied'; END IF;

  v_new := v_src;

  v_hits := (length(v_new) - length(replace(v_new, k1_old, ''))) / length(k1_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 1 (others ladder) matched %', v_hits; END IF;
  v_new := replace(v_new, k1_old, k1_new);

  v_hits := (length(v_new) - length(replace(v_new, k2_old, ''))) / length(k2_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 2 (own ladder, rank_hold) matched %', v_hits; END IF;
  v_new := replace(v_new, k2_old, k2_new);

  v_hits := (length(v_new) - length(replace(v_new, k3_old, ''))) / length(k3_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 3 (candidacy) matched %', v_hits; END IF;
  v_new := replace(v_new, k3_old, k3_new);

  -- The retirement, asserted rather than assumed.
  IF v_new LIKE '%THEN ''rank_hold''%' THEN RAISE EXCEPTION 'rank_hold is still emitted'; END IF;

  EXECUTE v_new;
  RAISE NOTICE 'get_explore_stream patched: standing-claim retirement, 3/3 sites replaced';
END
$patch$;

SELECT p.proname, p.prosecdef AS security_definer, p.provolatile AS volatility,
       p.proconfig AS search_path, pg_get_userbyid(p.proowner) AS owner,
       md5(pg_get_functiondef(p.oid)) AS new_md5,
       pg_get_functiondef(p.oid) LIKE '%THEN ''rank_hold''%' AS still_emits_rank_hold
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

COMMIT;
