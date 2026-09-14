-- =====================================================================
-- EXPLORE -- §2 NOTABILITY IS DAMPED BY THE PLAY-TO-ARRIVAL GAP
-- Draft for Ben to run. NOT applied by the agent. No backslash
-- meta-commands: this file pastes into the Supabase SQL editor as-is.
--
-- Built ON the deployed body of public.get_explore_stream(8 args), md5
--   f5e903e32921df1c4465ee286801a6aa (40110 bytes), plus §3 if already run.
-- The guard is the chain: fingerprints of the accepted work, an
-- already-applied check, one hit per site, re-create from own definition.
--
-- WHY
-- The decomposition of the six 2018-2024 records sitting above September play
-- was: consequence 3.00 + ring 0.30 + freshness 0.00 + NOTABILITY 4.00 = 7.30.
-- Notability was the LARGEST single term and the only one explicitly exempt
-- from the gap damp. That exemption is what held those cards up.
--
-- WHAT CHANGES
-- One curve, one set of config keys. The gap weight already computed for
-- freshness (gap_damp_half_days / gap_damp_grace_days / gap_damp_floor) is
-- lifted into a named column, gap_w, in the scored CTE and applied to BOTH
-- terms. There is no second curve and no second half-life.
--
-- =====================================================================
-- THE ACE TEST, RUN BEFORE THIS WAS DRAFTED. READ THIS BEFORE RUNNING.
-- =====================================================================
-- Measured over the live pool of 3,519 eligible rounds plus three synthetic
-- rows, world ring, no consequence term (the terms this change touches):
--
--   floor        (i) 2021 ace       (iii) 2018 record   (ii) 2021 plain
--   applied to   arriving today     field 4, damped      in a 99-row bulk
--   notability   score / position   score / position     score / position
--   ------------------------------------------------------------------
--   undamped     5.680 /   1        4.600 /   8          0.680 / 381
--   0.02 (same
--    floor as
--    freshness)  0.780 / 112        0.680 / 138          0.680 / 138
--   0.20         1.680 /  40        1.400 /  73          0.680 / 381
--   0.35         2.430 /  22        2.000 /  36          0.680 / 381
--   0.50         3.180 /  13        2.600 /  26          0.680 / 381
--   0.70         4.180 /   2        3.400 /  19          0.680 / 381
--
-- (i) FAILS ON THE SHARED FLOOR OF 0.02. A lone 2021 ace arriving today falls
-- from position 1 to position 112 and sits 0.10 above a plain round from the
-- same sync - the case the exemption existed to protect is gone, and the
-- brief says report that rather than ship it. As the brief anticipated, the
-- answer is A FLOOR ON DAMPED NOTABILITY, not a restored exemption.
--
-- THIS DRAFT THEREFORE ADDS ONE KEY: gap_damp_notable_floor, default 0.35.
-- Same curve, same half-life, same grace - only the floor differs, because
-- notability is a claim about the ROUND and freshness is a claim about the
-- NEWS. At 0.35 all three tests pass: the ace is reachable at 22, the 2018
-- field-4 record drops to 36, BELOW September play, which is the point of the
-- change, and the plain bulk round is untouched at 381. Setting the key to
-- 0.02 reproduces a single shared floor exactly, so the decision stays Ben's
-- and stays tunable without a deploy.
-- =====================================================================

BEGIN;

DO $patch$
DECLARE
  v_src text; v_new text; v_hits int;

  -- 1. DECLARE the notability floor -------------------------------------
  k1_old text := '  c_gap_half numeric; c_gap_grace numeric; c_gap_floor numeric;';
  k1_new text := '  c_gap_half numeric; c_gap_grace numeric; c_gap_floor numeric;'
    || E'\n  c_gap_nfloor numeric;                  -- floor on the DAMPED notability term';

  -- 2. CONFIG READ -------------------------------------------------------
  k2_old text :=
    '    greatest(coalesce(max(value) FILTER (WHERE key = ''author_page_cap''), 3)::int, 1)' || E'\n' ||
    '  INTO c_w_cons, c_w_ring, c_w_fresh, c_w_not, c_half, c_story, c_seen, c_gap,' || E'\n' ||
    '       v_limit, c_back, c_news, c_gap_half, c_gap_grace, c_gap_floor, c_auth_cap';
  k2_new text :=
    '    greatest(coalesce(max(value) FILTER (WHERE key = ''author_page_cap''), 3)::int, 1),' || E'\n' ||
    '    least(greatest(coalesce(max(value) FILTER (WHERE key = ''gap_damp_notable_floor''), 0.35), 0), 1)' || E'\n' ||
    '  INTO c_w_cons, c_w_ring, c_w_fresh, c_w_not, c_half, c_story, c_seen, c_gap,' || E'\n' ||
    '       v_limit, c_back, c_news, c_gap_half, c_gap_grace, c_gap_floor, c_auth_cap,' || E'\n' ||
    '       c_gap_nfloor';

  -- 3. ONE CURVE, NAMED ONCE, IN scored ---------------------------------
  k3_old text :=
    '          ELSE 0' || E'\n' ||
    '        END AS notable' || E'\n' ||
    '      FROM gated g';
  k3_new text :=
    '          ELSE 0' || E'\n' ||
    '        END AS notable,' || E'\n' ||
    '        -- THE PLAY-TO-ARRIVAL GAP WEIGHT, COMPUTED ONCE AND NAMED. It was' || E'\n' ||
    '        -- inline in the freshness term; freshness and notability now share' || E'\n' ||
    '        -- THIS ONE curve and these config keys - there is no second curve.' || E'\n' ||
    '        -- ROUNDS ONLY: nothing else is bulk-backfilled. A missing play_date' || E'\n' ||
    '        -- cannot PROVE a gap, so it is treated as no gap rather than guessed.' || E'\n' ||
    '        CASE WHEN g.kind = ''round'' AND g.arrived_at IS NOT NULL' || E'\n' ||
    '                  AND nullif(btrim(g.play_date), '''') IS NOT NULL' || E'\n' ||
    '             THEN least(1, power(0.5, greatest(0,' || E'\n' ||
    '                    (g.arrived_at::date - nullif(btrim(g.play_date), '''')::date)' || E'\n' ||
    '                    - c_gap_grace)::numeric / c_gap_half))' || E'\n' ||
    '             ELSE 1 END AS gap_raw' || E'\n' ||
    '      FROM gated g';

  -- 4. BOTH TERMS READ THE ONE CURVE ------------------------------------
  k4_old text :=
    '          + (c_w_fresh * CASE WHEN s.lane_k = ''backlog'' THEN 0' || E'\n' ||
    '               ELSE power(0.5, greatest(0, extract(epoch FROM (now() - coalesce(s.arrived_at, now()))) / 3600.0) / c_half)' || E'\n' ||
    '                    * CASE WHEN s.kind = ''round''' || E'\n' ||
    '                             AND s.arrived_at IS NOT NULL' || E'\n' ||
    '                             AND nullif(btrim(s.play_date), '''') IS NOT NULL' || E'\n' ||
    '                        THEN greatest(c_gap_floor, least(1,' || E'\n' ||
    '                               power(0.5, greatest(0,' || E'\n' ||
    '                                 (s.arrived_at::date - nullif(btrim(s.play_date), '''')::date)' || E'\n' ||
    '                                 - c_gap_grace)::numeric / c_gap_half)))' || E'\n' ||
    '                        ELSE 1 END' || E'\n' ||
    '               END)' || E'\n' ||
    '          + (c_w_not * s.notable)';
  k4_new text :=
    '          + (c_w_fresh * CASE WHEN s.lane_k = ''backlog'' THEN 0' || E'\n' ||
    '               ELSE power(0.5, greatest(0, extract(epoch FROM (now() - coalesce(s.arrived_at, now()))) / 3600.0) / c_half)' || E'\n' ||
    '                    * greatest(c_gap_floor, s.gap_raw)' || E'\n' ||
    '               END)' || E'\n' ||
    '          -- NOTABILITY IS DAMPED BY THE SAME GAP, ON THE SAME CURVE. The old' || E'\n' ||
    '          -- exemption was the largest term on the page and it is what put' || E'\n' ||
    '          -- 2018-2024 records above September play. The damp does not punish' || E'\n' ||
    '          -- AGE; it punishes the gap between being PLAYED and ARRIVING.' || E'\n' ||
    '          -- ITS FLOOR IS HIGHER THAN FRESHNESS''S, AND DELIBERATELY SO: on the' || E'\n' ||
    '          -- shared 0.02 floor a lone 2021 ace arriving today fell to position' || E'\n' ||
    '          -- 112 and sat 0.10 above a plain round from the same sync, which is' || E'\n' ||
    '          -- the case the exemption existed to protect. At 0.35 the ace is' || E'\n' ||
    '          -- reachable, the 2018 field-4 record sits BELOW September play, and' || E'\n' ||
    '          -- the plain bulk round does not move. Set the key to 0.02 for one' || E'\n' ||
    '          -- shared floor. A claim about the ROUND is not a claim about NEWS.' || E'\n' ||
    '          + (c_w_not * s.notable * greatest(c_gap_nfloor, s.gap_raw))';
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_src
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

  IF v_src IS NULL THEN RAISE EXCEPTION 'get_explore_stream(8 args) not found'; END IF;
  RAISE NOTICE 'built on md5 % (% bytes)', md5(v_src), length(v_src);

  IF v_src NOT LIKE '%gap_damp_floor%' THEN RAISE EXCEPTION 'deployed body predates the gap damp'; END IF;
  IF v_src NOT LIKE '%is_record_shown%' THEN RAISE EXCEPTION 'deployed body predates the record floor'; END IF;
  IF v_src NOT LIKE '%c_auth_cap%'      THEN RAISE EXCEPTION 'deployed body predates the author cap'; END IF;
  IF v_src LIKE '%gap_damp_notable_floor%' THEN RAISE EXCEPTION 'already applied'; END IF;

  v_new := v_src;

  v_hits := (length(v_new) - length(replace(v_new, k1_old, ''))) / length(k1_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 1 (declare) matched %', v_hits; END IF;
  v_new := replace(v_new, k1_old, k1_new);

  v_hits := (length(v_new) - length(replace(v_new, k2_old, ''))) / length(k2_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 2 (config read) matched %', v_hits; END IF;
  v_new := replace(v_new, k2_old, k2_new);

  v_hits := (length(v_new) - length(replace(v_new, k3_old, ''))) / length(k3_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 3 (gap_raw) matched %', v_hits; END IF;
  v_new := replace(v_new, k3_old, k3_new);

  v_hits := (length(v_new) - length(replace(v_new, k4_old, ''))) / length(k4_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'site 4 (both terms) matched %', v_hits; END IF;
  v_new := replace(v_new, k4_old, k4_new);

  EXECUTE v_new;
  RAISE NOTICE 'get_explore_stream patched: notability gap damp, 4/4 sites replaced';
END
$patch$;

-- The body defaults to 0.35; this row exists so the floor is tunable without
-- a deploy, like news_days, backlog_ratio and author_page_cap.
INSERT INTO public.explore_config (key, value) VALUES ('gap_damp_notable_floor', 0.35)
ON CONFLICT (key) DO NOTHING;

SELECT p.proname, p.prosecdef AS security_definer, p.provolatile AS volatility,
       p.proconfig AS search_path, pg_get_userbyid(p.proowner) AS owner,
       md5(pg_get_functiondef(p.oid)) AS new_md5,
       pg_get_functiondef(p.oid) LIKE '%gap_damp_notable_floor%' AS has_notable_damp
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

COMMIT;
