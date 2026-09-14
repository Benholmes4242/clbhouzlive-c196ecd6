-- =====================================================================
-- EXPLORE -- (1) THE COURSE-RECORD CONTEST FLOOR, (2) THE PER-AUTHOR CAP
-- Draft for Ben to run. NOT applied by the agent. No backslash
-- meta-commands: this file pastes into the Supabase SQL editor as-is.
--
-- Built ON the DEPLOYED body of public.get_explore_stream:
--   pg_get_functiondef md5 = 7e360caaa341930b2bae68bf8180808a  (34690 bytes)
--   (that is the gap-damp body, verified live)
--
-- WHY A TEXT PATCH, NOT A RE-PASTE
-- The deployed body is 34kB of accepted D1-D6 + gap-damp logic. Re-typing it
-- is the one way to change something else by accident. This script asserts
-- the deployed md5, performs a fixed list of exact string replacements,
-- asserts each hit exactly once, and re-creates the function from its own
-- definition. Every byte outside those sites is unchanged by construction.
-- If the deployed body has moved, the script aborts and changes nothing.
--
-- =====================================================================
-- PART 1 -- THE CONTEST FLOOR ON record_taken AND record_lost
-- =====================================================================
-- A course record is a CONTEST: it has to be taken from somebody. The stream
-- was announcing a solo first round at an unplayed course as a course record
-- (16 such claims live, all with a field of one). The floor is
-- CROWN_MIN_OTHERS = 1 other player, i.e. a course-wide distinct-player count
-- of at least 2 including the subject -- the same one floor documented in
-- src/lib/gam/fieldGate.ts. NOT a second definition.
--
-- THE COUNT IS THE SHARED ONE. get_course_field_sizes counts distinct players
-- with a scored round at the course through the reviewed / high-confidence WHS
-- mapping. It cannot be CALLED per row here (it is SECURITY DEFINER, takes an
-- excluded member, and this is one set-based query), so the same count is
-- computed inline from the same three tables with the same predicates, in a
-- CTE named field. st.field_now is deliberately NOT used: it is null for every
-- course the VIEWER has not played, so it would fail open on exactly the solo
-- claims this floor exists to stop.
--
-- WHAT THE 16 BECOME: the existing CASE carries them to platform_notable or to
-- no consequence -- a plain card, which is what a first round at an unplayed
-- course is. Nothing else is added for them.
--
-- THE FACT IS GATED WITH THE CONSEQUENCE. facts.is_course_record drives the
-- client kicker independently of the consequence (exploreCopy.tsx), so a floor
-- on the consequence alone would still print the words. Both now read one
-- derived column, is_record_shown.
--
-- DELIBERATELY UNCHANGED, FILED: the notability ladder still scores
-- is_record_round = 4, and platform_notable still lists is_record_round among
-- its triggers. Both are weights, not claims, and changing them would reorder
-- pages beyond the ruling. Filed for Ben rather than done quietly.
--
-- =====================================================================
-- PART 2 -- THE PER-AUTHOR PAGE CAP, AND THE RELAXATION THAT HONOURS IT
-- =====================================================================
-- 1. The all-view cadence key gains the author: kind:ring:author. The
--    single-type views key on the consequence alone and are untouched.
-- 2. A HARD per-author page cap of 3 (config key author_page_cap). A hard SKIP,
--    never a deferral: a deferral asks to place the card later on this same
--    page, which is precisely what the cap refuses.
-- 3. THE RELAXATION HONOURS THE CAP. This is the root cause of the
--    seven-consecutive-cards run: cadence DID detect the repeat and defer it,
--    and the relaxation pass then appended the queue with no cadence test at
--    all. The relaxation's purpose stands -- a page must not go short because
--    cadence could not place a card, and it may relax KIND and RING for that.
--    It may NEVER relax the author cap. A card over the cap is dropped from
--    the queue rather than placed.
--
-- The cap is PAGE-LOCAL (v_auth is reset on every call), so a busy member can
-- lead page 1 and reappear on page 2. It is applied at every placement site,
-- including the backlog tails, because it is a cap on the PAGE.
-- =====================================================================

BEGIN;

DO $patch$
DECLARE
  v_src text; v_new text; v_md5 text; v_hits int;

  -- 1. DECLARE ------------------------------------------------------------
  k1_old text := '  c_gap_half numeric; c_gap_grace numeric; c_gap_floor numeric;';
  k1_new text := '  c_gap_half numeric; c_gap_grace numeric; c_gap_floor numeric;'
    || E'\n  c_auth_cap integer;                    -- cards ONE author may hold on a page'
    || E'\n  v_auth     jsonb := ''{}''::jsonb;       -- author -> cards placed on THIS page';

  -- 2. CONFIG READ --------------------------------------------------------
  k2_old text :=
    '    least(greatest(coalesce(max(value) FILTER (WHERE key = ''gap_damp_floor''), 0.02), 0), 1)' || E'\n' ||
    '  INTO c_w_cons, c_w_ring, c_w_fresh, c_w_not, c_half, c_story, c_seen, c_gap,' || E'\n' ||
    '       v_limit, c_back, c_news, c_gap_half, c_gap_grace, c_gap_floor';
  k2_new text :=
    '    least(greatest(coalesce(max(value) FILTER (WHERE key = ''gap_damp_floor''), 0.02), 0), 1),' || E'\n' ||
    '    greatest(coalesce(max(value) FILTER (WHERE key = ''author_page_cap''), 3)::int, 1)' || E'\n' ||
    '  INTO c_w_cons, c_w_ring, c_w_fresh, c_w_not, c_half, c_story, c_seen, c_gap,' || E'\n' ||
    '       v_limit, c_back, c_news, c_gap_half, c_gap_grace, c_gap_floor, c_auth_cap';

  -- 3. THE FIELD CTE ------------------------------------------------------
  k3_old text :=
    '    lost AS (' || E'\n' ||
    '      SELECT DISTINCT (n.data ->> ''course_id'') AS course_id, (n.data ->> ''taken_by'') AS taken_by';
  k3_new text :=
    '    -- THE CONTEST FLOOR''S COUNT. Distinct players with a scored round at' || E'\n' ||
    '    -- the course, through the reviewed / high-confidence WHS mapping: the' || E'\n' ||
    '    -- same count get_course_field_sizes returns, from the same three tables' || E'\n' ||
    '    -- with the same predicates. That function cannot be called per row here' || E'\n' ||
    '    -- (SECURITY DEFINER, one excluded member per call), so the count is' || E'\n' ||
    '    -- computed once for every course. It is COURSE-WIDE and includes the' || E'\n' ||
    '    -- subject, so the floor below reads >= 2 for CROWN_MIN_OTHERS = 1.' || E'\n' ||
    '    -- A course whose mapping is missing counts 0 and the claim is withheld:' || E'\n' ||
    '    -- fail closed, because an unprovable record is not a record.' || E'\n' ||
    '    field AS (' || E'\n' ||
    '      SELECT m.golf_course_id AS course_id, count(DISTINCT wc.user_id)::int AS players' || E'\n' ||
    '      FROM public.whs_to_golf_course_map m' || E'\n' ||
    '      JOIN public.whs_scores ws      ON ws.course_id = m.whs_course_id' || E'\n' ||
    '      JOIN public.whs_connections wc ON wc.id = ws.connection_id' || E'\n' ||
    '      WHERE wc.deleted_at IS NULL' || E'\n' ||
    '        AND (m.reviewed_at IS NOT NULL OR m.match_confidence >= 0.70)' || E'\n' ||
    '      GROUP BY m.golf_course_id' || E'\n' ||
    '    ),' || E'\n' ||
    k3_old;

  -- 4. SHAPED CARRIES THE COUNT ------------------------------------------
  k4_old text :=
    '    shaped AS (' || E'\n' ||
    '      SELECT p.*,' || E'\n' ||
    '        CASE' || E'\n' ||
    '          WHEN p.kind = ''story'' THEN NULL';
  k4_new text :=
    '    shaped AS (' || E'\n' ||
    '      SELECT p.*,' || E'\n' ||
    '        (SELECT coalesce(f.players, 0) FROM field f WHERE f.course_id = p.course_id)' || E'\n' ||
    '          AS course_players,' || E'\n' ||
    '        CASE' || E'\n' ||
    '          WHEN p.kind = ''story'' THEN NULL';

  -- 5. THE FLOOR ON BOTH RECORD CONSEQUENCES ------------------------------
  k5_old text :=
    '    typed AS (' || E'\n' ||
    '      SELECT s.*,' || E'\n' ||
    '        CASE' || E'\n' ||
    '          WHEN s.kind = ''round'' AND s.is_record_round AND NOT s.is_self AND s.record_lost_to_them THEN ''record_lost''' || E'\n' ||
    '          WHEN s.kind = ''round'' AND s.is_record_round THEN ''record_taken''';
  k5_new text :=
    '    typed AS (' || E'\n' ||
    '      SELECT s.*,' || E'\n' ||
    '        -- A RECORD NEEDS SOMEBODY TO HAVE TAKEN IT FROM. One floor, one' || E'\n' ||
    '        -- count (see the field CTE): CROWN_MIN_OTHERS = 1 other player,' || E'\n' ||
    '        -- which is a course-wide count of 2 including the subject. Both the' || E'\n' ||
    '        -- consequence and the FACT read this column, because the client' || E'\n' ||
    '        -- kicker prints the record wording from the fact alone.' || E'\n' ||
    '        (s.is_record_round AND coalesce(s.course_players, 0) >= 2) AS is_record_shown,' || E'\n' ||
    '        CASE' || E'\n' ||
    '          WHEN s.kind = ''round'' AND s.is_record_round AND coalesce(s.course_players, 0) >= 2' || E'\n' ||
    '               AND NOT s.is_self AND s.record_lost_to_them THEN ''record_lost''' || E'\n' ||
    '          WHEN s.kind = ''round'' AND s.is_record_round AND coalesce(s.course_players, 0) >= 2' || E'\n' ||
    '               THEN ''record_taken''';

  -- 6. THE ALL-VIEW CADENCE KEY GAINS THE AUTHOR --------------------------
  k6_old text :=
    '          ELSE coalesce(t.kind, ''none'') || '':'' || coalesce(t.ring_k, ''none'')' || E'\n' ||
    '        END AS cad_k';
  k6_new text :=
    '          -- kind:ring:AUTHOR. Without the author, two cards from the same' || E'\n' ||
    '          -- member in the same ring share a key, are detected as a repeat,' || E'\n' ||
    '          -- and go to the deferral queue - which the relaxation pass used to' || E'\n' ||
    '          -- empty without any cadence test. The author cap below is the hard' || E'\n' ||
    '          -- guarantee; this key is what spaces a member out inside it.' || E'\n' ||
    '          ELSE coalesce(t.kind, ''none'') || '':'' || coalesce(t.ring_k, ''none'')' || E'\n' ||
    '               || '':'' || coalesce(t.user_id::text, ''none'')' || E'\n' ||
    '        END AS cad_k';

  -- 7. THE HARD SKIP, BEFORE THE OUTER-RING CAP ---------------------------
  k7_old text :=
    '    -- THE OUTER-RING CAP IS AN ALL-VIEW RULE (header note 4).' || E'\n' ||
    '    IF v_view = ''all'' AND v_row.ring_k IN (''county'',''country'',''world'') AND v_since_outer < c_gap THEN';
  k7_new text :=
    '    -- THE PER-AUTHOR PAGE CAP. A HARD SKIP, NOT A DEFERRAL: a deferral is a' || E'\n' ||
    '    -- request to place this card later on THIS page, which is exactly what' || E'\n' ||
    '    -- the cap refuses. It is tested before the ring and cadence rules so' || E'\n' ||
    '    -- that an over-cap card never enters the queue at all.' || E'\n' ||
    '    IF v_row.user_id IS NOT NULL' || E'\n' ||
    '       AND coalesce((v_auth ->> v_row.user_id::text)::int, 0) >= c_auth_cap THEN' || E'\n' ||
    '      CONTINUE;' || E'\n' ||
    '    END IF;' || E'\n' ||
    E'\n' ||
    k7_old;

  -- 8. MAIN PLACEMENT COUNTS THE AUTHOR -----------------------------------
  k8_old text :=
    '    v_out := v_out || jsonb_build_array(to_jsonb(v_row) || jsonb_build_object(''relaxed'', false));' || E'\n' ||
    '    v_prev_key := coalesce(v_row.cad_k,''none'');';
  k8_new text :=
    '    v_out := v_out || jsonb_build_array(to_jsonb(v_row) || jsonb_build_object(''relaxed'', false));' || E'\n' ||
    '    IF v_row.user_id IS NOT NULL THEN' || E'\n' ||
    '      v_auth := v_auth || jsonb_build_object(v_row.user_id::text,' || E'\n' ||
    '                  coalesce((v_auth ->> v_row.user_id::text)::int, 0) + 1);' || E'\n' ||
    '    END IF;' || E'\n' ||
    '    v_prev_key := coalesce(v_row.cad_k,''none'');';

  -- 9. THE INLINE DEFERRAL POP --------------------------------------------
  k9_old text :=
    '        IF NOT (v_view = ''all'' AND (d ->> ''ring_k'') IN (''county'',''country'',''world'') AND v_since_outer < c_gap)' || E'\n' ||
    '           AND v_prev_key IS DISTINCT FROM (coalesce(d ->> ''cad_k'',''none'')) THEN' || E'\n' ||
    '          v_out := v_out || jsonb_build_array(d || jsonb_build_object(''relaxed'', false));' || E'\n' ||
    '          v_deferred := v_deferred - 0;';
  k9_new text :=
    '        IF NOT (v_view = ''all'' AND (d ->> ''ring_k'') IN (''county'',''country'',''world'') AND v_since_outer < c_gap)' || E'\n' ||
    '           AND v_prev_key IS DISTINCT FROM (coalesce(d ->> ''cad_k'',''none''))' || E'\n' ||
    '           -- the cap holds here too: a queued card is still a page card' || E'\n' ||
    '           AND coalesce((v_auth ->> coalesce(d ->> ''user_id'', ''-''))::int, 0) < c_auth_cap THEN' || E'\n' ||
    '          v_out := v_out || jsonb_build_array(d || jsonb_build_object(''relaxed'', false));' || E'\n' ||
    '          IF (d ->> ''user_id'') IS NOT NULL THEN' || E'\n' ||
    '            v_auth := v_auth || jsonb_build_object(d ->> ''user_id'',' || E'\n' ||
    '                        coalesce((v_auth ->> (d ->> ''user_id''))::int, 0) + 1);' || E'\n' ||
    '          END IF;' || E'\n' ||
    '          v_deferred := v_deferred - 0;';

  -- 10. THE RELAXATION PASS -----------------------------------------------
  k10_old text :=
    '    v_out := v_out || jsonb_build_array((v_deferred -> 0) || jsonb_build_object(''relaxed'', true));' || E'\n' ||
    '    v_prev_key := coalesce(v_deferred -> 0 ->> ''cad_k'',''none'');';
  k10_new text :=
    '    -- WHAT A RELAXATION MAY AND MAY NOT RELAX. Its purpose is that a page' || E'\n' ||
    '    -- must not go SHORT because cadence could not place a card, and for' || E'\n' ||
    '    -- that it may relax KIND and RING. It may NEVER relax the author cap:' || E'\n' ||
    '    -- a relaxation that discards every guarantee whenever the queue is' || E'\n' ||
    '    -- non-empty is not a relaxation, it is a bypass. An over-cap card is' || E'\n' ||
    '    -- dropped from the queue rather than placed.' || E'\n' ||
    '    IF (v_deferred -> 0 ->> ''user_id'') IS NOT NULL' || E'\n' ||
    '       AND coalesce((v_auth ->> (v_deferred -> 0 ->> ''user_id''))::int, 0) >= c_auth_cap THEN' || E'\n' ||
    '      v_deferred := v_deferred - 0;' || E'\n' ||
    '      CONTINUE;' || E'\n' ||
    '    END IF;' || E'\n' ||
    E'\n' ||
    '    v_out := v_out || jsonb_build_array((v_deferred -> 0) || jsonb_build_object(''relaxed'', true));' || E'\n' ||
    '    IF (v_deferred -> 0 ->> ''user_id'') IS NOT NULL THEN' || E'\n' ||
    '      v_auth := v_auth || jsonb_build_object(v_deferred -> 0 ->> ''user_id'',' || E'\n' ||
    '                  coalesce((v_auth ->> (v_deferred -> 0 ->> ''user_id''))::int, 0) + 1);' || E'\n' ||
    '    END IF;' || E'\n' ||
    '    v_prev_key := coalesce(v_deferred -> 0 ->> ''cad_k'',''none'');';

  -- 11. THE BACKLOG TAIL, EXHAUSTED-NEWS CASE -----------------------------
  k11_old text :=
    '      v_out := v_out || jsonb_build_array((v_back_hold -> 0) || jsonb_build_object(''relaxed'', true));' || E'\n' ||
    '      v_prev_key := coalesce(v_back_hold -> 0 ->> ''cad_k'',''none'');' || E'\n' ||
    '      v_since_outer := 0;';
  k11_new text :=
    '      -- The cap is a cap on the PAGE, so the backlog tail honours it too.' || E'\n' ||
    '      IF (v_back_hold -> 0 ->> ''user_id'') IS NOT NULL' || E'\n' ||
    '         AND coalesce((v_auth ->> (v_back_hold -> 0 ->> ''user_id''))::int, 0) >= c_auth_cap THEN' || E'\n' ||
    '        v_back_hold := v_back_hold - 0;' || E'\n' ||
    '        v_back_left := greatest(v_back_left - 1, 0);' || E'\n' ||
    '        CONTINUE;' || E'\n' ||
    '      END IF;' || E'\n' ||
    '      v_out := v_out || jsonb_build_array((v_back_hold -> 0) || jsonb_build_object(''relaxed'', true));' || E'\n' ||
    '      IF (v_back_hold -> 0 ->> ''user_id'') IS NOT NULL THEN' || E'\n' ||
    '        v_auth := v_auth || jsonb_build_object(v_back_hold -> 0 ->> ''user_id'',' || E'\n' ||
    '                    coalesce((v_auth ->> (v_back_hold -> 0 ->> ''user_id''))::int, 0) + 1);' || E'\n' ||
    '      END IF;' || E'\n' ||
    '      v_prev_key := coalesce(v_back_hold -> 0 ->> ''cad_k'',''none'');' || E'\n' ||
    '      v_since_outer := 0;';

  -- 12. THE BACKLOG TAIL, ALLOWANCE CASE ----------------------------------
  k12_old text :=
    '      v_out := v_out || jsonb_build_array((v_back_hold -> 0) || jsonb_build_object(''relaxed'', true));' || E'\n' ||
    '      v_prev_key := coalesce(v_back_hold -> 0 ->> ''cad_k'',''none'');' || E'\n' ||
    '      v_since_outer := CASE WHEN (v_back_hold -> 0 ->> ''ring_k'') IN (''county'',''country'',''world'') THEN 0';
  k12_new text :=
    '      IF (v_back_hold -> 0 ->> ''user_id'') IS NOT NULL' || E'\n' ||
    '         AND coalesce((v_auth ->> (v_back_hold -> 0 ->> ''user_id''))::int, 0) >= c_auth_cap THEN' || E'\n' ||
    '        v_back_hold := v_back_hold - 0;' || E'\n' ||
    '        v_back_left := greatest(v_back_left - 1, 0);' || E'\n' ||
    '        CONTINUE;' || E'\n' ||
    '      END IF;' || E'\n' ||
    '      v_out := v_out || jsonb_build_array((v_back_hold -> 0) || jsonb_build_object(''relaxed'', true));' || E'\n' ||
    '      IF (v_back_hold -> 0 ->> ''user_id'') IS NOT NULL THEN' || E'\n' ||
    '        v_auth := v_auth || jsonb_build_object(v_back_hold -> 0 ->> ''user_id'',' || E'\n' ||
    '                    coalesce((v_auth ->> (v_back_hold -> 0 ->> ''user_id''))::int, 0) + 1);' || E'\n' ||
    '      END IF;' || E'\n' ||
    '      v_prev_key := coalesce(v_back_hold -> 0 ->> ''cad_k'',''none'');' || E'\n' ||
    '      v_since_outer := CASE WHEN (v_back_hold -> 0 ->> ''ring_k'') IN (''county'',''country'',''world'') THEN 0';

  -- 13. THE FACT READS THE FLOORED COLUMN ---------------------------------
  k13_old text := '      ''clean_card'', r -> ''clean_card'', ''is_course_record'', r -> ''is_record_round'',';
  k13_new text := '      ''clean_card'', r -> ''clean_card'', ''is_course_record'', r -> ''is_record_shown'',';

BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_src
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;
  IF v_src IS NULL THEN
    RAISE EXCEPTION 'get_explore_stream(8 args) not found - nothing patched';
  END IF;

  v_md5 := md5(v_src);
  IF v_md5 <> '7e360caaa341930b2bae68bf8180808a' THEN
    RAISE EXCEPTION 'deployed md5 is %, expected 7e360caaa341930b2bae68bf8180808a - the body moved since this draft; re-draft rather than patch blind', v_md5;
  END IF;

  v_new := v_src;

  v_hits := (length(v_new) - length(replace(v_new, k1_old, ''))) / length(k1_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 1 (DECLARE) matched %', v_hits; END IF;
  v_new := replace(v_new, k1_old, k1_new);

  v_hits := (length(v_new) - length(replace(v_new, k2_old, ''))) / length(k2_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 2 (config) matched %', v_hits; END IF;
  v_new := replace(v_new, k2_old, k2_new);

  v_hits := (length(v_new) - length(replace(v_new, k3_old, ''))) / length(k3_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 3 (field CTE) matched %', v_hits; END IF;
  v_new := replace(v_new, k3_old, k3_new);

  v_hits := (length(v_new) - length(replace(v_new, k4_old, ''))) / length(k4_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 4 (shaped) matched %', v_hits; END IF;
  v_new := replace(v_new, k4_old, k4_new);

  v_hits := (length(v_new) - length(replace(v_new, k5_old, ''))) / length(k5_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 5 (record floor) matched %', v_hits; END IF;
  v_new := replace(v_new, k5_old, k5_new);

  v_hits := (length(v_new) - length(replace(v_new, k6_old, ''))) / length(k6_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 6 (cadence key) matched %', v_hits; END IF;
  v_new := replace(v_new, k6_old, k6_new);

  v_hits := (length(v_new) - length(replace(v_new, k7_old, ''))) / length(k7_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 7 (hard skip) matched %', v_hits; END IF;
  v_new := replace(v_new, k7_old, k7_new);

  v_hits := (length(v_new) - length(replace(v_new, k8_old, ''))) / length(k8_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 8 (main placement) matched %', v_hits; END IF;
  v_new := replace(v_new, k8_old, k8_new);

  v_hits := (length(v_new) - length(replace(v_new, k9_old, ''))) / length(k9_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 9 (deferral pop) matched %', v_hits; END IF;
  v_new := replace(v_new, k9_old, k9_new);

  v_hits := (length(v_new) - length(replace(v_new, k10_old, ''))) / length(k10_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 10 (relaxation) matched %', v_hits; END IF;
  v_new := replace(v_new, k10_old, k10_new);

  -- Sites 11 and 12 share their first two lines, so 11 is patched FIRST and
  -- its target is the one that sets v_since_outer := 0 (the exhausted-news
  -- loop). 12's target keeps the ring CASE, so the two are distinguishable.
  v_hits := (length(v_new) - length(replace(v_new, k11_old, ''))) / length(k11_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 11 (backlog, news exhausted) matched %', v_hits; END IF;
  v_new := replace(v_new, k11_old, k11_new);

  v_hits := (length(v_new) - length(replace(v_new, k12_old, ''))) / length(k12_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 12 (backlog, allowance) matched %', v_hits; END IF;
  v_new := replace(v_new, k12_old, k12_new);

  v_hits := (length(v_new) - length(replace(v_new, k13_old, ''))) / length(k13_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 13 (facts) matched %', v_hits; END IF;
  v_new := replace(v_new, k13_old, k13_new);

  EXECUTE v_new;
  RAISE NOTICE 'get_explore_stream patched: record floor + author cap, 13/13 sites replaced';
END
$patch$;

-- The body defaults to 3, so this row changes nothing on its own; it exists so
-- the cap is tunable without a deploy, like news_days and backlog_ratio.
INSERT INTO public.explore_config (key, value) VALUES ('author_page_cap', 3)
ON CONFLICT (key) DO NOTHING;

-- Verify before COMMIT. Owner, security mode, volatility, search_path and
-- grants are carried by pg_get_functiondef + CREATE OR REPLACE.
SELECT p.proname,
       p.prosecdef AS security_definer,
       p.provolatile AS volatility,
       p.proconfig AS search_path,
       pg_get_userbyid(p.proowner) AS owner,
       md5(pg_get_functiondef(p.oid)) AS new_md5,
       pg_get_functiondef(p.oid) LIKE '%is_record_shown%' AS has_record_floor,
       pg_get_functiondef(p.oid) LIKE '%c_auth_cap%'      AS has_author_cap
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

SELECT grantee, privilege_type
  FROM information_schema.routine_privileges
 WHERE routine_schema = 'public' AND routine_name = 'get_explore_stream';

COMMIT;
