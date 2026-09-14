-- =====================================================================
-- EXPLORE -- §3 THE RELAXATION PASS MAY RELAX THE ORDER, NOT THE GUARANTEES
-- Draft for Ben to run. NOT applied by the agent. No backslash
-- meta-commands: this file pastes into the Supabase SQL editor as-is.
--
-- Built ON the deployed body of public.get_explore_stream(8 args):
--   pg_get_functiondef md5 = f5e903e32921df1c4465ee286801a6aa  (40110 bytes)
--   (that is the gap-damp + record-floor + author-cap body, verified live)
--
-- THE GUARD IS THE CHAIN, NOT ONE MD5. This script reads the deployed
-- definition, asserts the fingerprints of every accepted piece of work it
-- must sit on top of, asserts it has not already been applied, replaces one
-- exact site, asserts that site matched exactly once, and re-creates the
-- function from its own definition. Every byte outside that site is
-- unchanged by construction. If the deployed body has moved, it aborts and
-- changes nothing. Run the three drafts of this family in the stated order
-- (§3, then §2, then §1); each tolerates the earlier ones being present.
--
-- THE FAULT
-- The cadence key for the ALL view is kind:ring:author. A repeat IS detected
-- in the main placement loop and the card goes to the deferral queue. The
-- relaxation pass then emptied that queue head-first with NO cadence test,
-- which is how three cards from henryd3737 and three from seedansmith landed
-- side by side while the per-author cap of 3 still passed. Same root cause as
-- the seven-in-a-row run this morning: a rule was enforced in one loop and
-- discarded in another.
--
-- THE PRINCIPLE, NOW WRITTEN INTO THE BODY SO IT IS NOT REDISCOVERED A THIRD
-- TIME:
--   RELAXATION MAY RELAX THE ORDER IT PLACES CARDS IN.
--   IT MAY NOT ABANDON THE GUARANTEES.
-- Kind and ring may bend to keep a page full. The author cap and adjacency
-- may not be discarded wholesale.
--
-- THE FIX
-- Before placing the queue head, if its cadence key equals the last placed
-- key, rotate forward to the FIRST queued row whose key differs and which is
-- still under the author cap. If no such row exists, the head is placed
-- anyway: A PAGE MUST NOT GO SHORT is the reason this pass exists and it wins
-- the tie. The choice is made by INDEX (one SELECT with ORDINALITY), not by
-- re-queueing, so the loop cannot spin.
-- =====================================================================

BEGIN;

DO $patch$
DECLARE
  v_src text; v_new text; v_hits int;

  k1_old text :=
    '    IF (v_deferred -> 0 ->> ''user_id'') IS NOT NULL' || E'\n' ||
    '       AND coalesce((v_auth ->> (v_deferred -> 0 ->> ''user_id''))::int, 0) >= c_auth_cap THEN' || E'\n' ||
    '      v_deferred := v_deferred - 0;' || E'\n' ||
    '      CONTINUE;' || E'\n' ||
    '    END IF;';
  k1_new text :=
    '    IF (v_deferred -> 0 ->> ''user_id'') IS NOT NULL' || E'\n' ||
    '       AND coalesce((v_auth ->> (v_deferred -> 0 ->> ''user_id''))::int, 0) >= c_auth_cap THEN' || E'\n' ||
    '      v_deferred := v_deferred - 0;' || E'\n' ||
    '      CONTINUE;' || E'\n' ||
    '    END IF;' || E'\n' ||
    E'\n' ||
    '    -- ADJACENCY IS A GUARANTEE TOO, AND THIS PASS MAY NOT DISCARD IT.' || E'\n' ||
    '    -- RELAXATION MAY RELAX THE ORDER IT PLACES CARDS IN. IT MAY NOT' || E'\n' ||
    '    -- ABANDON THE GUARANTEES. Kind and ring may bend to keep a page full;' || E'\n' ||
    '    -- the author cap and adjacency may not be discarded wholesale. Empty-' || E'\n' ||
    '    -- ing this queue head-first with no cadence test is what put three' || E'\n' ||
    '    -- cards from one member side by side while the cap still passed.' || E'\n' ||
    '    -- So: rotate forward to the FIRST queued row whose cadence key differs' || E'\n' ||
    '    -- from the last placed key and which is still under the cap. If no' || E'\n' ||
    '    -- such row exists the head is placed anyway - A PAGE MUST NOT GO SHORT' || E'\n' ||
    '    -- is why this pass exists, and it wins the tie. The pick is an INDEX,' || E'\n' ||
    '    -- not a re-queue, so this cannot spin.' || E'\n' ||
    '    IF v_prev_key IS NOT DISTINCT FROM coalesce(v_deferred -> 0 ->> ''cad_k'', ''none'') THEN' || E'\n' ||
    '      DECLARE v_pick int;' || E'\n' ||
    '      BEGIN' || E'\n' ||
    '        SELECT (d.ord - 1)::int INTO v_pick' || E'\n' ||
    '          FROM jsonb_array_elements(v_deferred) WITH ORDINALITY AS d(val, ord)' || E'\n' ||
    '         WHERE coalesce(d.val ->> ''cad_k'', ''none'') IS DISTINCT FROM v_prev_key' || E'\n' ||
    '           AND coalesce((v_auth ->> coalesce(d.val ->> ''user_id'', ''-''))::int, 0) < c_auth_cap' || E'\n' ||
    '         ORDER BY d.ord' || E'\n' ||
    '         LIMIT 1;' || E'\n' ||
    '        IF v_pick IS NOT NULL AND v_pick > 0 THEN' || E'\n' ||
    '          v_deferred := jsonb_build_array(v_deferred -> v_pick) || (v_deferred - v_pick);' || E'\n' ||
    '        END IF;' || E'\n' ||
    '      END;' || E'\n' ||
    '    END IF;';
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_src
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

  IF v_src IS NULL THEN
    RAISE EXCEPTION 'get_explore_stream(8 args) not found';
  END IF;
  RAISE NOTICE 'built on md5 % (% bytes)', md5(v_src), length(v_src);

  -- The accepted work this patch must sit on top of.
  IF v_src NOT LIKE '%gap_damp_floor%' THEN RAISE EXCEPTION 'deployed body predates the gap damp'; END IF;
  IF v_src NOT LIKE '%is_record_shown%' THEN RAISE EXCEPTION 'deployed body predates the record floor'; END IF;
  IF v_src NOT LIKE '%c_auth_cap%'      THEN RAISE EXCEPTION 'deployed body predates the author cap'; END IF;
  IF v_src LIKE '%ADJACENCY IS A GUARANTEE TOO%' THEN RAISE EXCEPTION 'already applied'; END IF;

  v_new := v_src;
  v_hits := (length(v_new) - length(replace(v_new, k1_old, ''))) / length(k1_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 1 (relaxation cadence) matched %', v_hits; END IF;
  v_new := replace(v_new, k1_old, k1_new);

  EXECUTE v_new;
  RAISE NOTICE 'get_explore_stream patched: relaxation cadence rotation, 1/1 site replaced';
END
$patch$;

-- Verify before COMMIT.
SELECT p.proname, p.prosecdef AS security_definer, p.provolatile AS volatility,
       p.proconfig AS search_path, pg_get_userbyid(p.proowner) AS owner,
       md5(pg_get_functiondef(p.oid)) AS new_md5,
       pg_get_functiondef(p.oid) LIKE '%ADJACENCY IS A GUARANTEE TOO%' AS has_relax_cadence
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

SELECT grantee, privilege_type
  FROM information_schema.routine_privileges
 WHERE routine_schema = 'public' AND routine_name = 'get_explore_stream';

COMMIT;
