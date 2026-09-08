-- ─────────────────────────────────────────────────────────────────────────────
-- Row-count floors on the clear-and-rewrite refreshers.
-- Approved 8 Sep 2026: 0.9 for tee sets (reference data feeding the tee
-- picker), 0.5 elsewhere. A below-floor run touches nothing and says so.
--
-- NO ABSOLUTE MINIMUMS except the snapshot's 50, which mirrors the floor
-- already inside scrape-tour-rankings and sits far below its real populations
-- (last five snapshots: 696, 698, 472, 469, 691). An absolute above the
-- current population is not a floor, it is a permanent refusal — tee sets at
-- 313 rows would have frozen forever against a 500 floor. The ratio does the
-- work; the v_before > 0 guard lets an empty table populate.
--
-- Companion to docs/ops/result-assertion-proposal.md section 2. Until
-- job_runs exists, a refusal is only visible in the Postgres log.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. TEE SETS — floor 0.9. Build the replacement set FIRST, never TRUNCATE
--    before it exists.
CREATE OR REPLACE FUNCTION public.refresh_course_tee_sets()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_rows int;
  v_before int;
  v_incoming int;
  v_floor int;
BEGIN
  SELECT count(*) INTO v_before FROM public.course_tee_sets;

  CREATE TEMP TABLE _tee_sets_new ON COMMIT DROP AS
  WITH eligible AS (
    SELECT s.id, s.course_id, s.course_rating, s.slope_rating,
           s.play_date, s.connection_id,
           n.tee_label, n.label_kind, n.name_scope
    FROM public.whs_scores s
    CROSS JOIN LATERAL public.normalise_tee_marker(s.marker_name) n
    WHERE s.course_rating IS NOT NULL
      AND s.slope_rating IS NOT NULL
      AND s.marker_name IS NOT NULL
      AND s.total_holes = 18
      AND s.is_nine_hole = false
      AND s.all_holes_attempted = true
      AND s.hole_by_hole_fetched = true
  ),
  variant_ranked AS (
    SELECT course_id, tee_label, label_kind, course_rating, slope_rating,
           COUNT(*) AS variant_rounds,
           MAX(play_date) AS variant_last_played,
           COUNT(*) FILTER (WHERE name_scope = 'ladies') AS n_name_ladies,
           COUNT(*) FILTER (WHERE name_scope = 'mens')   AS n_name_mens,
           ROW_NUMBER() OVER (
             PARTITION BY course_id, tee_label
             ORDER BY MAX(play_date) DESC, COUNT(*) DESC
           ) AS rn
    FROM eligible
    GROUP BY course_id, tee_label, label_kind, course_rating, slope_rating
  ),
  chosen AS (
    SELECT vr.*,
           (SELECT COUNT(DISTINCT (course_rating, slope_rating))
            FROM variant_ranked x
            WHERE x.course_id = vr.course_id AND x.tee_label = vr.tee_label
           ) AS variants_merged
    FROM variant_ranked vr
    WHERE vr.rn = 1
  ),
  gender_mix AS (
    SELECT e.course_id, e.tee_label,
           COUNT(*) FILTER (WHERE up.gender = 'female') AS g_female,
           COUNT(*) FILTER (WHERE up.gender = 'male')   AS g_male
    FROM eligible e
    JOIN chosen ch ON ch.course_id = e.course_id
                  AND ch.tee_label = e.tee_label
                  AND ch.course_rating = e.course_rating
                  AND ch.slope_rating = e.slope_rating
    LEFT JOIN public.whs_connections wc ON wc.id = e.connection_id
    LEFT JOIN public.user_profiles up ON up.id = wc.user_id
    GROUP BY e.course_id, e.tee_label
  ),
  hole_modes AS (
    SELECT e.course_id, e.tee_label, h.hole_no,
           mode() WITHIN GROUP (ORDER BY h.par) AS par,
           mode() WITHIN GROUP (ORDER BY h.stroke_index) AS si,
           mode() WITHIN GROUP (ORDER BY h.distance_yards) AS yards
    FROM eligible e
    JOIN chosen ch ON ch.course_id = e.course_id
                  AND ch.tee_label = e.tee_label
                  AND ch.course_rating = e.course_rating
                  AND ch.slope_rating = e.slope_rating
    JOIN public.whs_score_holes h ON h.score_id = e.id
    WHERE h.played = true
    GROUP BY e.course_id, e.tee_label, h.hole_no
  ),
  cards AS (
    SELECT course_id, tee_label,
           jsonb_agg(
             jsonb_build_object('hole_no', hole_no, 'par', par,
                                'si', si, 'yards', yards)
             ORDER BY hole_no
           ) AS holes,
           SUM(par)::int AS par_total,
           SUM(yards)::int AS total_yards,
           COUNT(*) AS holes_present
    FROM hole_modes
    GROUP BY course_id, tee_label
  )
  SELECT ch.course_id AS whs_course_id, ch.tee_label, ch.label_kind,
         CASE
           WHEN ch.n_name_ladies > 0 AND ch.n_name_mens = 0 THEN 'ladies'
           WHEN ch.n_name_mens > 0 AND ch.n_name_ladies = 0 THEN 'mens'
           WHEN COALESCE(gm.g_female,0) + COALESCE(gm.g_male,0) >= 5
                AND gm.g_female::numeric
                    / NULLIF(gm.g_female + gm.g_male, 0) >= 0.8 THEN 'ladies'
           WHEN COALESCE(gm.g_female,0) + COALESCE(gm.g_male,0) >= 5
                AND gm.g_male::numeric
                    / NULLIF(gm.g_female + gm.g_male, 0) >= 0.8 THEN 'mens'
           WHEN COALESCE(gm.g_female,0) >= 2 AND COALESCE(gm.g_male,0) >= 2
             THEN 'unisex'
           ELSE 'unknown'
         END AS gender_scope,
         ch.course_rating, ch.slope_rating,
         c.par_total, c.total_yards, c.holes,
         ch.variant_rounds AS rounds_sampled,
         ch.variants_merged,
         ch.variant_last_played AS last_played_at
  FROM chosen ch
  JOIN cards c ON c.course_id = ch.course_id AND c.tee_label = ch.tee_label
  LEFT JOIN gender_mix gm ON gm.course_id = ch.course_id
                         AND gm.tee_label = ch.tee_label
  WHERE c.holes_present = 18;

  SELECT count(*) INTO v_incoming FROM _tee_sets_new;

  -- 0.9: near-static reference data. A 10% drop is already wrong.
  v_floor := GREATEST(1, ceil(v_before * 0.9)::int);
  IF v_before > 0 AND v_incoming < v_floor THEN
    RAISE WARNING 'refresh_course_tee_sets BELOW FLOOR: incoming % < floor % (before %)',
      v_incoming, v_floor, v_before;
    DROP TABLE IF EXISTS _tee_sets_new;
    RETURN jsonb_build_object('ok', false, 'status', 'below_floor',
                              'incoming', v_incoming, 'before', v_before,
                              'floor', v_floor, 'refreshed_at', now());
  END IF;

  TRUNCATE public.course_tee_sets;
  INSERT INTO public.course_tee_sets
    (whs_course_id, tee_label, label_kind, gender_scope, course_rating,
     slope_rating, par_total, total_yards, holes, rounds_sampled,
     variants_merged, last_played_at)
  SELECT whs_course_id, tee_label, label_kind, gender_scope, course_rating,
         slope_rating, par_total, total_yards, holes, rounds_sampled,
         variants_merged, last_played_at
  FROM _tee_sets_new;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  DROP TABLE IF EXISTS _tee_sets_new;
  RETURN jsonb_build_object('ok', true, 'tee_sets', v_rows,
                            'rows_before', v_before,
                            'refreshed_at', now());
END;
$function$;

-- 2. HERO STORIES — floor 0.5. No longer deletes before it knows what it has;
--    upserts the key instead.
CREATE OR REPLACE FUNCTION public.refresh_hero_stories()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_before int;
  v_incoming int;
  v_floor int;
  v_payload jsonb;
BEGIN
  SELECT COALESCE(item_count, 0) INTO v_before
  FROM discover_rail_cache WHERE rail_key = 'hero_stories';
  v_before := COALESCE(v_before, 0);

  CREATE TEMP TABLE _rarity ON COMMIT DROP AS
  WITH legendary AS (
    SELECT h.score_id, s.play_date,
      CASE WHEN BOOL_OR(h.played AND h.actual_gross = 1) THEN 'ace'
           WHEN BOOL_OR(h.played AND h.actual_gross = h.par - 3) THEN 'albatross'
      END AS kind
    FROM whs_score_holes h
    JOIN whs_scores s ON s.id = h.score_id
    WHERE s.is_penalty_score = false
    GROUP BY h.score_id, s.play_date
  )
  SELECT score_id, kind,
    ROW_NUMBER() OVER (PARTITION BY kind ORDER BY play_date, score_id)::int AS ordinal,
    COUNT(*)    OVER (PARTITION BY kind)::int                               AS total
  FROM legendary WHERE kind IS NOT NULL;

  SELECT
    COALESCE(jsonb_agg(to_jsonb(s) - 'sig_score' ORDER BY s.sig_score DESC), '[]'::jsonb),
    COUNT(*)
  INTO v_payload, v_incoming
  FROM (
    SELECT kind, course_id, course_name, image,
      CASE WHEN holder_name ~ '^[^,]+,\s*.+$'
           THEN regexp_replace(holder_name, '^([^,]+),\s*(.+)$', '\2 \1')
           ELSE holder_name END AS holder_name,
      holder_avatar, user_id, score_id,
      value, course_par, hole, happened_at, chips, story, sig_score
    FROM (
      -- Course records
      SELECT 'course_record'::text AS kind,
        e->>'course_id' AS course_id, e->>'course_name' AS course_name,
        COALESCE(e->>'thumbnail_image', e->>'course_image') AS image,
        e->>'holder_name' AS holder_name, e->>'holder_avatar' AS holder_avatar,
        e->>'user_id' AS user_id, e->>'score_id' AS score_id,
        e->>'value' AS value, e->>'course_par' AS course_par,
        NULL::text AS hole, e->>'attained_at' AS happened_at,
        jsonb_strip_nulls(jsonb_build_object(
          'birdies',    NULLIF((e->>'birdies')::int, 0),
          'eagles',     NULLIF((e->>'eagles')::int, 0),
          'clean_card', NULLIF((e->>'clean_card')::boolean, false),
          'beat_par',   NULLIF((e->>'beat_par')::boolean, false)
        )) AS chips,
        CASE
          WHEN bt.prev_gross IS NULL THEN NULL
          WHEN (bt.prev_gross - (e->>'value')::int) <= 0 THEN NULL
          ELSE jsonb_build_object('kind','beat','name',bt.prev_name,
            'by', bt.prev_gross - (e->>'value')::int,
            'self', (bt.prev_user_id = (e->>'user_id')::uuid),
            'stood', CASE WHEN bt.days_stood >= 90
                          THEN to_char(bt.prev_date,'FMMonth YYYY') END)
        END AS story,
        100.0 * power(0.5, GREATEST(0, extract(epoch FROM (now() - (e->>'attained_at')::timestamptz)) / 86400.0) / 14.0) AS sig_score
      FROM discover_rail_cache c, jsonb_array_elements(c.payload) e
      LEFT JOIN LATERAL (
        SELECT p.gross_score AS prev_gross, p.play_date AS prev_date,
               p.user_id AS prev_user_id, up.display_name AS prev_name,
               ((e->>'attained_at')::date - p.play_date) AS days_stood
        FROM gam_round_stats p
        LEFT JOIN user_profiles up ON up.id = p.user_id
        WHERE p.course_id = (e->>'course_id')::uuid AND p.holes_played = 18
          AND p.play_date < (e->>'attained_at')::date
        ORDER BY p.gross_score ASC, p.play_date ASC LIMIT 1) bt ON TRUE
      WHERE c.rail_key = 'records:worldwide'

      UNION ALL
      -- Aces and albatrosses
      SELECT CASE e->>'feat_type' WHEN 'albatross' THEN 'albatross' ELSE 'ace' END,
        e->>'course_id', e->>'course_name', e->>'course_image',
        e->>'holder_name', e->>'holder_avatar', e->>'user_id', e->>'score_id',
        NULL, NULL,
        NULLIF(regexp_replace(COALESCE(e->>'feat_value',''), '\D', '', 'g'), ''),
        e->>'play_date',
        jsonb_strip_nulls(jsonb_build_object(
          'birdies',    NULLIF((e->>'birdie_count')::int, 0),
          'clean_card', NULLIF((e->>'clean_card')::boolean, false),
          'beat_par',   NULLIF((e->>'beat_par')::boolean, false))),
        CASE WHEN r.ordinal IS NULL THEN NULL
             ELSE jsonb_build_object('kind','rarity','ordinal',r.ordinal,'total',r.total) END,
        (CASE e->>'feat_type' WHEN 'albatross' THEN 90.0 ELSE 80.0 END)
          * power(0.5, GREATEST(0, extract(epoch FROM (now() - (e->>'play_date')::timestamptz)) / 86400.0) / 14.0)
      FROM discover_rail_cache c, jsonb_array_elements(c.payload) e
      LEFT JOIN _rarity r ON r.score_id = (e->>'score_id')::uuid
      WHERE c.rail_key = 'feats:worldwide:legendary'
        AND e->>'feat_type' IN ('ace','albatross')

      UNION ALL
      -- Eagles
      SELECT 'eagle', e->>'course_id', e->>'course_name', e->>'course_image',
        e->>'holder_name', e->>'holder_avatar', e->>'user_id', e->>'score_id',
        NULL, NULL,
        NULLIF(regexp_replace(COALESCE(e->>'feat_value',''), '\D', '', 'g'), ''),
        e->>'play_date',
        jsonb_strip_nulls(jsonb_build_object(
          'birdies',    NULLIF((e->>'birdie_count')::int, 0),
          'clean_card', NULLIF((e->>'clean_card')::boolean, false),
          'beat_par',   NULLIF((e->>'beat_par')::boolean, false))),
        CASE WHEN e->>'course_id' IS NOT NULL AND NOT EXISTS (
               SELECT 1 FROM discover_rail_cache c2, jsonb_array_elements(c2.payload) e2
               WHERE c2.rail_key = 'feats:worldwide:eagles'
                 AND e2->>'course_id' = e->>'course_id'
                 AND (e2->>'play_date')::date < (e->>'play_date')::date)
             THEN jsonb_build_object('kind','first_at_course') END,
        40.0 * power(0.5, GREATEST(0, extract(epoch FROM (now() - (e->>'play_date')::timestamptz)) / 86400.0) / 14.0)
      FROM discover_rail_cache c, jsonb_array_elements(c.payload) e
      WHERE c.rail_key = 'feats:worldwide:eagles'

      UNION ALL
      -- Birdie hauls
      SELECT 'birdie_haul', e->>'course_id', e->>'course_name', e->>'course_image',
        e->>'holder_name', e->>'holder_avatar', e->>'user_id', e->>'score_id',
        NULL, NULL,
        NULLIF(regexp_replace(COALESCE(e->>'feat_value',''), '\D', '', 'g'), ''),
        e->>'play_date',
        jsonb_strip_nulls(jsonb_build_object(
          'birdies',    NULLIF((e->>'birdie_count')::int, 0),
          'clean_card', NULLIF((e->>'clean_card')::boolean, false),
          'beat_par',   NULLIF((e->>'beat_par')::boolean, false))),
        CASE WHEN e->>'course_id' IS NOT NULL AND NOT EXISTS (
               SELECT 1 FROM discover_rail_cache c2, jsonb_array_elements(c2.payload) e2
               WHERE c2.rail_key = 'feats:worldwide:birdie_hauls'
                 AND e2->>'course_id' = e->>'course_id'
                 AND (e2->>'birdie_count')::int > (e->>'birdie_count')::int)
             THEN jsonb_build_object('kind','most_at_course',
                                     'count',(e->>'birdie_count')::int) END,
        30.0 * power(0.5, GREATEST(0, extract(epoch FROM (now() - (e->>'play_date')::timestamptz)) / 86400.0) / 14.0)
      FROM discover_rail_cache c, jsonb_array_elements(c.payload) e
      WHERE c.rail_key = 'feats:worldwide:birdie_hauls'
    ) raw
    WHERE happened_at IS NOT NULL
    ORDER BY sig_score DESC
    LIMIT 5
  ) s;

  v_floor := GREATEST(1, ceil(v_before * 0.5)::int);
  IF v_before > 0 AND v_incoming < v_floor THEN
    RAISE WARNING 'refresh_hero_stories BELOW FLOOR: incoming % < floor % (before %)',
      v_incoming, v_floor, v_before;
    DROP TABLE IF EXISTS _rarity;
    RETURN;
  END IF;

  INSERT INTO discover_rail_cache (rail_key, payload, item_count, computed_at)
  VALUES ('hero_stories', v_payload, v_incoming, now())
  ON CONFLICT (rail_key) DO UPDATE
    SET payload = EXCLUDED.payload,
        item_count = EXCLUDED.item_count,
        computed_at = EXCLUDED.computed_at;

  DROP TABLE IF EXISTS _rarity;
END;
$function$;

-- 3. LATEST RECORDS — floor 0.5, measured on the worldwide key.
CREATE OR REPLACE FUNCTION public.refresh_latest_records_cache(p_limit integer DEFAULT 8)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_payload jsonb;
  v_count   integer;
  v_region  text;
  v_before  integer;
  v_incoming integer;
  v_floor   integer;
BEGIN
  SELECT COALESCE(item_count, 0) INTO v_before
  FROM discover_rail_cache WHERE rail_key = 'records:worldwide';
  v_before := COALESCE(v_before, 0);

  -- No per-user cap anywhere: every course record shows regardless of holder.
  CREATE TEMP TABLE _records ON COMMIT DROP AS
  WITH eligible AS (
    SELECT
      v.course_id, v.course_name, v.category, v.value, v.user_id, v.attained_at,
      CASE v.category
        WHEN 'lowest_gross_all_time'     THEN 1
        WHEN 'best_stableford_all_time'  THEN 2
        ELSE 99
      END AS notability
    FROM gam_course_legends_view v
    WHERE v.is_current = true
      AND v.rank = 1
      AND v.category IN ('lowest_gross_all_time','best_stableford_all_time')
  ),
  per_course AS (
    SELECT DISTINCT ON (course_id)
      course_id, course_name, category, value, user_id, attained_at, notability
    FROM eligible
    ORDER BY course_id, notability ASC, attained_at DESC
  )
  SELECT
    c.course_id, c.course_name, c.category, c.value, c.user_id, c.attained_at,
    c.notability,
    gc.thumbnail_image,
    up.display_name       AS holder_name,
    up.username           AS holder_username,
    up.profile_photo_url  AS holder_avatar,
    up.eg_handicap_index  AS holder_hcp,
    up.home_club          AS holder_club,
    cp.course_par         AS course_par,
    sid.score_id          AS score_id,
    grs.birdies           AS birdies,
    grs.eagles            AS eagles,
    grs.albatrosses       AS albatrosses,
    grs.holes_in_one      AS holes_in_one,
    grs.beat_par          AS beat_par,
    grs.clean_card        AS clean_card,
    CASE
      WHEN gc.country = 'Britain & Ireland' THEN 'gbi'
      WHEN gc.country = 'USA' THEN 'usa'
      WHEN gc.country = 'Continental Europe' THEN 'europe'
      WHEN gc.country IN ('Oceania','Asia','Africa','Caribbean','Middle East','Central and South America') THEN 'row'
      ELSE 'row'
    END AS region
  FROM per_course c
  LEFT JOIN golf_courses gc ON gc.id = c.course_id
  LEFT JOIN user_profiles up ON up.id = c.user_id
  LEFT JOIN LATERAL (
    SELECT par_sum AS course_par
    FROM (
      SELECT SUM(h.par)::int AS par_sum
      FROM whs_to_golf_course_map m
      JOIN whs_scores ws ON ws.course_id = m.whs_course_id
      JOIN whs_score_holes h ON h.score_id = ws.id
      WHERE m.golf_course_id = c.course_id
      GROUP BY ws.id
      HAVING COUNT(h.hole_no) = 18
    ) round_pars
    WHERE par_sum BETWEEN 60 AND 75
    GROUP BY par_sum
    ORDER BY COUNT(*) DESC, par_sum ASC
    LIMIT 1
  ) cp ON true
  LEFT JOIN LATERAL (
    SELECT ws.id AS score_id
    FROM whs_to_golf_course_map m
    JOIN whs_scores ws ON ws.course_id = m.whs_course_id
    JOIN whs_connections wc ON wc.id = ws.connection_id AND wc.user_id = c.user_id
    WHERE m.golf_course_id = c.course_id
      AND (
        (c.category = 'lowest_gross_all_time'    AND ws.adjusted_gross    = c.value::int)
        OR
        (c.category = 'best_stableford_all_time' AND ws.stableford_points = c.value::int)
      )
    ORDER BY (ws.play_date = c.attained_at::date) DESC, ws.play_date DESC
    LIMIT 1
  ) sid ON true
  LEFT JOIN gam_round_stats grs ON grs.whs_score_id = sid.score_id
  WHERE up.deleted_at IS NULL;

  SELECT count(*) INTO v_incoming FROM _records;

  v_floor := GREATEST(1, ceil(v_before * 0.5)::int);
  IF v_before > 0 AND v_incoming < v_floor THEN
    RAISE WARNING 'refresh_latest_records_cache BELOW FLOOR: incoming % < floor % (before %)',
      v_incoming, v_floor, v_before;
    DROP TABLE IF EXISTS _records;
    RETURN;
  END IF;

  -- 1. Global latest strip (8 tiles, pure recency, no cap)
  SELECT
    COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.attained_at DESC), '[]'::jsonb),
    COUNT(*)
  INTO v_payload, v_count
  FROM (
    SELECT course_id, course_name, category, value, user_id, attained_at,
           thumbnail_image, holder_name, holder_username, holder_avatar,
           holder_hcp, holder_club, course_par, score_id,
           birdies, eagles, albatrosses, holes_in_one, beat_par, clean_card
    FROM _records
    ORDER BY notability ASC, attained_at DESC
    LIMIT p_limit
  ) t;

  INSERT INTO public.discover_rail_cache (rail_key, payload, item_count, computed_at)
  VALUES ('latest_records', v_payload, v_count, now())
  ON CONFLICT (rail_key)
  DO UPDATE SET payload = EXCLUDED.payload,
                item_count = EXCLUDED.item_count,
                computed_at = EXCLUDED.computed_at;

  -- 2. Region-bucketed LATEST keys (records:{region}) -- pure recency, no cap
  FOR v_region IN SELECT unnest(ARRAY['worldwide','gbi','usa','europe','row'])
  LOOP
    INSERT INTO public.discover_rail_cache (rail_key, payload, item_count, computed_at)
    SELECT
      'records:' || v_region,
      COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.attained_at DESC), '[]'::jsonb),
      COUNT(*),
      now()
    FROM (
      SELECT course_id, course_name, category, value, user_id, attained_at,
             thumbnail_image, holder_name, holder_username, holder_avatar,
             holder_hcp, holder_club, course_par, score_id,
             birdies, eagles, albatrosses, holes_in_one, beat_par, clean_card
      FROM _records r
      WHERE (v_region = 'worldwide' OR r.region = v_region)
      ORDER BY r.notability ASC, r.attained_at DESC
      LIMIT 500
    ) t
    ON CONFLICT (rail_key)
    DO UPDATE SET payload = EXCLUDED.payload,
                  item_count = EXCLUDED.item_count,
                  computed_at = EXCLUDED.computed_at;
  END LOOP;

  -- 3. Region-bucketed ALL-TIME keys (records_alltime:{region})
  FOR v_region IN SELECT unnest(ARRAY['worldwide','gbi','usa','europe','row'])
  LOOP
    INSERT INTO public.discover_rail_cache (rail_key, payload, item_count, computed_at)
    SELECT
      'records_alltime:' || v_region,
      COALESCE(
        jsonb_agg(
          to_jsonb(t)
          ORDER BY (t.value - t.course_par) ASC NULLS LAST,
                   t.value ASC,
                   t.attained_at ASC
        ),
        '[]'::jsonb
      ),
      COUNT(*),
      now()
    FROM (
      SELECT course_id, course_name, category, value, user_id, attained_at,
             thumbnail_image, holder_name, holder_username, holder_avatar,
             holder_hcp, holder_club, course_par, score_id,
             birdies, eagles, albatrosses, holes_in_one, beat_par, clean_card
      FROM _records r
      WHERE (v_region = 'worldwide' OR r.region = v_region)
        AND r.category = 'lowest_gross_all_time'
      ORDER BY (r.value - r.course_par) ASC NULLS LAST,
               r.value ASC,
               r.attained_at ASC
      LIMIT 500
    ) t
    ON CONFLICT (rail_key)
    DO UPDATE SET payload = EXCLUDED.payload,
                  item_count = EXCLUDED.item_count,
                  computed_at = EXCLUDED.computed_at;
  END LOOP;
END;
$function$;

-- 4. EAGLE LEADERS — floor 0.5, measured on the worldwide key.
CREATE OR REPLACE FUNCTION public.refresh_eagle_leaders()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_region text;
  v_before int;
  v_incoming int;
  v_floor int;
BEGIN
  SELECT COALESCE(item_count, 0) INTO v_before
  FROM discover_rail_cache WHERE rail_key = 'eagle_leaders:worldwide';
  v_before := COALESCE(v_before, 0);

  CREATE TEMP TABLE _eagle_leaders ON COMMIT DROP AS
  SELECT
    s.id AS score_id,
    s.play_date,
    wc.user_id,
    up.display_name       AS holder_name,
    up.profile_photo_url  AS holder_avatar,
    up.eg_handicap_index  AS holder_hcp,
    up.home_club          AS holder_club,
    per.n_eagles,
    CASE
      WHEN g.country = 'Britain & Ireland' THEN 'gbi'
      WHEN g.country = 'USA' THEN 'usa'
      WHEN g.country = 'Continental Europe' THEN 'europe'
      WHEN g.country IN ('Oceania','Asia','Africa','Caribbean','Middle East','Central and South America') THEN 'row'
      ELSE 'row'
    END AS region
  FROM whs_scores s
  JOIN whs_connections wc ON wc.id = s.connection_id
  JOIN user_profiles up ON up.id = wc.user_id AND up.deleted_at IS NULL
  LEFT JOIN whs_to_golf_course_map m ON m.whs_course_id = s.course_id
  LEFT JOIN golf_courses g ON g.id = m.golf_course_id
  JOIN LATERAL (
    SELECT
      -- Eagle = gross of par-2, excluding holes-in-one (those are aces
      -- per the feats priority ladder and live on the legendary board).
      COUNT(*) FILTER (
        WHERE hh.played
          AND hh.actual_gross = hh.par - 2
          AND hh.actual_gross > 1
      ) AS n_eagles
    FROM whs_score_holes hh WHERE hh.score_id = s.id
  ) per ON true
  WHERE per.n_eagles > 0;

  SELECT count(DISTINCT user_id) INTO v_incoming FROM _eagle_leaders;

  v_floor := GREATEST(1, ceil(v_before * 0.5)::int);
  IF v_before > 0 AND v_incoming < v_floor THEN
    RAISE WARNING 'refresh_eagle_leaders BELOW FLOOR: incoming % < floor % (before %)',
      v_incoming, v_floor, v_before;
    DROP TABLE IF EXISTS _eagle_leaders;
    RETURN;
  END IF;

  FOR v_region IN SELECT unnest(ARRAY['worldwide','gbi','usa','europe','row'])
  LOOP
    INSERT INTO discover_rail_cache (rail_key, payload, item_count, computed_at)
    SELECT
      'eagle_leaders:' || v_region,
      COALESCE(
        jsonb_agg(
          row_to_json(t)::jsonb
          ORDER BY t.eagles DESC, t.first_feat ASC
        ),
        '[]'::jsonb
      ),
      COUNT(*),
      now()
    FROM (
      SELECT
        user_id, holder_name, holder_avatar, holder_hcp, holder_club,
        SUM(n_eagles)::int AS eagles,
        MIN(play_date)     AS first_feat
      FROM _eagle_leaders l
      WHERE (v_region = 'worldwide' OR l.region = v_region)
      GROUP BY user_id, holder_name, holder_avatar, holder_hcp, holder_club
      HAVING SUM(n_eagles) > 0
      ORDER BY SUM(n_eagles) DESC, MIN(play_date) ASC
      LIMIT 500
    ) t
    ON CONFLICT (rail_key) DO UPDATE
      SET payload = EXCLUDED.payload,
          item_count = EXCLUDED.item_count,
          computed_at = EXCLUDED.computed_at;
  END LOOP;
END;
$function$;

-- 5. LEGENDARY LEADERS — floor 0.5. No absolute: this board sits at 5 rows
--    today and an absolute of 5 would freeze it on the first loss.
CREATE OR REPLACE FUNCTION public.refresh_legendary_leaders()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_region text;
  v_before int;
  v_incoming int;
  v_floor int;
BEGIN
  SELECT COALESCE(item_count, 0) INTO v_before
  FROM discover_rail_cache WHERE rail_key = 'legendary_leaders:worldwide';
  v_before := COALESCE(v_before, 0);

  CREATE TEMP TABLE _leaders ON COMMIT DROP AS
  SELECT
    s.id AS score_id,
    s.play_date,
    wc.user_id,
    up.display_name       AS holder_name,
    up.profile_photo_url  AS holder_avatar,
    up.eg_handicap_index  AS holder_hcp,
    up.home_club          AS holder_club,
    per.n_aces,
    per.n_albatrosses,
    CASE
      WHEN g.country = 'Britain & Ireland' THEN 'gbi'
      WHEN g.country = 'USA' THEN 'usa'
      WHEN g.country = 'Continental Europe' THEN 'europe'
      WHEN g.country IN ('Oceania','Asia','Africa','Caribbean','Middle East','Central and South America') THEN 'row'
      ELSE 'row'
    END AS region
  FROM whs_scores s
  JOIN whs_connections wc ON wc.id = s.connection_id
  JOIN user_profiles up ON up.id = wc.user_id AND up.deleted_at IS NULL
  LEFT JOIN whs_to_golf_course_map m ON m.whs_course_id = s.course_id
  LEFT JOIN golf_courses g ON g.id = m.golf_course_id
  JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE hh.played AND hh.actual_gross = 1)          AS n_aces,
      COUNT(*) FILTER (WHERE hh.played AND hh.actual_gross = hh.par - 3) AS n_albatrosses
    FROM whs_score_holes hh WHERE hh.score_id = s.id
  ) per ON true
  WHERE per.n_aces > 0 OR per.n_albatrosses > 0;

  SELECT count(DISTINCT user_id) INTO v_incoming FROM _leaders;

  v_floor := GREATEST(1, ceil(v_before * 0.5)::int);
  IF v_before > 0 AND v_incoming < v_floor THEN
    RAISE WARNING 'refresh_legendary_leaders BELOW FLOOR: incoming % < floor % (before %)',
      v_incoming, v_floor, v_before;
    DROP TABLE IF EXISTS _leaders;
    RETURN;
  END IF;

  FOR v_region IN SELECT unnest(ARRAY['worldwide','gbi','usa','europe','row'])
  LOOP
    INSERT INTO discover_rail_cache (rail_key, payload, item_count, computed_at)
    SELECT
      'legendary_leaders:' || v_region,
      COALESCE(
        jsonb_agg(
          row_to_json(t)::jsonb
          ORDER BY t.aces DESC, t.albatrosses DESC, t.first_feat ASC
        ),
        '[]'::jsonb
      ),
      COUNT(*),
      now()
    FROM (
      SELECT
        user_id, holder_name, holder_avatar, holder_hcp, holder_club,
        SUM(n_aces)::int         AS aces,
        SUM(n_albatrosses)::int  AS albatrosses,
        MIN(play_date)           AS first_feat
      FROM _leaders l
      WHERE (v_region = 'worldwide' OR l.region = v_region)
      GROUP BY user_id, holder_name, holder_avatar, holder_hcp, holder_club
      HAVING SUM(n_aces) > 0 OR SUM(n_albatrosses) > 0
      ORDER BY
        SUM(n_aces) DESC,
        SUM(n_albatrosses) DESC,
        MIN(play_date) ASC
      LIMIT 500
    ) t
    ON CONFLICT (rail_key) DO UPDATE
      SET payload = EXCLUDED.payload,
          item_count = EXCLUDED.item_count,
          computed_at = EXCLUDED.computed_at;
  END LOOP;
END;
$function$;

-- 6. HARDEST / EASIEST HOLES — floor 0.5, measured on the hardest_holes key.
--    Both keys are written or neither.
CREATE OR REPLACE FUNCTION public.refresh_hardest_holes_cache(p_limit integer DEFAULT 30)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_min_rounds numeric;
  v_per_course int := 2;   -- no single club may own the board
  v_count integer;
  v_before integer;
  v_incoming integer;
  v_floor integer;
BEGIN
  SELECT COALESCE(MAX(CASE WHEN key = 'hh_min_rounds' THEN value END), 20)
    INTO v_min_rounds FROM feed_config;

  SELECT COALESCE(item_count, 0) INTO v_before
  FROM discover_rail_cache WHERE rail_key = 'hardest_holes';
  v_before := COALESCE(v_before, 0);

  CREATE TEMP TABLE IF NOT EXISTS tmp_hole_stats ON COMMIT DROP AS
  SELECT
    COALESCE(m.golf_course_id, s.course_id) AS g_course_id,
    h.hole_no,
    (array_agg(h.par ORDER BY s.capture_date DESC))[1] AS par,
    COUNT(*) AS n_rounds,
    ROUND(AVG(h.actual_gross - h.par)::numeric, 2) AS avg_over,
    ROUND(AVG(h.actual_gross)::numeric, 1) AS plays_to,
    ROUND(100.0 * COUNT(*) FILTER (WHERE h.actual_gross - h.par <= -1) / COUNT(*), 1) AS d_birdie,
    ROUND(100.0 * COUNT(*) FILTER (WHERE h.actual_gross - h.par =  0) / COUNT(*), 1) AS d_par,
    ROUND(100.0 * COUNT(*) FILTER (WHERE h.actual_gross - h.par =  1) / COUNT(*), 1) AS d_bogey,
    ROUND(100.0 * COUNT(*) FILTER (WHERE h.actual_gross - h.par >= 2) / COUNT(*), 1) AS d_double
  FROM whs_score_holes h
  JOIN whs_scores s ON s.id = h.score_id
  JOIN whs_connections wc ON wc.id = s.connection_id AND wc.deleted_at IS NULL
  LEFT JOIN whs_to_golf_course_map m ON m.whs_course_id = s.course_id
  WHERE s.is_penalty_score = false
    AND h.played = true
    AND h.actual_gross IS NOT NULL AND h.par IS NOT NULL
  GROUP BY COALESCE(m.golf_course_id, s.course_id), h.hole_no
  HAVING COUNT(*) >= v_min_rounds;

  SELECT COUNT(*) INTO v_incoming
  FROM (
    SELECT r.*
    FROM (
      SELECT hs.g_course_id, hs.avg_over, hs.n_rounds,
             ROW_NUMBER() OVER (PARTITION BY hs.g_course_id
                                ORDER BY hs.avg_over DESC, hs.n_rounds DESC) AS rn_course
      FROM tmp_hole_stats hs
      JOIN golf_courses gc ON gc.id = hs.g_course_id
    ) r
    WHERE r.rn_course <= v_per_course
    ORDER BY r.avg_over DESC, r.n_rounds DESC
    LIMIT p_limit
  ) probe;

  v_floor := GREATEST(1, ceil(v_before * 0.5)::int);
  IF v_before > 0 AND v_incoming < v_floor THEN
    RAISE WARNING 'refresh_hardest_holes_cache BELOW FLOOR: incoming % < floor % (before %)',
      v_incoming, v_floor, v_before;
    DROP TABLE IF EXISTS tmp_hole_stats;
    RETURN v_before;
  END IF;

  INSERT INTO discover_rail_cache (rail_key, payload, item_count, computed_at)
  SELECT 'hardest_holes',
         COALESCE(jsonb_agg(jsonb_build_object(
           'course_id', n.g_course_id, 'course_name', n.course_name,
           'course_image', n.course_image,
           'region', n.course_region, 'country', n.course_country,
           'hole_no', n.hole_no, 'par', n.par,
           'plays_to', n.plays_to, 'avg_over', n.avg_over,
           'rounds', n.n_rounds,
           'dist', jsonb_build_object(
             'birdie_plus', n.d_birdie, 'par', n.d_par,
             'bogey', n.d_bogey, 'double_plus', n.d_double))), '[]'::jsonb),
         COUNT(*)::integer, NOW()
  FROM (
    SELECT r.*
    FROM (
      SELECT hs.*, gc.name AS course_name, gc.thumbnail_image AS course_image,
             gc.region AS course_region, gc.country AS course_country,
             ROW_NUMBER() OVER (PARTITION BY hs.g_course_id
                                ORDER BY hs.avg_over DESC, hs.n_rounds DESC) AS rn_course
      FROM tmp_hole_stats hs
      JOIN golf_courses gc ON gc.id = hs.g_course_id
    ) r
    WHERE r.rn_course <= v_per_course
    ORDER BY r.avg_over DESC, r.n_rounds DESC
    LIMIT p_limit
  ) n
  ON CONFLICT (rail_key)
  DO UPDATE SET payload = EXCLUDED.payload,
                item_count = EXCLUDED.item_count,
                computed_at = EXCLUDED.computed_at;

  INSERT INTO discover_rail_cache (rail_key, payload, item_count, computed_at)
  SELECT 'easiest_holes',
         COALESCE(jsonb_agg(jsonb_build_object(
           'course_id', n.g_course_id, 'course_name', n.course_name,
           'course_image', n.course_image,
           'region', n.course_region, 'country', n.course_country,
           'hole_no', n.hole_no, 'par', n.par,
           'plays_to', n.plays_to, 'avg_over', n.avg_over,
           'rounds', n.n_rounds,
           'dist', jsonb_build_object(
             'birdie_plus', n.d_birdie, 'par', n.d_par,
             'bogey', n.d_bogey, 'double_plus', n.d_double))), '[]'::jsonb),
         COUNT(*)::integer, NOW()
  FROM (
    SELECT r.*
    FROM (
      SELECT hs.*, gc.name AS course_name, gc.thumbnail_image AS course_image,
             gc.region AS course_region, gc.country AS course_country,
             ROW_NUMBER() OVER (PARTITION BY hs.g_course_id
                                ORDER BY hs.avg_over ASC, hs.n_rounds DESC) AS rn_course
      FROM tmp_hole_stats hs
      JOIN golf_courses gc ON gc.id = hs.g_course_id
    ) r
    WHERE r.rn_course <= v_per_course
    ORDER BY r.avg_over ASC, r.n_rounds DESC
    LIMIT p_limit
  ) n
  ON CONFLICT (rail_key)
  DO UPDATE SET payload = EXCLUDED.payload,
                item_count = EXCLUDED.item_count,
                computed_at = EXCLUDED.computed_at;

  DROP TABLE IF EXISTS tmp_hole_stats;
  SELECT item_count INTO v_count FROM discover_rail_cache WHERE rail_key = 'hardest_holes';
  RETURN v_count;
END;
$function$;

-- 7. TOUR SEASON RANKING SNAPSHOT — floor 0.5 with the one surviving absolute
--    of 50, mirroring scrape-tour-rankings, its source. Verified 8 Sep 2026:
--    last five snapshots were 696, 698, 472, 469, 691 rows, so 50 is far
--    below the real population and cannot become a permanent refusal.
CREATE OR REPLACE FUNCTION public.snapshot_tour_season_rankings()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_rows int;
  v_before int;
  v_incoming int;
  v_floor int;
BEGIN
  SELECT COALESCE(count(*), 0) INTO v_before
  FROM public.tour_season_rankings_snapshots
  WHERE snapshot_date = (
    SELECT MAX(snapshot_date) FROM public.tour_season_rankings_snapshots
    WHERE snapshot_date < CURRENT_DATE
  );

  CREATE TEMP TABLE _tsr_new ON COMMIT DROP AS
  SELECT DISTINCT ON (tour_code, season_year, position)
    tour_code, season_year, position, player_name, player_id,
    country, points, wins, tournaments_played
  FROM public.tour_season_rankings
  ORDER BY tour_code, season_year, position, updated_at DESC NULLS LAST;

  SELECT count(*) INTO v_incoming FROM _tsr_new;

  v_floor := GREATEST(50, ceil(v_before * 0.5)::int);
  IF v_before > 0 AND v_incoming < v_floor THEN
    RAISE WARNING 'snapshot_tour_season_rankings BELOW FLOOR: incoming % < floor % (before %)',
      v_incoming, v_floor, v_before;
    DROP TABLE IF EXISTS _tsr_new;
    RETURN jsonb_build_object('ok', false, 'status', 'below_floor',
                              'incoming', v_incoming, 'before', v_before,
                              'floor', v_floor, 'snapshot_date', CURRENT_DATE);
  END IF;

  DELETE FROM public.tour_season_rankings_snapshots WHERE snapshot_date = CURRENT_DATE;
  INSERT INTO public.tour_season_rankings_snapshots
    (snapshot_date, tour_code, season_year, position, player_name, player_id,
     country, points, wins, tournaments_played)
  SELECT CURRENT_DATE, tour_code, season_year, position, player_name, player_id,
         country, points, wins, tournaments_played
  FROM _tsr_new;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  DROP TABLE IF EXISTS _tsr_new;
  RETURN jsonb_build_object('ok', true, 'rows', v_rows,
                            'rows_before', v_before,
                            'snapshot_date', CURRENT_DATE);
END;
$function$;