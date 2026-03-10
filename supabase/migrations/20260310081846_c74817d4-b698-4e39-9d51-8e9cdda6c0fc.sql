CREATE OR REPLACE FUNCTION echo_get_course_context(
  p_query   text    DEFAULT NULL,
  p_country text    DEFAULT NULL,
  p_limit   int     DEFAULT 8
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_courses jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'name',           gc.name,
      'country',        gc.country,
      'region',         gc.region,
      'course_type',    gc.course_type,
      'global_rank',    gc.global_rank,
      'country_rank',   gc.country_rank,
      'has_hosted_major', gc.has_hosted_major,
      'avg_rating',     round(cra.avg_overall_score::numeric, 2),
      'review_count',   cra.review_count,
      'design_score',   round(cra.avg_design_score::numeric, 2),
      'condition_score', round(cra.avg_condition_score::numeric, 2),
      'facilities_score', round(cra.avg_facilities_score::numeric, 2)
    )
    ORDER BY cra.avg_overall_score DESC NULLS LAST
  )
  INTO v_courses
  FROM golf_courses gc
  LEFT JOIN course_rating_aggregates cra ON cra.course_id = gc.id
  WHERE
    (
      p_country IS NULL
      OR lower(gc.country) = lower(p_country)
      OR (
        lower(p_country) IN ('ireland', 'northern ireland', 'scotland', 'england', 'wales', 'uk', 'britain')
        AND lower(gc.country) = 'britain & ireland'
      )
      OR lower(gc.region) ILIKE lower('%' || p_country || '%')
    )
    AND (
      p_query IS NULL
      OR lower(gc.name) ILIKE lower('%' || p_query || '%')
      OR lower(coalesce(gc.region, '')) ILIKE lower('%' || p_query || '%')
      OR lower(gc.country) ILIKE lower('%' || p_query || '%')
    )
    AND cra.review_count > 0
  LIMIT p_limit;

  RETURN jsonb_build_object(
    'available', v_courses IS NOT NULL,
    'courses',   coalesce(v_courses, '[]'::jsonb),
    'query',     p_query,
    'country',   p_country
  );
END;
$$;