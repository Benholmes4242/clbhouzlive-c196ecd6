
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
BEGIN
  CREATE TEMP TABLE _records ON COMMIT DROP AS
  WITH eligible AS (
    SELECT
      v.course_id, v.course_name, v.category, v.value, v.user_id, v.attained_at,
      v.trigger_whs_score_id,
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
      course_id, course_name, category, value, user_id, attained_at, trigger_whs_score_id, notability
    FROM eligible
    ORDER BY course_id, notability ASC, attained_at DESC
  ),
  per_user_ranked AS (
    SELECT pc.*,
      ROW_NUMBER() OVER (
        PARTITION BY pc.user_id
        ORDER BY pc.notability ASC, pc.attained_at DESC
      ) AS user_rn
    FROM per_course pc
  ),
  capped AS (
    SELECT * FROM per_user_ranked WHERE user_rn = 1
  )
  SELECT
    c.course_id, c.course_name, c.category, c.value, c.user_id, c.attained_at,
    c.trigger_whs_score_id AS score_id,
    c.notability,
    gc.thumbnail_image,
    up.display_name       AS holder_name,
    up.username           AS holder_username,
    up.profile_photo_url  AS holder_avatar,
    up.eg_handicap_index  AS holder_hcp,
    up.home_club          AS holder_club,
    CASE
      WHEN gc.country = 'Britain & Ireland' THEN 'gbi'
      WHEN gc.country = 'USA' THEN 'usa'
      WHEN gc.country = 'Continental Europe' THEN 'europe'
      WHEN gc.country IN ('Oceania','Asia','Africa','Caribbean','Middle East','Central and South America') THEN 'row'
      ELSE 'row'
    END AS region
  FROM capped c
  LEFT JOIN golf_courses gc ON gc.id = c.course_id
  LEFT JOIN user_profiles up ON up.id = c.user_id
  WHERE up.deleted_at IS NULL;

  SELECT
    COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.attained_at DESC), '[]'::jsonb),
    COUNT(*)
  INTO v_payload, v_count
  FROM (
    SELECT course_id, course_name, category, value, user_id, attained_at, score_id,
           thumbnail_image, holder_name, holder_username, holder_avatar,
           holder_hcp, holder_club
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

  FOR v_region IN SELECT unnest(ARRAY['worldwide','gbi','usa','europe','row'])
  LOOP
    INSERT INTO public.discover_rail_cache (rail_key, payload, item_count, computed_at)
    SELECT
      'records:' || v_region,
      COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.attained_at DESC), '[]'::jsonb),
      COUNT(*),
      now()
    FROM (
      SELECT course_id, course_name, category, value, user_id, attained_at, score_id,
             thumbnail_image, holder_name, holder_username, holder_avatar,
             holder_hcp, holder_club
      FROM _records r
      WHERE (v_region = 'worldwide' OR r.region = v_region)
      ORDER BY r.notability ASC, r.attained_at DESC
      LIMIT 50
    ) t
    ON CONFLICT (rail_key)
    DO UPDATE SET payload = EXCLUDED.payload,
                  item_count = EXCLUDED.item_count,
                  computed_at = EXCLUDED.computed_at;
  END LOOP;
END;
$function$;

SELECT public.refresh_latest_records_cache();
