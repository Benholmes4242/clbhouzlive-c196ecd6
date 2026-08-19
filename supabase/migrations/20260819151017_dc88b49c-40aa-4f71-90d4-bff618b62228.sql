CREATE OR REPLACE FUNCTION public.get_course_pro_hole_analysis(p_course_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_tids uuid[];
  v_tourneys int := 0;
  v_bad int := 0;
  v_hole_count int := 0;
  v_player_rounds int := 0;
  v_holes jsonb;
BEGIN
  IF p_course_id IS NULL THEN
    RETURN jsonb_build_object('available', false, 'reason', 'no_course');
  END IF;

  SELECT array_agg(DISTINCT t.id) INTO v_tids
  FROM public.sr_tournaments t
  JOIN public.sr_course_map m
    ON lower(btrim(t.venue_name)) = lower(btrim(m.sr_venue_name))
   AND (m.sr_venue_course_name IS NULL
        OR lower(btrim(m.sr_venue_course_name)) = lower(btrim(coalesce(t.venue_course_name, ''))))
  WHERE m.golf_course_id = p_course_id;

  IF v_tids IS NULL OR array_length(v_tids, 1) = 0 THEN
    RETURN jsonb_build_object('available', false, 'reason', 'no_pro_history');
  END IF;

  SELECT count(DISTINCT tournament_id) INTO v_tourneys
  FROM public.sr_hole_statistics
  WHERE tournament_id = ANY(v_tids) AND par IS NOT NULL;

  IF v_tourneys = 0 THEN
    RETURN jsonb_build_object('available', false, 'reason', 'no_pro_history');
  END IF;

  /* PAR GUARD: pooled tournaments must agree on each hole's par. */
  SELECT count(*) INTO v_bad
  FROM (
    SELECT hole_number
    FROM public.sr_hole_statistics
    WHERE tournament_id = ANY(v_tids) AND par IS NOT NULL
    GROUP BY hole_number
    HAVING count(DISTINCT par) > 1
  ) bad;

  IF v_bad > 0 THEN
    RETURN jsonb_build_object('available', false, 'reason', 'par_disagreement');
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
      hs.scoring_average,
      coalesce(hs.eagles, 0) AS eagles,
      coalesce(hs.birdies, 0) AS birdies,
      coalesce(hs.pars, 0) AS pars,
      coalesce(hs.bogeys, 0) AS bogeys,
      coalesce(hs.double_bogeys, 0) + coalesce(hs.other, 0) AS doubles,
      coalesce(hs.eagles, 0) + coalesce(hs.birdies, 0) + coalesce(hs.pars, 0)
        + coalesce(hs.bogeys, 0) + coalesce(hs.double_bogeys, 0) + coalesce(hs.other, 0) AS n
    FROM public.sr_hole_statistics hs
    WHERE hs.tournament_id = ANY(v_tids)
      AND hs.par IS NOT NULL
  ), per_hole AS (
    SELECT
      hole_number,
      mode() WITHIN GROUP (ORDER BY par) AS par,
      mode() WITHIN GROUP (ORDER BY yardage) AS yards,
      sum(n) AS n,
      sum(eagles) AS eagles,
      sum(birdies) AS birdies,
      sum(pars) AS pars,
      sum(bogeys) AS bogeys,
      sum(doubles) AS doubles,
      CASE WHEN sum(n) > 0
        THEN sum(coalesce(scoring_average, 0) * n) / sum(n)
        ELSE avg(scoring_average)
      END AS avg_gross
    FROM rows
    GROUP BY hole_number
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

GRANT EXECUTE ON FUNCTION public.get_course_pro_hole_analysis(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_pro_hole_data_queue()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_unresolved jsonb;
  v_ambiguous jsonb;
  v_par jsonb;
BEGIN
  PERFORM public.admin_guard();

  /* 1 - tournament venues with no mapping row at all. */
  SELECT coalesce(jsonb_agg(x ORDER BY x->>'venue_name'), '[]'::jsonb) INTO v_unresolved
  FROM (
    SELECT jsonb_build_object(
      'venue_name', t.venue_name,
      'venue_course_name', max(t.venue_course_name),
      'venue_city', max(t.venue_city),
      'venue_country', max(t.venue_country),
      'tournaments', count(DISTINCT t.id)
    ) AS x
    FROM public.sr_tournaments t
    WHERE t.venue_name IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.sr_course_map m
        WHERE lower(btrim(m.sr_venue_name)) = lower(btrim(t.venue_name))
      )
    GROUP BY t.venue_name
  ) s;

  /* 2 - mapping rows that resolve to nothing, or a venue whose tournaments
         name more than one course while the mapping names none. */
  SELECT coalesce(jsonb_agg(x ORDER BY x->>'venue_name'), '[]'::jsonb) INTO v_ambiguous
  FROM (
    SELECT jsonb_build_object(
      'venue_name', m.sr_venue_name,
      'mapped_course_name', m.sr_venue_course_name,
      'golf_course_id', m.golf_course_id,
      'tournament_course_names', (
        SELECT coalesce(jsonb_agg(DISTINCT t.venue_course_name), '[]'::jsonb)
        FROM public.sr_tournaments t
        WHERE lower(btrim(t.venue_name)) = lower(btrim(m.sr_venue_name))
          AND t.venue_course_name IS NOT NULL
      )
    ) AS x
    FROM public.sr_course_map m
    WHERE m.golf_course_id IS NULL
       OR (
         m.sr_venue_course_name IS NULL
         AND (
           SELECT count(DISTINCT t.venue_course_name)
           FROM public.sr_tournaments t
           WHERE lower(btrim(t.venue_name)) = lower(btrim(m.sr_venue_name))
             AND t.venue_course_name IS NOT NULL
         ) > 1
       )
  ) s;

  /* 3 - courses where pooled tournaments disagree on a hole's par. */
  SELECT coalesce(jsonb_agg(x ORDER BY (x->>'bad_holes')::int DESC), '[]'::jsonb) INTO v_par
  FROM (
    SELECT jsonb_build_object(
      'golf_course_id', p.gcid,
      'course_name', gc.name,
      'bad_holes', count(*),
      'holes', jsonb_agg(jsonb_build_object('hole_no', p.hole_number, 'pars', p.par_list) ORDER BY p.hole_number)
    ) AS x
    FROM (
      SELECT m.golf_course_id AS gcid, hs.hole_number,
             to_jsonb(array_agg(DISTINCT hs.par)) AS par_list
      FROM public.sr_tournaments t
      JOIN public.sr_course_map m
        ON lower(btrim(t.venue_name)) = lower(btrim(m.sr_venue_name))
       AND (m.sr_venue_course_name IS NULL
            OR lower(btrim(m.sr_venue_course_name)) = lower(btrim(coalesce(t.venue_course_name, ''))))
      JOIN public.sr_hole_statistics hs ON hs.tournament_id = t.id
      WHERE m.golf_course_id IS NOT NULL AND hs.par IS NOT NULL
      GROUP BY m.golf_course_id, hs.hole_number
      HAVING count(DISTINCT hs.par) > 1
    ) p
    JOIN public.golf_courses gc ON gc.id = p.gcid
    GROUP BY p.gcid, gc.name
  ) s;

  RETURN jsonb_build_object(
    'unresolved_venues', v_unresolved,
    'ambiguous_venues', v_ambiguous,
    'par_disagreements', v_par
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_pro_hole_data_queue() TO authenticated, service_role;