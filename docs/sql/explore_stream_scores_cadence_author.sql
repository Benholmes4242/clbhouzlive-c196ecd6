-- =====================================================================
-- EXPLORE -- THE SCORES CADENCE KEY GAINS THE AUTHOR.
--
-- Draft for Ben to run. NOT applied by the agent. No backslash
-- meta-commands: this pastes into the Supabase SQL editor as-is.
--
-- THE FAULT
-- On the Scores view the cadence key is coalesce(cons_kind, 'plain').
-- Almost every rounds card carries NO consequence, so almost every card
-- keys the same literal 'plain'. The repeat test therefore fires on the
-- whole page: card after card is pushed to the deferral queue, and the
-- D1 relaxation pass -- which appends what cadence could not place --
-- puts them straight back in the same order. The pass churns to no
-- effect, and the page it produces is the page it would have produced
-- with no cadence rule at all.
--
-- THE FIX, ONE LINE
--   coalesce(cons_kind, 'plain') || ':' || user_id
-- Identical in shape to the All key, which already carries the author
-- for exactly this reason. With the author in the key the pass spaces
-- MEMBERS out instead of testing a constant, inside the existing hard
-- author cap of 3.
--
-- WHAT DOES NOT CHANGE
--   The 'reviews' key (a review page is not author-monotonous in the
--   same way, and its consequences vary), the All key, the courses key,
--   the author cap, lanes, backlog, ring model, record floor, gap damp,
--   notability floor, relaxation, cursor and the consequence ladder.
-- =====================================================================

BEGIN;

DO $patch$
DECLARE
  v_src text; v_new text; v_hits int;

  k_old text := '          WHEN ''scores''  THEN coalesce(t.cons_kind, ''plain'')';
  k_new text :=
    '          -- scores:CONSEQUENCE:AUTHOR. Nearly every rounds card keys' || E'\n' ||
    '          -- ''plain'', so without the author this key is a CONSTANT: the' || E'\n' ||
    '          -- repeat test defers the whole page and relaxation restores it' || E'\n' ||
    '          -- unchanged. The author is what spaces members out inside the' || E'\n' ||
    '          -- hard cap of 3, exactly as the All key already does.' || E'\n' ||
    '          WHEN ''scores''  THEN coalesce(t.cons_kind, ''plain'')' || E'\n' ||
    '                              || '':'' || coalesce(t.user_id::text, ''none'')';
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
  IF v_src LIKE '%scores:CONSEQUENCE:AUTHOR%' THEN RAISE EXCEPTION 'already applied'; END IF;

  v_new := v_src;
  v_hits := (length(v_new) - length(replace(v_new, k_old, ''))) / length(k_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'the scores cadence key matched % times', v_hits; END IF;
  v_new := replace(v_new, k_old, k_new);

  -- The reviews key must be untouched, and the author must now be in the
  -- scores key. Asserted rather than assumed.
  IF v_new NOT LIKE '%WHEN ''reviews'' THEN coalesce(t.cons_kind, ''plain'')%'
    THEN RAISE EXCEPTION 'the reviews cadence key was disturbed'; END IF;
  IF v_new NOT LIKE '%scores:CONSEQUENCE:AUTHOR%'
    THEN RAISE EXCEPTION 'the scores key did not gain the author'; END IF;

  EXECUTE v_new;
  RAISE NOTICE 'get_explore_stream patched: scores cadence key now consequence:author';
END
$patch$;

SELECT p.proname, p.prosecdef AS security_definer, p.provolatile AS volatility,
       p.proconfig AS search_path, pg_get_userbyid(p.proowner) AS owner,
       md5(pg_get_functiondef(p.oid)) AS new_md5,
       length(pg_get_functiondef(p.oid)) AS new_len
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

COMMIT;
