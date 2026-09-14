-- =====================================================================
-- EXPLORE — DAMP FRESHNESS BY THE PLAY-TO-ARRIVAL GAP
-- Draft for Ben to run. NOT applied by the agent.
--
-- Built ON the DEPLOYED body of public.get_explore_stream:
--   pg_get_functiondef md5 = 3e79b91d70884bbf845bdbe2abcc6f57  (33269 bytes)
--
-- WHY THIS IS A TEXT PATCH AND NOT A RE-PASTE
-- The deployed body is 33kB of accepted D1-D6 logic (lane rule, cadence pass,
-- outer-ring cap, cursor, consequence assignment, standing reuse). Re-pasting
-- it by hand is the one way to silently change something else. This script
-- therefore asserts the deployed md5, performs THREE exact string
-- replacements, asserts each one hit exactly once, and re-creates the function
-- from its own definition. Every byte outside those three sites is unchanged
-- by construction. If the deployed body ever differs from the md5 above, the
-- script aborts and changes nothing.
--
-- WHAT CHANGES
--   effective_freshness = freshness(arrived_at) * gap_damp(play_to_arrival)
-- Freshness still keys on ARRIVAL. The lane rule is untouched: backlog still
-- zeroes freshness outright. The damp shapes the NEWS lane only, and applies
-- to kind = 'round' only - reviews, stories, clips and moments are not
-- bulk-backfilled and are not touched. Notability and consequence are NOT
-- damped, which is what keeps a lone old ace above a bulk-sync plain round.
--
--   gap_damp = clamp( 0.5 ^ ( max(0, gap_days - grace) / half_days ), floor, 1 )
--
-- CONFIG KEYS (defaults live in the body; rows below make them tunable)
--   gap_damp_half_days  45    gap half-life in days
--   gap_damp_grace_days  7    gap at or under this is undamped
--   gap_damp_floor    0.02    minimum multiplier, never 0
-- =====================================================================
\set ON_ERROR_STOP on
BEGIN;

DO $patch$
DECLARE
  v_src   text;
  v_new   text;
  v_md5   text;
  v_hits  int;
  k_decl_old text := '  c_gap      integer; v_limit  integer; c_back    integer; c_news integer;';
  k_decl_new text := '  c_gap      integer; v_limit  integer; c_back    integer; c_news integer;'
                  || E'\n  c_gap_half numeric; c_gap_grace numeric; c_gap_floor numeric;';
  k_cfg_old text :=
    '    greatest(coalesce(max(value) FILTER (WHERE key = ''news_days''), 30)::int, 1)' || E'\n' ||
    '  INTO c_w_cons, c_w_ring, c_w_fresh, c_w_not, c_half, c_story, c_seen, c_gap,' || E'\n' ||
    '       v_limit, c_back, c_news';
  k_cfg_new text :=
    '    greatest(coalesce(max(value) FILTER (WHERE key = ''news_days''), 30)::int, 1),' || E'\n' ||
    '    greatest(coalesce(max(value) FILTER (WHERE key = ''gap_damp_half_days''),  45), 0.5),' || E'\n' ||
    '    greatest(coalesce(max(value) FILTER (WHERE key = ''gap_damp_grace_days''),  7), 0),' || E'\n' ||
    '    least(greatest(coalesce(max(value) FILTER (WHERE key = ''gap_damp_floor''), 0.02), 0), 1)' || E'\n' ||
    '  INTO c_w_cons, c_w_ring, c_w_fresh, c_w_not, c_half, c_story, c_seen, c_gap,' || E'\n' ||
    '       v_limit, c_back, c_news, c_gap_half, c_gap_grace, c_gap_floor';
  k_fresh_old text :=
    '          + (c_w_fresh * CASE WHEN s.lane_k = ''backlog'' THEN 0' || E'\n' ||
    '               ELSE power(0.5, greatest(0, extract(epoch FROM (now() - coalesce(s.arrived_at, now()))) / 3600.0) / c_half) END)';
  k_fresh_new text :=
    '          -- THE GAP DAMP. Freshness still keys on ARRIVAL; a round that was' || E'\n' ||
    '          -- PLAYED long before it ARRIVED is old information arriving in bulk,' || E'\n' ||
    '          -- and is damped multiplicatively by the play-to-arrival gap. ROUNDS' || E'\n' ||
    '          -- ONLY - nothing else is bulk-backfilled. Notability and consequence' || E'\n' ||
    '          -- are deliberately NOT damped, so a lone old ace still outranks a' || E'\n' ||
    '          -- plain round from the same sync. A missing play_date cannot prove a' || E'\n' ||
    '          -- gap, so it is treated as no gap rather than guessed.' || E'\n' ||
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
    '               END)';
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_src
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream'
     AND p.pronargs = 8;
  IF v_src IS NULL THEN
    RAISE EXCEPTION 'get_explore_stream(8 args) not found - nothing patched';
  END IF;

  v_md5 := md5(v_src);
  IF v_md5 <> '3e79b91d70884bbf845bdbe2abcc6f57' THEN
    RAISE EXCEPTION 'deployed body md5 is %, expected 3e79b91d70884bbf845bdbe2abcc6f57 - the body moved since this draft was written; re-draft rather than patch blind', v_md5;
  END IF;

  v_new := v_src;

  v_hits := (length(v_new) - length(replace(v_new, k_decl_old, ''))) / length(k_decl_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'DECLARE site matched % times, expected 1', v_hits; END IF;
  v_new := replace(v_new, k_decl_old, k_decl_new);

  v_hits := (length(v_new) - length(replace(v_new, k_cfg_old, ''))) / length(k_cfg_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'config SELECT site matched % times, expected 1', v_hits; END IF;
  v_new := replace(v_new, k_cfg_old, k_cfg_new);

  -- The reviews branch has its OWN freshness expression (one line, no lane
  -- test). This target includes the lane test, so it can only be the
  -- ALL/SCORES branch. Asserting a single hit proves reviews are untouched.
  v_hits := (length(v_new) - length(replace(v_new, k_fresh_old, ''))) / length(k_fresh_old);
  IF v_hits <> 1 THEN RAISE EXCEPTION 'ALL/SCORES freshness site matched % times, expected 1', v_hits; END IF;
  v_new := replace(v_new, k_fresh_old, k_fresh_new);

  EXECUTE v_new;
  RAISE NOTICE 'get_explore_stream patched: gap damp added, 3/3 sites replaced';
END
$patch$;

-- Config rows. The body defaults to these exact values, so running this
-- script without the inserts changes nothing; the rows exist so the curve is
-- tunable without a deploy, the same as news_days and backlog_ratio.
INSERT INTO public.explore_config (key, value) VALUES
  ('gap_damp_half_days',  45),
  ('gap_damp_grace_days',  7),
  ('gap_damp_floor',    0.02)
ON CONFLICT (key) DO NOTHING;

-- Ownership, security mode, volatility, search_path and grants are carried by
-- pg_get_functiondef + CREATE OR REPLACE (replace preserves the owner and
-- privileges). Verify before COMMIT:
SELECT p.proname,
       p.prosecdef            AS security_definer,
       p.provolatile          AS volatility,
       p.proconfig            AS search_path,
       pg_get_userbyid(p.proowner) AS owner,
       md5(pg_get_functiondef(p.oid)) AS new_md5,
       pg_get_functiondef(p.oid) LIKE '%c_gap_half%' AS has_gap_damp
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'get_explore_stream' AND p.pronargs = 8;

SELECT grantee, privilege_type
  FROM information_schema.routine_privileges
 WHERE routine_schema = 'public' AND routine_name = 'get_explore_stream';

COMMIT;

-- ROLLBACK PATH: this script is reversible by re-running the same patch in
-- reverse, but the simpler route is to set the floor to 1, which makes the
-- damp a no-op with no deploy:
--   UPDATE public.explore_config SET value = 1 WHERE key = 'gap_damp_floor';
