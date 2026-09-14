-- =====================================================================
-- EXPLORE STREAM — THE FIELD COUNT BECOMES A JOIN
-- =====================================================================
-- Ben runs this. UNAPPLIED as written. No backslash meta-commands.
--
-- THE FAULT. `shaped` reached the contest floor's field count with a
-- correlated scalar sub-select:
--
--   (SELECT coalesce(f.players, 0) FROM field f WHERE f.course_id = p.course_id)
--
-- Postgres INLINED the `field` CTE and ran the whole WHS field aggregation
-- once per candidate — 3,519 times for an aggregate that costs ~6 ms standing
-- alone. Measured, as postgres:
--
--   correlated scalar          1,949.6 ms   ~1,617,482 shared hits
--   materialised + LEFT JOIN      69.0 ms       ~4,700 shared hits
--   materialised + inner join      9.7 ms        3,791 shared hits
--
-- Under RLS that amplification was multiplied again and the function hit the
-- authenticated 8-second statement timeout (57014) on every load.
--
-- LEFT JOIN, NOT THE INNER JOIN. The inner join is 60 ms cheaper and NOT
-- semantically equivalent: `pool` carries story, review and course rows with a
-- NULL course_id, and rounds at courses with no reviewed WHS mapping have no
-- `field` row at all. An inner join would DROP those candidates. The floor's
-- own contract is that a missing mapping counts 0 and the claim is withheld —
-- withheld, not the row deleted. So the LEFT JOIN is taken.
--
-- MATERIALIZED IS EXPLICIT. The inlining is the entire fault; an un-hinted CTE
-- is free to repeat it after any future edit.
--
-- WHAT DOES NOT CHANGE. `is_record_shown = is_record_round AND course_players
-- >= 2` is untouched, and so is every consequence branch reading it. The count
-- is reached differently; the rule is identical, and the 16 false single-player
-- record claims stay suppressed (a course absent from `field` still yields 0
-- via coalesce, exactly as the sub-select did).
-- =====================================================================

DO $patch$
DECLARE
  v_src   text;
  v_new   text;
  v_hits  int;
  c_md5   constant text := '9bcdaf9ad5a26db868576e66a689c93f';

  -- site 1: the CTE keyword
  k1_old constant text := '    field AS (' || E'\n' ||
    '      SELECT m.golf_course_id AS course_id, count(DISTINCT wc.user_id)::int AS players';
  k1_new constant text := '    field AS MATERIALIZED (' || E'\n' ||
    '      SELECT m.golf_course_id AS course_id, count(DISTINCT wc.user_id)::int AS players';

  -- site 2: the correlated scalar becomes a plain column off the join
  k2_old constant text :=
    '        (SELECT coalesce(f.players, 0) FROM field f WHERE f.course_id = p.course_id)' || E'\n' ||
    '          AS course_players,';
  k2_new constant text :=
    '        -- A PER-COURSE LOOKUP IS A JOIN, NEVER A CORRELATED SUB-SELECT.' || E'\n' ||
    '        -- This aggregate costs 6 ms once and 1,950 ms per-candidate. It' || E'\n' ||
    '        -- arrived with the record floor - the field >= 2 rule was right,' || E'\n' ||
    '        -- the way it reached the count was not - and it cost roughly' || E'\n' ||
    '        -- 4,000x read amplification, which RLS then multiplied by four.' || E'\n' ||
    '        coalesce(f.players, 0) AS course_players,';

  -- site 3: the join itself, LEFT so no candidate is ever dropped
  k3_old constant text :=
    '        (SELECT last_seen_at FROM stamp) AS seen_at' || E'\n' ||
    '      FROM pool p';
  k3_new constant text :=
    '        (SELECT last_seen_at FROM stamp) AS seen_at' || E'\n' ||
    '      FROM pool p' || E'\n' ||
    '      -- LEFT: stories, reviews and courses have no course_id, and a round' || E'\n' ||
    '      -- at an unmapped course has no field row. Both must still be' || E'\n' ||
    '      -- candidates and both must count 0, which is what the floor means by' || E'\n' ||
    '      -- fail closed. An inner join would delete them to save 60 ms.' || E'\n' ||
    '      LEFT JOIN field f ON f.course_id = p.course_id';
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_src
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

  IF v_src IS NULL THEN
    RAISE EXCEPTION 'get_explore_stream(8 args) not found';
  END IF;
  IF md5(v_src) <> c_md5 THEN
    RAISE EXCEPTION 'chain guard: deployed body is %, expected %', md5(v_src), c_md5;
  END IF;

  v_new := v_src;

  v_hits := (length(v_new) - length(replace(v_new, k1_old, ''))) / length(k1_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 1 (field CTE) matched %', v_hits; END IF;
  v_new := replace(v_new, k1_old, k1_new);

  v_hits := (length(v_new) - length(replace(v_new, k2_old, ''))) / length(k2_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 2 (scalar sub-select) matched %', v_hits; END IF;
  v_new := replace(v_new, k2_old, k2_new);

  v_hits := (length(v_new) - length(replace(v_new, k3_old, ''))) / length(k3_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 3 (shaped FROM) matched %', v_hits; END IF;
  v_new := replace(v_new, k3_old, k3_new);

  -- the floor must survive verbatim
  IF position('(s.is_record_round AND coalesce(s.course_players, 0) >= 2) AS is_record_shown' in v_new) = 0 THEN
    RAISE EXCEPTION 'record floor missing after patch';
  END IF;
  IF position('FROM field f WHERE f.course_id = p.course_id' in v_new) > 0 THEN
    RAISE EXCEPTION 'correlated sub-select still present';
  END IF;

  EXECUTE v_new;
END
$patch$;

-- Verification (read-only).
SELECT md5(pg_get_functiondef(p.oid)) AS new_md5,
       length(pg_get_functiondef(p.oid)) AS new_len,
       p.prosecdef AS security_definer,
       p.provolatile AS volatility,
       p.proconfig  AS config,
       pg_get_functiondef(p.oid) LIKE '%field AS MATERIALIZED%' AS materialised,
       pg_get_functiondef(p.oid) LIKE '%LEFT JOIN field f ON f.course_id = p.course_id%' AS joined,
       pg_get_functiondef(p.oid) LIKE '%>= 2) AS is_record_shown%' AS floor_intact
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public' AND routine_name = 'get_explore_stream';
