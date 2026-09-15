-- ============================================================================
-- ROLLBACK OF explore_stream_net_facts.sql  (RECORD OF WHAT WAS UNDONE)
--
-- WHAT HAPPENED. explore_stream_net_facts.sql applied cleanly - md5 guard,
-- fingerprint chain and read-back all passed - and then every call to
-- public.get_explore_stream failed at run time:
--
--   42703 column w.whs_score_id does not exist (HINT: perhaps you meant
--         w.whs_score_uid)
--   at page_snaps:  JOIN public.whs_scores w ON w.whs_score_id = pn.score_id
--
-- PL/pgSQL does not resolve column names until a query executes, so a body
-- that cannot run still installs, still fingerprints and still reads back.
-- A guard proves WHICH body you patched. Only a CALL proves the result runs.
-- That rule is now mandatory for this function - see the header of
-- explore_stream_net_facts_v2.sql and docs/sql/README.md.
--
-- Ben rolled the live function back by an exact reverse; the deployed body is
-- again md5 e1ee958dd62fc7ea8ef71dc954563e12. This file is the recorded form
-- of that reverse: it undoes the four replacements the forward patch made, in
-- reverse order, and asserts the result is byte-for-byte the pre-patch body.
--
-- It is IDEMPOTENT-SAFE: if the deployed body is already the pre-patch md5 it
-- raises a notice and changes nothing, so re-running it cannot damage a
-- healthy function.
-- ============================================================================

BEGIN;

DO $rollback$
DECLARE
  c_broken constant text := 'c9c83e1a792a42ac579745237b1c73cf';  -- the patched, non-running body
  c_good   constant text := 'e1ee958dd62fc7ea8ef71dc954563e12';  -- the body to restore
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

  IF md5(v_src) = c_good THEN
    RAISE NOTICE 'nothing to do: deployed body is already the pre-patch % - rollback already in place', c_good;
    RETURN;
  END IF;

  IF md5(v_src) <> c_broken THEN
    RAISE EXCEPTION 'refusing: deployed body is %, which is neither the broken % nor the good % - do not guess at a reverse',
      md5(v_src), c_broken, c_good;
  END IF;

  v_new := v_src;

  -- ---- reverse site 4: the LEFT JOIN on the lookup --------------------------
  v_from := '  FROM jsonb_array_elements(v_out) AS r'                             || E'\n'
         || '  LEFT JOIN net_facts nfj'                                           || E'\n'
         || '         ON (r -> ''whs_score_id'') IS NOT NULL'                     || E'\n'
         || '        AND nfj.score_id = (r ->> ''whs_score_id'')::uuid;';
  v_to   := '  FROM jsonb_array_elements(v_out) AS r;';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'reverse site 4: expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  -- ---- reverse site 3: the three new facts ---------------------------------
  v_from := '      ''hcp_at_time'', r -> ''hcp_at_time'','                        || E'\n'
         || '      -- C4. All three share the net gate. net_record is FALSE-out,' || E'\n'
         || '      -- not null-out, so a card can tell "no crown" from "no data"' || E'\n'
         || '      -- only through the presence of course_handicap beside it.'    || E'\n'
         || '      ''course_handicap'', to_jsonb(nfj.course_handicap),'            || E'\n'
         || '      ''net_record'', to_jsonb(nfj.net_record),'                      || E'\n'
         || '      ''handicap_cut'', nfj.handicap_cut,';
  v_to   := '      ''hcp_at_time'', r -> ''hcp_at_time'',';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'reverse site 3: expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  -- ---- reverse site 2: the gated net becomes the original ungated one ------
  v_from := '      ''to_par'', r -> ''to_par'','                                  || E'\n'
         || '      -- GATED NET, from the viewer-checked lookup. A player whose'  || E'\n'
         || '      -- handicap is withheld carries no net: gross minus net is'    || E'\n'
         || '      -- the handicap.'                                              || E'\n'
         || '      ''net'', to_jsonb(nfj.net_score),';
  v_to   := '      ''to_par'', r -> ''to_par'', ''net'', r -> ''net_score'',';
  v_n := (length(v_new) - length(replace(v_new, v_from, ''))) / greatest(length(v_from), 1);
  IF v_n <> 1 THEN RAISE EXCEPTION 'reverse site 2: expected 1 hit, found %', v_n; END IF;
  v_new := replace(v_new, v_from, v_to);

  -- ---- reverse site 1: strip the page-scoped CTE block ---------------------
  -- Everything from the fingerprint comment down to the reinstated projection
  -- is removed by matching on the two stable ends of the block.
  v_n := (length(v_new) - length(replace(v_new, '  -- v_net_facts:', ''))) / length('  -- v_net_facts:');
  IF v_n <> 1 THEN RAISE EXCEPTION 'reverse site 1: expected 1 fingerprint block, found %', v_n; END IF;

  v_new := regexp_replace(
             v_new,
             '  -- v_net_facts:.*?  SELECT\n    r ->> ''cid'',',
             '  RETURN QUERY' || E'\n' || '  SELECT' || E'\n' || '    r ->> ''cid'',',
             'n');

  IF v_new LIKE '%v_net_facts%'  THEN RAISE EXCEPTION 'reverse site 1 left the fingerprint behind'; END IF;
  IF v_new LIKE '%net_facts nfj%' THEN RAISE EXCEPTION 'reverse site 1 left the lookup behind'; END IF;
  IF v_new LIKE '%handicap_cut%'  THEN RAISE EXCEPTION 'reverse left a handicap_cut reference'; END IF;

  IF md5(v_new) <> c_good THEN
    RAISE EXCEPTION 'reverse produced % (% bytes), not the recorded pre-patch % - do NOT install it',
      md5(v_new), length(v_new), c_good;
  END IF;

  EXECUTE v_new;
  RAISE NOTICE 'rolled back to % (% bytes)', md5(v_new), length(v_new);
END
$rollback$;

COMMIT;

-- Read the body back and prove it runs (this is the check the forward patch
-- lacked; the rollback is not finished until a real call returns rows).
SELECT md5(pg_get_functiondef(p.oid)) AS md5_now
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

SELECT count(*) AS rows_returned
  FROM public.get_explore_stream(
    (SELECT id FROM auth.users WHERE email = 'benjamin@clbhouz.co.uk'),
    'all', 'world', NULL, 12, NULL, NULL, NULL);
