
-- Single source of truth for tournament -> our-course attribution.
CREATE OR REPLACE VIEW public.sr_tournament_course_resolution AS
WITH tok AS (
  SELECT
    t.id AS tournament_id,
    btrim(t.venue_name) AS venue_name,
    nullif(btrim(t.venue_course_name), '') AS venue_course_name,
    lower(regexp_replace(coalesce(t.venue_name, ''), '[^a-z0-9 ]', ' ', 'gi')) AS venue_norm,
    (
      SELECT array_agg(w)
      FROM unnest(regexp_split_to_array(
        lower(regexp_replace(coalesce(nullif(btrim(t.venue_course_name), ''), ''), '[^a-z0-9 ]', ' ', 'gi')),
        '\s+')) w
      WHERE w <> ''
        AND w NOT IN ('golf','club','clubs','course','courses','country','the','at','of','and','a',
                      'resort','spa','cc','gc','links','championship','tournament','lodge','no')
    ) AS course_tokens
  FROM public.sr_tournaments t
  WHERE t.venue_name IS NOT NULL
),
m AS (
  SELECT
    golf_course_id,
    lower(btrim(sr_venue_name)) AS venue_key,
    lower(btrim(coalesce(sr_venue_course_name, sr_venue_name))) AS course_key
  FROM public.sr_course_map
  WHERE golf_course_id IS NOT NULL
),
step AS (
  SELECT
    tok.*,
    /* RULE 1 - course name is the primary key. */
    (SELECT m.golf_course_id FROM m WHERE m.course_key = lower(tok.venue_course_name) LIMIT 1) AS course_gc,
    (SELECT m.golf_course_id FROM m WHERE m.venue_key = lower(tok.venue_name) LIMIT 1) AS venue_gc,
    /* tokens in the course name that do not appear in the venue name -> a different place. */
    (SELECT count(*) FROM unnest(coalesce(tok.course_tokens, ARRAY[]::text[])) w
      WHERE position(w IN tok.venue_norm) = 0) AS foreign_tokens
  FROM tok
),
classed AS (
  SELECT
    step.*,
    CASE
      WHEN step.course_gc IS NOT NULL THEN 'course'
      WHEN step.venue_course_name IS NULL THEN 'venue'
      WHEN step.foreign_tokens = 0 THEN 'venue'
      ELSE 'unresolved'
    END AS route
  FROM step
),
/* RULE 2 - a venue whose tournaments name more than one course, or name a course
   we cannot resolve, is ambiguous: suppress its venue-name fallbacks. */
ambiguous AS (
  SELECT lower(venue_name) AS venue_key
  FROM classed
  WHERE route = 'venue'
  GROUP BY 1
  HAVING count(DISTINCT lower(venue_course_name)) > 1
  UNION
  SELECT DISTINCT lower(venue_name) FROM classed WHERE route = 'unresolved'
)
SELECT
  c.tournament_id,
  c.venue_name,
  c.venue_course_name,
  CASE
    WHEN c.route = 'course' THEN c.course_gc
    WHEN c.route = 'venue' AND lower(c.venue_name) NOT IN (SELECT venue_key FROM ambiguous) THEN c.venue_gc
    ELSE NULL
  END AS golf_course_id,
  CASE
    WHEN c.route = 'course' THEN 'course_name'
    WHEN c.route = 'venue' AND lower(c.venue_name) IN (SELECT venue_key FROM ambiguous) THEN 'ambiguous_venue'
    WHEN c.route = 'venue' AND c.venue_gc IS NOT NULL THEN 'venue_name_fallback'
    WHEN c.route = 'venue' THEN 'unmapped_venue'
    ELSE 'course_name_unresolved'
  END AS resolution
FROM classed c;

REVOKE ALL ON public.sr_tournament_course_resolution FROM anon, authenticated;
GRANT SELECT ON public.sr_tournament_course_resolution TO service_role;

CREATE OR REPLACE FUNCTION public.get_course_pro_hole_analysis(p_course_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_tids uuid[];
  v_tourneys int := 0;
  v_hole_count int := 0;
  v_player_rounds int := 0;
  v_holes jsonb;
BEGIN
  IF p_course_id IS NULL THEN
    RETURN jsonb_build_object('available', false, 'reason', 'no_course');
  END IF;

  SELECT array_agg(DISTINCT r.tournament_id) INTO v_tids
  FROM public.sr_tournament_course_resolution r
  WHERE r.golf_course_id = p_course_id;

  IF v_tids IS NULL OR array_length(v_tids, 1) = 0 THEN
    RETURN jsonb_build_object('available', false, 'reason', 'no_pro_history');
  END IF;

  SELECT count(DISTINCT tournament_id) INTO v_tourneys
  FROM public.sr_hole_statistics
  WHERE tournament_id = ANY(v_tids) AND par IS NOT NULL;

  IF v_tourneys = 0 THEN
    RETURN jsonb_build_object('available', false, 'reason', 'no_pro_history');
  END IF;

  SELECT count(DISTINCT hole_number) INTO v_hole_count
  FROM public.sr_hole_statistics
  WHERE tournament_id = ANY(v_tids) AND par IS NOT NULL;

  IF v_hole_count NOT IN (9, 18) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'hole_count');
  END IF;

  WITH rows AS (
    SELECT
      hs.hole_number,
      hs.par,
      hs.yardage,
      t.start_date,
      hs.scoring_average,
      coalesce(hs.eagles, 0) AS eagles,
      coalesce(hs.birdies, 0) AS birdies,
      coalesce(hs.pars, 0) AS pars,
      coalesce(hs.bogeys, 0) AS bogeys,
      coalesce(hs.double_bogeys, 0) + coalesce(hs.other, 0) AS doubles,
      coalesce(hs.eagles, 0) + coalesce(hs.birdies, 0) + coalesce(hs.pars, 0)
        + coalesce(hs.bogeys, 0) + coalesce(hs.double_bogeys, 0) + coalesce(hs.other, 0) AS n
    FROM public.sr_hole_statistics hs
    JOIN public.sr_tournaments t ON t.id = hs.tournament_id
    WHERE hs.tournament_id = ANY(v_tids)
      AND hs.par IS NOT NULL
  ),
  /* RULE 3 - one course, par changed between years: take the LATEST par and pool. */
  latest AS (
    SELECT DISTINCT ON (hole_number) hole_number, par, yardage
    FROM rows
    ORDER BY hole_number, start_date DESC NULLS LAST
  ),
  per_hole AS (
    SELECT
      r.hole_number,
      max(l.par) AS par,
      max(l.yardage) AS yards,
      sum(r.n) AS n,
      sum(r.eagles) AS eagles,
      sum(r.birdies) AS birdies,
      sum(r.pars) AS pars,
      sum(r.bogeys) AS bogeys,
      sum(r.doubles) AS doubles,
      CASE WHEN sum(r.n) > 0
        THEN sum(coalesce(r.scoring_average, 0) * r.n) / sum(r.n)
        ELSE avg(r.scoring_average)
      END AS avg_gross
    FROM rows r
    JOIN latest l ON l.hole_number = r.hole_number
    GROUP BY r.hole_number
  )
  SELECT
    max(n)::int,
    jsonb_agg(
      jsonb_build_object(
        'hole_no', hole_number,
        'par', par,
        'yards', yards,
        'stroke_index', NULL,
        'rounds', n,
        'avg_to_par', round((avg_gross - par)::numeric, 2),
        'avg_gross', round(avg_gross::numeric, 2),
        'dist', jsonb_build_object(
          'ace', NULL,
          'albatross', NULL,
          'eagle',  CASE WHEN n > 0 THEN round(100.0 * eagles  / n, 1) ELSE 0 END,
          'birdie', CASE WHEN n > 0 THEN round(100.0 * birdies / n, 1) ELSE 0 END,
          'par',    CASE WHEN n > 0 THEN round(100.0 * pars    / n, 1) ELSE 0 END,
          'bogey',  CASE WHEN n > 0 THEN round(100.0 * bogeys  / n, 1) ELSE 0 END,
          'double', CASE WHEN n > 0 THEN round(100.0 * doubles / n, 1) ELSE 0 END
        )
      ) ORDER BY hole_number
    )
  INTO v_player_rounds, v_holes
  FROM per_hole
  WHERE n > 0;

  IF v_holes IS NULL THEN
    RETURN jsonb_build_object('available', false, 'reason', 'no_pro_history');
  END IF;

  RETURN jsonb_build_object(
    'available', true,
    'total_rounds', coalesce(v_player_rounds, 0),
    'total_tournaments', v_tourneys,
    'holes', v_holes
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_pro_hole_data_queue()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_unresolved jsonb;
  v_ambiguous jsonb;
  v_course_names jsonb;
BEGIN
  PERFORM public.admin_guard();

  /* 1 - tournament venues with no mapping row at all. */
  SELECT coalesce(jsonb_agg(x ORDER BY x->>'venue_name'), '[]'::jsonb) INTO v_unresolved
  FROM (
    SELECT jsonb_build_object(
      'venue_name', r.venue_name,
      'venue_course_name', max(r.venue_course_name),
      'tournaments', count(DISTINCT r.tournament_id)
    ) AS x
    FROM public.sr_tournament_course_resolution r
    WHERE r.resolution = 'unmapped_venue'
    GROUP BY r.venue_name
  ) s;

  /* 2 - venues hosting more than one course that the course name cannot resolve. */
  SELECT coalesce(jsonb_agg(x ORDER BY x->>'venue_name'), '[]'::jsonb) INTO v_ambiguous
  FROM (
    SELECT jsonb_build_object(
      'venue_name', r.venue_name,
      'course_names', jsonb_agg(DISTINCT r.venue_course_name),
      'tournaments', count(DISTINCT r.tournament_id)
    ) AS x
    FROM public.sr_tournament_course_resolution r
    WHERE r.resolution = 'ambiguous_venue'
    GROUP BY r.venue_name
  ) s;

  /* 3 - course names that name a different place we have not mapped. */
  SELECT coalesce(jsonb_agg(x ORDER BY (x->>'tournaments')::int DESC), '[]'::jsonb) INTO v_course_names
  FROM (
    SELECT jsonb_build_object(
      'venue_name', r.venue_name,
      'venue_course_name', r.venue_course_name,
      'tournaments', count(DISTINCT r.tournament_id)
    ) AS x
    FROM public.sr_tournament_course_resolution r
    WHERE r.resolution = 'course_name_unresolved'
    GROUP BY r.venue_name, r.venue_course_name
  ) s;

  RETURN jsonb_build_object(
    'unresolved_venues', v_unresolved,
    'ambiguous_venues', v_ambiguous,
    'unresolved_course_names', v_course_names
  );
END;
$function$;
