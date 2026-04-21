-- 1. Internal helper: friend set (friends + reverse-direction friends + outgoing follows)
CREATE OR REPLACE FUNCTION public._get_user_friend_set(p_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(ARRAY_AGG(DISTINCT fid), ARRAY[]::uuid[])
  FROM (
    SELECT uf.friend_id AS fid
      FROM user_friends uf
      WHERE uf.user_id = p_user_id AND uf.status = 'accepted'
    UNION
    SELECT uf2.user_id
      FROM user_friends uf2
      WHERE uf2.friend_id = p_user_id AND uf2.status = 'accepted'
    UNION
    SELECT ufl.following_id
      FROM user_follows ufl
      WHERE ufl.follower_id = p_user_id
  ) s
  WHERE fid IS NOT NULL AND fid <> p_user_id;
$$;

-- 2. Refactor get_friend_played_recommendations to use the helper
CREATE OR REPLACE FUNCTION public.get_friend_played_recommendations(p_user_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(course_id uuid, course_name text, country text, region text, thumbnail_image text, rating_avg numeric, review_count integer, friend_played_count integer, top_friend_names text[], friend_rating_avg numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_friends uuid[];
BEGIN
  v_friends := public._get_user_friend_set(p_user_id);

  RETURN QUERY
  WITH played AS (
    SELECT uca.course_id AS cid, uca.user_id AS uid, uca.played_at
    FROM user_course_activity uca
    WHERE uca.has_played = true
      AND uca.user_id = ANY(v_friends)
      AND uca.user_id <> p_user_id
      AND uca.played_at > now() - interval '90 days'
  ),
  self_played AS (
    SELECT uca.course_id AS cid
    FROM user_course_activity uca
    WHERE uca.user_id = p_user_id AND uca.has_played = true
  ),
  ranked_friends AS (
    SELECT p.cid, up.display_name,
      ROW_NUMBER() OVER (PARTITION BY p.cid ORDER BY p.played_at DESC NULLS LAST) AS rn
    FROM played p
    JOIN user_profiles up ON up.id = p.uid
    WHERE up.display_name IS NOT NULL
  ),
  top_names AS (
    SELECT cid, ARRAY_AGG(display_name ORDER BY rn) FILTER (WHERE rn <= 3) AS names
    FROM ranked_friends GROUP BY cid
  ),
  counts AS (
    SELECT cid, COUNT(DISTINCT uid)::int AS cnt
    FROM played GROUP BY cid
  ),
  fr_ratings AS (
    SELECT cr.course_id AS cid, AVG(cr.rating)::numeric AS avg_r
    FROM course_ratings cr
    WHERE cr.user_id = ANY(v_friends)
      AND cr.rating IS NOT NULL
      AND cr.is_mock IS NOT TRUE
    GROUP BY cr.course_id
  )
  SELECT
    gc.id,
    gc.name,
    gc.country,
    COALESCE(gc.region, gc.sub_country),
    gc.thumbnail_image,
    cra.avg_overall_score,
    cra.review_count::int,
    c.cnt,
    COALESCE(tn.names, ARRAY[]::text[]),
    CASE WHEN fr.avg_r IS NOT NULL THEN ROUND(fr.avg_r, 1) ELSE NULL END
  FROM counts c
  JOIN golf_courses gc ON gc.id = c.cid
  LEFT JOIN course_rating_aggregates cra ON cra.course_id = gc.id
  LEFT JOIN top_names tn ON tn.cid = c.cid
  LEFT JOIN fr_ratings fr ON fr.cid = c.cid
  WHERE c.cid NOT IN (SELECT cid FROM self_played)
  ORDER BY c.cnt DESC, fr.avg_r DESC NULLS LAST, cra.avg_overall_score DESC NULLS LAST
  LIMIT p_limit;
END;
$function$;

-- 3. Refactor get_user_passport to use the helper
CREATE OR REPLACE FUNCTION public.get_user_passport(p_user_id uuid, p_year integer DEFAULT (EXTRACT(year FROM now()))::integer)
RETURNS TABLE(courses_played integer, countries_played integer, avg_rating_given numeric, reviews_written integer, top_100_played integer, wishlist_count integer, friends_courses_to_try integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_played_courses uuid[];
  v_friends uuid[];
BEGIN
  SELECT COALESCE(ARRAY_AGG(DISTINCT uca.course_id), ARRAY[]::uuid[])
    INTO v_played_courses
  FROM user_course_activity uca
  WHERE uca.user_id = p_user_id
    AND uca.has_played = true
    AND EXTRACT(YEAR FROM uca.played_at) = p_year;

  v_friends := public._get_user_friend_set(p_user_id);

  RETURN QUERY
  WITH played AS (
    SELECT DISTINCT gc.id AS course_id, gc.country, gc.sub_country
    FROM user_course_activity uca
    JOIN golf_courses gc ON gc.id = uca.course_id
    WHERE uca.user_id = p_user_id
      AND uca.has_played = true
      AND EXTRACT(YEAR FROM uca.played_at) = p_year
  ),
  ratings AS (
    SELECT cr.rating, cr.review
    FROM course_ratings cr
    WHERE cr.user_id = p_user_id
      AND EXTRACT(YEAR FROM cr.review_date) = p_year
  ),
  wish AS (
    SELECT cs.course_id
    FROM course_shortlists cs
    WHERE cs.user_id = p_user_id AND cs.list_key = 'want_to_play'
  ),
  friend_played AS (
    SELECT DISTINCT uca.course_id AS cid
    FROM user_course_activity uca
    WHERE uca.user_id = ANY(v_friends)
      AND uca.user_id <> p_user_id
      AND uca.has_played = true
  )
  SELECT
    (SELECT COUNT(*)::int FROM played),
    (SELECT COUNT(DISTINCT COALESCE(p.sub_country, p.country))::int FROM played p WHERE COALESCE(p.sub_country, p.country) IS NOT NULL),
    (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM ratings r WHERE r.rating IS NOT NULL),
    (SELECT COUNT(*)::int FROM ratings r WHERE r.review IS NOT NULL AND length(trim(r.review)) > 0),
    (SELECT COUNT(*)::int FROM played p
       WHERE EXISTS (SELECT 1 FROM course_top100_memberships ctm WHERE ctm.course_id = p.course_id)),
    (SELECT COUNT(*)::int FROM wish),
    (SELECT COUNT(*)::int FROM friend_played fp
       WHERE fp.cid <> ALL(v_played_courses)
       AND fp.cid NOT IN (SELECT course_id FROM wish));
END;
$function$;

-- 4. Drop and recreate get_explore_hero with new filter_tier column + hidden mood relaxation
DROP FUNCTION IF EXISTS public.get_explore_hero(uuid, text);

CREATE OR REPLACE FUNCTION public.get_explore_hero(p_user_id uuid, p_mood text)
RETURNS TABLE(course_id uuid, course_name text, location_primary text, location_secondary text, hero_image_url text, rating_avg numeric, review_count integer, global_rank integer, why_ai text, context_stats jsonb, filter_tier text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_played_ids uuid[];
  v_wishlisted_ids uuid[];
  v_top_style text;
  v_similar_course text;
  v_friend_recs_count int;
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
    SELECT
      gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
      gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
      mb.blurb,
      jsonb_build_object('similar_to', v_similar_course, 'style', v_top_style),
      'strict'::text
    FROM golf_courses gc
    JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'foryou'
       AND (mb.user_id = p_user_id OR (mb.user_id IS NULL AND v_top_style IS NULL))
       AND mb.expires_at > now()
    WHERE cra.avg_overall_score >= 4.0
      AND gc.id <> ALL(v_played_ids)
      AND (v_top_style IS NULL OR gc.course_type::text = v_top_style)
    ORDER BY cra.avg_overall_score DESC NULLS LAST, cra.review_count DESC
    LIMIT 1;

  ELSIF p_mood = 'weekend' THEN
    RETURN QUERY
    SELECT
      gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
      gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
      mb.blurb,
      jsonb_build_object('fallback', true, 'note', 'Geolocation not provided server-side'),
      'strict'::text
    FROM golf_courses gc
    JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'weekend'
       AND mb.user_id IS NULL AND mb.expires_at > now()
    WHERE gc.id <> ALL(v_played_ids)
      AND (gc.country ILIKE '%united kingdom%' OR gc.country ILIKE '%britain%' OR gc.sub_country IN ('England','Scotland','Wales','Northern Ireland','Ireland'))
    ORDER BY cra.avg_overall_score DESC NULLS LAST, cra.review_count DESC
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
    -- Tier 1: strict
    RETURN QUERY
    SELECT
      gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
      gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
      mb.blurb,
      jsonb_build_object('review_count', cra.review_count, 'avg_rating', cra.avg_overall_score),
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
    ORDER BY cra.avg_overall_score DESC, cra.review_count DESC
    LIMIT 1;

    IF NOT FOUND THEN
      -- Tier 2: expanded review_count window
      RETURN QUERY
      SELECT
        gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
        gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
        mb.blurb,
        jsonb_build_object('review_count', cra.review_count, 'avg_rating', cra.avg_overall_score),
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
      ORDER BY cra.avg_overall_score DESC, cra.review_count DESC
      LIMIT 1;
    END IF;

    IF NOT FOUND THEN
      -- Tier 3: relaxed ranking filter
      RETURN QUERY
      SELECT
        gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
        gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
        mb.blurb,
        jsonb_build_object('review_count', cra.review_count, 'avg_rating', cra.avg_overall_score),
        'relaxed'::text
      FROM golf_courses gc
      JOIN course_rating_aggregates cra ON cra.course_id = gc.id
      LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'hidden'
         AND mb.user_id IS NULL AND mb.expires_at > now()
      WHERE cra.avg_overall_score >= 4.0
        AND cra.review_count BETWEEN 3 AND 50
        AND gc.id <> ALL(v_played_ids)
        AND gc.id <> ALL(v_wishlisted_ids)
      ORDER BY cra.avg_overall_score DESC, cra.review_count DESC
      LIMIT 1;
    END IF;

    IF NOT FOUND THEN
      -- Tier 4: include played, deprioritised
      RETURN QUERY
      SELECT
        gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
        gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
        mb.blurb,
        jsonb_build_object('review_count', cra.review_count, 'avg_rating', cra.avg_overall_score, 'already_played', (gc.id = ANY(v_played_ids))),
        'played_included'::text
      FROM golf_courses gc
      JOIN course_rating_aggregates cra ON cra.course_id = gc.id
      LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'hidden'
         AND mb.user_id IS NULL AND mb.expires_at > now()
      WHERE cra.avg_overall_score >= 4.0
        AND cra.review_count BETWEEN 3 AND 50
      ORDER BY (gc.id = ANY(v_played_ids)) ASC, cra.avg_overall_score DESC, cra.review_count DESC
      LIMIT 1;
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
    SELECT
      gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
      gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
      NULL::text,
      jsonb_build_object('fallback', true),
      'fallback'::text
    FROM golf_courses gc
    JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    WHERE gc.id <> ALL(v_played_ids)
    ORDER BY cra.avg_overall_score DESC NULLS LAST, cra.review_count DESC
    LIMIT 1;
  END IF;
END;
$function$;

-- 5. Drop and recreate get_explore_recommendations with new filter_tier column + hidden mood relaxation
DROP FUNCTION IF EXISTS public.get_explore_recommendations(uuid, text, integer);

CREATE OR REPLACE FUNCTION public.get_explore_recommendations(p_user_id uuid, p_mood text, p_limit integer DEFAULT 2)
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
      -- Tier 2: expanded review_count window
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
      -- Tier 3: relaxed ranking filter
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
      -- Tier 4: include played courses, deprioritised
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
      ('Wishlisted by ' || wc.cnt)::text,
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