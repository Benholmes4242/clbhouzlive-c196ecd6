-- Daily-rotating featured hero (Option A) — 11-column shape incl. filter_tier.
-- Rotates foryou / weekend / hidden / default through the top-100 filtered pool
-- by day-of-year. friends + bucket left as-is. DROP+GRANT required (return-type drift).

DROP FUNCTION IF EXISTS public.get_explore_hero(uuid, text);

CREATE OR REPLACE FUNCTION public.get_explore_hero(
  p_user_id uuid,
  p_mood text
)
RETURNS TABLE (
  course_id uuid,
  course_name text,
  location_primary text,
  location_secondary text,
  hero_image_url text,
  rating_avg numeric,
  review_count int,
  global_rank int,
  why_ai text,
  context_stats jsonb,
  filter_tier text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_played_ids uuid[];
  v_wishlisted_ids uuid[];
  v_top_style text;
  v_similar_course text;
BEGIN
  SELECT COALESCE(ARRAY_AGG(uca.course_id), ARRAY[]::uuid[]) INTO v_played_ids
  FROM user_course_activity uca WHERE uca.user_id = p_user_id AND uca.has_played = true;

  SELECT COALESCE(ARRAY_AGG(cs.course_id), ARRAY[]::uuid[]) INTO v_wishlisted_ids
  FROM course_shortlists cs WHERE cs.user_id = p_user_id AND cs.list_key = 'want_to_play';

  IF p_mood = 'foryou' THEN
    SELECT gc.course_type::text INTO v_top_style
    FROM user_course_activity uca
    JOIN golf_courses gc ON gc.id = uca.course_id
    WHERE uca.user_id = p_user_id AND uca.has_played = true AND gc.course_type IS NOT NULL
    GROUP BY gc.course_type ORDER BY COUNT(*) DESC LIMIT 1;

    SELECT gc.name INTO v_similar_course
    FROM course_ratings cr JOIN golf_courses gc ON gc.id = cr.course_id
    WHERE cr.user_id = p_user_id AND cr.rating IS NOT NULL
    ORDER BY cr.rating DESC NULLS LAST LIMIT 1;

    RETURN QUERY
    WITH pool AS (
      SELECT
        gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country) AS loc2,
        gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int AS rc, gc.global_rank,
        mb.blurb,
        jsonb_build_object('similar_to', v_similar_course, 'style', v_top_style) AS ctx,
        'strict'::text AS tier
      FROM golf_courses gc
      JOIN course_rating_aggregates cra ON cra.course_id = gc.id
      LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'foryou'
         AND (mb.user_id = p_user_id OR (mb.user_id IS NULL AND v_top_style IS NULL))
         AND mb.expires_at > now()
      WHERE cra.avg_overall_score >= 4.0
        AND gc.id <> ALL(v_played_ids)
        AND (v_top_style IS NULL OR gc.course_type::text = v_top_style)
      ORDER BY cra.avg_overall_score DESC NULLS LAST, cra.review_count DESC
      LIMIT 100
    )
    SELECT * FROM pool
    OFFSET (EXTRACT(DOY FROM CURRENT_DATE)::int % GREATEST((SELECT COUNT(*) FROM pool), 1))
    LIMIT 1;

  ELSIF p_mood = 'weekend' THEN
    RETURN QUERY
    WITH pool AS (
      SELECT
        gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country) AS loc2,
        gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int AS rc, gc.global_rank,
        mb.blurb,
        jsonb_build_object('fallback', true, 'note', 'Geolocation not provided server-side') AS ctx,
        'strict'::text AS tier
      FROM golf_courses gc
      JOIN course_rating_aggregates cra ON cra.course_id = gc.id
      LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'weekend'
         AND mb.user_id IS NULL AND mb.expires_at > now()
      WHERE gc.id <> ALL(v_played_ids)
        AND (gc.country ILIKE '%united kingdom%' OR gc.country ILIKE '%britain%' OR gc.sub_country IN ('England','Scotland','Wales','Northern Ireland','Ireland'))
      ORDER BY cra.avg_overall_score DESC NULLS LAST, cra.review_count DESC
      LIMIT 100
    )
    SELECT * FROM pool
    OFFSET (EXTRACT(DOY FROM CURRENT_DATE)::int % GREATEST((SELECT COUNT(*) FROM pool), 1))
    LIMIT 1;

  ELSIF p_mood = 'friends' THEN
    RETURN QUERY
    WITH friend_recs AS (
      SELECT * FROM get_friend_played_recommendations(p_user_id, 1)
    )
    SELECT
      fr.course_id, fr.course_name, gc.country, fr.region,
      fr.thumbnail_image, fr.rating_avg, fr.review_count, gc.global_rank,
      mb.blurb,
      jsonb_build_object(
        'friends_played_count', fr.friend_played_count,
        'top_friend_names', to_jsonb(fr.top_friend_names)
      ),
      'strict'::text
    FROM friend_recs fr
    JOIN golf_courses gc ON gc.id = fr.course_id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = fr.course_id AND mb.mood = 'friends'
       AND (mb.user_id = p_user_id OR mb.user_id IS NULL) AND mb.expires_at > now();

  ELSIF p_mood = 'hidden' THEN
    RETURN QUERY
    WITH pool AS (
      SELECT
        gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country) AS loc2,
        gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int AS rc, gc.global_rank,
        mb.blurb,
        jsonb_build_object('review_count', cra.review_count, 'avg_rating', cra.avg_overall_score) AS ctx,
        'strict'::text AS tier
      FROM golf_courses gc
      JOIN course_rating_aggregates cra ON cra.course_id = gc.id
      LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'hidden'
         AND mb.user_id IS NULL AND mb.expires_at > now()
      WHERE cra.avg_overall_score >= 4.0
        AND cra.review_count BETWEEN 3 AND 24
        AND (gc.global_rank IS NULL OR gc.global_rank > 200)
        AND gc.id <> ALL(v_played_ids)
        AND gc.id <> ALL(v_wishlisted_ids)
      ORDER BY cra.avg_overall_score DESC, cra.review_count DESC
      LIMIT 100
    )
    SELECT * FROM pool
    OFFSET (EXTRACT(DOY FROM CURRENT_DATE)::int % GREATEST((SELECT COUNT(*) FROM pool), 1))
    LIMIT 1;

  ELSIF p_mood = 'bucket' THEN
    RETURN QUERY
    WITH wish_counts AS (
      SELECT cs.course_id AS cid, COUNT(*)::int AS cnt
      FROM course_shortlists cs
      WHERE cs.list_key = 'want_to_play'
      GROUP BY cs.course_id
    )
    SELECT
      gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
      gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
      mb.blurb,
      jsonb_build_object('wishlist_count_in_network', wc.cnt),
      'strict'::text
    FROM wish_counts wc
    JOIN golf_courses gc ON gc.id = wc.cid
    LEFT JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'bucket'
       AND mb.user_id IS NULL AND mb.expires_at > now()
    WHERE gc.id <> ALL(v_wishlisted_ids)
      AND gc.id <> ALL(v_played_ids)
    ORDER BY wc.cnt DESC
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN QUERY
    WITH pool AS (
      SELECT
        gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country) AS loc2,
        gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int AS rc, gc.global_rank,
        NULL::text AS blurb,
        jsonb_build_object('fallback', true) AS ctx,
        'relaxed'::text AS tier
      FROM golf_courses gc
      JOIN course_rating_aggregates cra ON cra.course_id = gc.id
      WHERE gc.id <> ALL(v_played_ids)
      ORDER BY cra.avg_overall_score DESC NULLS LAST, cra.review_count DESC
      LIMIT 100
    )
    SELECT * FROM pool
    OFFSET (EXTRACT(DOY FROM CURRENT_DATE)::int % GREATEST((SELECT COUNT(*) FROM pool), 1))
    LIMIT 1;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_explore_hero(uuid, text) TO authenticated;