-- =========================================================
-- GROUP 1: Drop broken get_user_passport(uuid, integer) overload
-- =========================================================
DROP FUNCTION IF EXISTS public.get_user_passport(uuid, integer);

-- =========================================================
-- GROUP 3.4 + GROUP 4.4: Recreate get_explore_recommendations with
--   - default p_limit = 4 (was 2)
--   - bucket match_label uses natural pluralization
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_explore_recommendations(p_user_id uuid, p_mood text, p_limit integer DEFAULT 4)
 RETURNS TABLE(course_id uuid, course_name text, location_primary text, location_secondary text, hero_image_url text, rating_avg numeric, review_count integer, global_rank integer, why_ai text, context_stats jsonb, match_label text, filter_tier text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_played_ids uuid[];
  v_wishlisted_ids uuid[];
  v_top_style text;
  v_hero_id uuid;
  v_hidden_count int;
BEGIN
  SELECT h.course_id INTO v_hero_id FROM get_explore_hero(p_user_id, p_mood) h LIMIT 1;

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

    RETURN QUERY
    SELECT
      gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
      gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
      mb.blurb,
      jsonb_build_object('style', v_top_style),
      CASE WHEN v_top_style IS NOT NULL THEN ROUND(LEAST(99, 80 + (cra.avg_overall_score * 4))) || '% match'
           ELSE 'Top rated' END,
      'strict'::text
    FROM golf_courses gc
    JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'foryou'
       AND (mb.user_id = p_user_id OR mb.user_id IS NULL) AND mb.expires_at > now()
    WHERE cra.avg_overall_score >= 4.0
      AND gc.id <> ALL(v_played_ids)
      AND (v_hero_id IS NULL OR gc.id <> v_hero_id)
      AND (v_top_style IS NULL OR gc.course_type::text = v_top_style)
    ORDER BY cra.avg_overall_score DESC NULLS LAST, cra.review_count DESC
    LIMIT p_limit;

  ELSIF p_mood = 'weekend' THEN
    RETURN QUERY
    SELECT
      gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
      gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
      mb.blurb,
      jsonb_build_object('fallback', true),
      'Saturday AM'::text,
      'strict'::text
    FROM golf_courses gc
    JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'weekend'
       AND mb.user_id IS NULL AND mb.expires_at > now()
    WHERE gc.id <> ALL(v_played_ids)
      AND (v_hero_id IS NULL OR gc.id <> v_hero_id)
      AND (gc.country ILIKE '%united kingdom%' OR gc.country ILIKE '%britain%' OR gc.sub_country IN ('England','Scotland','Wales','Northern Ireland','Ireland'))
    ORDER BY cra.avg_overall_score DESC NULLS LAST, cra.review_count DESC
    LIMIT p_limit;

  ELSIF p_mood = 'friends' THEN
    RETURN QUERY
    WITH friend_recs AS (
      SELECT * FROM get_friend_played_recommendations(p_user_id, 10)
    )
    SELECT
      fr.course_id, fr.course_name, gc.country, fr.region,
      fr.thumbnail_image, fr.rating_avg, fr.review_count, gc.global_rank,
      mb.blurb,
      jsonb_build_object('friends_played_count', fr.friend_played_count, 'top_friend_names', to_jsonb(fr.top_friend_names)),
      (fr.friend_played_count || ' friend' || CASE WHEN fr.friend_played_count = 1 THEN '' ELSE 's' END || ' played')::text,
      'strict'::text
    FROM friend_recs fr
    JOIN golf_courses gc ON gc.id = fr.course_id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = fr.course_id AND mb.mood = 'friends'
       AND (mb.user_id = p_user_id OR mb.user_id IS NULL) AND mb.expires_at > now()
    WHERE (v_hero_id IS NULL OR fr.course_id <> v_hero_id)
    LIMIT p_limit;

  ELSIF p_mood = 'hidden' THEN
    -- Tier 1: strict
    RETURN QUERY
    SELECT
      gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
      gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
      mb.blurb,
      jsonb_build_object('review_count', cra.review_count, 'avg_rating', cra.avg_overall_score),
      'Hidden gem'::text,
      'strict'::text
    FROM golf_courses gc
    JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'hidden'
       AND mb.user_id IS NULL AND mb.expires_at > now()
    WHERE cra.avg_overall_score >= 4.0
      AND cra.review_count BETWEEN 3 AND 24
      AND (gc.global_rank IS NULL OR gc.global_rank > 200)
      AND gc.id <> ALL(v_played_ids)
      AND gc.id <> ALL(v_wishlisted_ids)
      AND (v_hero_id IS NULL OR gc.id <> v_hero_id)
    ORDER BY cra.avg_overall_score DESC, cra.review_count DESC
    LIMIT p_limit;

    GET DIAGNOSTICS v_hidden_count = ROW_COUNT;

    IF v_hidden_count < 2 THEN
      RETURN QUERY
      SELECT
        gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
        gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
        mb.blurb,
        jsonb_build_object('review_count', cra.review_count, 'avg_rating', cra.avg_overall_score),
        'Hidden gem'::text,
        'expanded'::text
      FROM golf_courses gc
      JOIN course_rating_aggregates cra ON cra.course_id = gc.id
      LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'hidden'
         AND mb.user_id IS NULL AND mb.expires_at > now()
      WHERE cra.avg_overall_score >= 4.0
        AND cra.review_count BETWEEN 3 AND 50
        AND (gc.global_rank IS NULL OR gc.global_rank > 200)
        AND gc.id <> ALL(v_played_ids)
        AND gc.id <> ALL(v_wishlisted_ids)
        AND (v_hero_id IS NULL OR gc.id <> v_hero_id)
      ORDER BY cra.avg_overall_score DESC, cra.review_count DESC
      LIMIT p_limit;

      GET DIAGNOSTICS v_hidden_count = ROW_COUNT;
    END IF;

    IF v_hidden_count < 2 THEN
      RETURN QUERY
      SELECT
        gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
        gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
        mb.blurb,
        jsonb_build_object('review_count', cra.review_count, 'avg_rating', cra.avg_overall_score),
        'Hidden gem'::text,
        'relaxed'::text
      FROM golf_courses gc
      JOIN course_rating_aggregates cra ON cra.course_id = gc.id
      LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'hidden'
         AND mb.user_id IS NULL AND mb.expires_at > now()
      WHERE cra.avg_overall_score >= 4.0
        AND cra.review_count BETWEEN 3 AND 50
        AND gc.id <> ALL(v_played_ids)
        AND gc.id <> ALL(v_wishlisted_ids)
        AND (v_hero_id IS NULL OR gc.id <> v_hero_id)
      ORDER BY cra.avg_overall_score DESC, cra.review_count DESC
      LIMIT p_limit;

      GET DIAGNOSTICS v_hidden_count = ROW_COUNT;
    END IF;

    IF v_hidden_count < 2 THEN
      RETURN QUERY
      SELECT
        gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
        gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
        mb.blurb,
        jsonb_build_object('review_count', cra.review_count, 'avg_rating', cra.avg_overall_score, 'already_played', (gc.id = ANY(v_played_ids))),
        'Hidden gem'::text,
        'played_included'::text
      FROM golf_courses gc
      JOIN course_rating_aggregates cra ON cra.course_id = gc.id
      LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'hidden'
         AND mb.user_id IS NULL AND mb.expires_at > now()
      WHERE cra.avg_overall_score >= 4.0
        AND cra.review_count BETWEEN 3 AND 50
        AND (v_hero_id IS NULL OR gc.id <> v_hero_id)
      ORDER BY (gc.id = ANY(v_played_ids)) ASC, cra.avg_overall_score DESC, cra.review_count DESC
      LIMIT p_limit;
    END IF;

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
      (CASE WHEN wc.cnt = 1 THEN 'On 1 wishlist'
            ELSE 'On ' || wc.cnt || ' wishlists' END)::text,
      'strict'::text
    FROM wish_counts wc
    JOIN golf_courses gc ON gc.id = wc.cid
    LEFT JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'bucket'
       AND mb.user_id IS NULL AND mb.expires_at > now()
    WHERE gc.id <> ALL(v_wishlisted_ids)
      AND gc.id <> ALL(v_played_ids)
      AND (v_hero_id IS NULL OR gc.id <> v_hero_id)
    ORDER BY wc.cnt DESC
    LIMIT p_limit;
  END IF;
END;
$function$;