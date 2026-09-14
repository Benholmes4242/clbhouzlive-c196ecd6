DO $patch$
DECLARE
  v_src text;
  v_new text;
  v_hits int;
  k1 text := '          WHEN s.kind = ''round'' AND s.is_self AND s.lane_k = ''news'' THEN ''played_nochange''' || E'\n';
  k2 text := '        (''rank_hold'',10),(''list_new_low'',9),(''list_first'',8),(''review_disagree'',7),' || E'\n';
  k3 text := '        (''played_nochange'',3),(''backlog_own_best'',2),(''platform_notable'',1)' || E'\n';
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_src
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'get_explore_stream'
    AND p.pronargs = 8;

  IF v_src IS NULL THEN
    RAISE EXCEPTION 'get_explore_stream(8 args) not found';
  END IF;

  IF md5(v_src) <> '7e35e667713569e5e1bec82ae6831f82'
     OR length(v_src) <> 45137 THEN
    RAISE EXCEPTION 'deployed body changed: md5 %, length %', md5(v_src), length(v_src);
  END IF;

  IF v_src NOT LIKE '%c_auth_cap%'
     OR v_src NOT LIKE '%gap_damp_floor%'
     OR v_src NOT LIKE '%is_record_shown%' THEN
    RAISE EXCEPTION 'required accepted stream patches are missing';
  END IF;

  v_new := v_src;

  v_hits := (length(v_new) - length(replace(v_new, k1, ''))) / length(k1);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'own-round emitter matched % sites', v_hits; END IF;
  v_new := replace(v_new, k1, '');

  v_hits := (length(v_new) - length(replace(v_new, k2, ''))) / length(k2);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'rank_hold weight matched % sites', v_hits; END IF;
  v_new := replace(v_new, k2,
    '        (''list_new_low'',9),(''list_first'',8),(''review_disagree'',7),' || E'\n');

  v_hits := (length(v_new) - length(replace(v_new, k3, ''))) / length(k3);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'played_nochange weight matched % sites', v_hits; END IF;
  v_new := replace(v_new, k3,
    '        (''backlog_own_best'',2),(''platform_notable'',1)' || E'\n');

  -- The retirement is asserted on the EMITTER and the WEIGHTS, not on the
  -- absence of the strings. Comments that record the history stay.
  IF v_new LIKE '%THEN ''played_nochange''%' THEN RAISE EXCEPTION 'played_nochange still emitted'; END IF;
  IF v_new LIKE '%THEN ''rank_hold''%'       THEN RAISE EXCEPTION 'rank_hold still emitted'; END IF;
  IF v_new LIKE '%(''played_nochange'',%'    THEN RAISE EXCEPTION 'played_nochange weight remains'; END IF;
  IF v_new LIKE '%(''rank_hold'',%'          THEN RAISE EXCEPTION 'rank_hold weight remains'; END IF;
  IF v_new NOT LIKE '%THEN ''rank_up''%'     THEN RAISE EXCEPTION 'rank_up branch was not preserved'; END IF;
  IF v_new NOT LIKE '%OR (t.kind = ''round'' AND t.rank_now IS NOT NULL%'
    THEN RAISE EXCEPTION 'plain-round candidacy was not preserved'; END IF;

  EXECUTE v_new;
END
$patch$;