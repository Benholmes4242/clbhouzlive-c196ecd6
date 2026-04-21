
-- =========================================================================
-- 1. course_mood_blurbs — AI blurb cache
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.course_mood_blurbs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.golf_courses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  mood text NOT NULL CHECK (mood IN ('foryou','weekend','friends','hidden','bucket','hero_feature')),
  blurb text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

-- Unique constraint with NULLS NOT DISTINCT so (course, NULL, mood) is enforced as unique
CREATE UNIQUE INDEX IF NOT EXISTS course_mood_blurbs_unique_idx
  ON public.course_mood_blurbs (course_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), mood);

CREATE INDEX IF NOT EXISTS course_mood_blurbs_user_mood_idx
  ON public.course_mood_blurbs (user_id, mood, expires_at);

CREATE INDEX IF NOT EXISTS course_mood_blurbs_generic_idx
  ON public.course_mood_blurbs (course_id, mood) WHERE user_id IS NULL;

ALTER TABLE public.course_mood_blurbs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own mood blurbs"
  ON public.course_mood_blurbs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone authenticated can read generic mood blurbs"
  ON public.course_mood_blurbs FOR SELECT
  TO authenticated
  USING (user_id IS NULL);

-- No INSERT/UPDATE/DELETE policies = service role only.

-- =========================================================================
-- 2. get_friend_played_recommendations
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_friend_played_recommendations(
  p_user_id uuid,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  course_id uuid,
  course_name text,
  country text,
  region text,
  thumbnail_image text,
  rating_avg numeric,
  review_count int,
  friend_played_count int,
  top_friend_names text[],
  friend_rating_avg numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH friends AS (
    SELECT uf.friend_id AS fid FROM user_friends uf
    WHERE uf.user_id = p_user_id AND uf.status = 'accepted'
    UNION
    SELECT uf2.user_id FROM user_friends uf2
    WHERE uf2.friend_id = p_user_id AND uf2.status = 'accepted'
    UNION
    SELECT ufl.following_id FROM user_follows ufl
    WHERE ufl.follower_id = p_user_id
  ),
  played AS (
    SELECT uca.course_id AS cid, uca.user_id AS uid, uca.played_at
    FROM user_course_activity uca
    WHERE uca.has_played = true
      AND uca.user_id IN (SELECT fid FROM friends)
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
    WHERE cr.user_id IN (SELECT fid FROM friends)
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
$$;

GRANT EXECUTE ON FUNCTION public.get_friend_played_recommendations(uuid, int) TO authenticated;

-- =========================================================================
-- 3. get_nearby_courses (PostGIS available — use ST_DistanceSphere)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_nearby_courses(
  p_user_lat float,
  p_user_lng float,
  p_radius_km int DEFAULT 100,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  course_id uuid,
  course_name text,
  country text,
  region text,
  thumbnail_image text,
  rating_avg numeric,
  review_count int,
  global_rank int,
  distance_km numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
  IF p_user_lat IS NULL OR p_user_lng IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    gc.id,
    gc.name,
    gc.country,
    COALESCE(gc.region, gc.sub_country),
    gc.thumbnail_image,
    cra.avg_overall_score,
    cra.review_count::int,
    gc.global_rank,
    ROUND((extensions.ST_DistanceSphere(
      extensions.ST_MakePoint(gc.longitude::float, gc.latitude::float),
      extensions.ST_MakePoint(p_user_lng, p_user_lat)
    ) / 1000)::numeric, 1) AS distance_km
  FROM golf_courses gc
  LEFT JOIN course_rating_aggregates cra ON cra.course_id = gc.id
  WHERE gc.latitude IS NOT NULL
    AND gc.longitude IS NOT NULL
    AND COALESCE(cra.review_count, 0) >= 1
    AND extensions.ST_DistanceSphere(
      extensions.ST_MakePoint(gc.longitude::float, gc.latitude::float),
      extensions.ST_MakePoint(p_user_lng, p_user_lat)
    ) / 1000 <= p_radius_km
  ORDER BY distance_km ASC, cra.avg_overall_score DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_nearby_courses(float, float, int, int) TO authenticated;

-- =========================================================================
-- 4. get_user_passport
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_user_passport(
  p_user_id uuid,
  p_year int DEFAULT EXTRACT(YEAR FROM now())::int
)
RETURNS TABLE (
  courses_played int,
  countries_played int,
  avg_rating_given numeric,
  reviews_written int,
  top_100_played int,
  wishlist_count int,
  friends_courses_to_try int
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_played_courses uuid[];
BEGIN
  -- Collect all played course ids for the user this year
  SELECT COALESCE(ARRAY_AGG(DISTINCT uca.course_id), ARRAY[]::uuid[])
    INTO v_played_courses
  FROM user_course_activity uca
  WHERE uca.user_id = p_user_id
    AND uca.has_played = true
    AND EXTRACT(YEAR FROM uca.played_at) = p_year;

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
  friends AS (
    SELECT uf.friend_id AS fid FROM user_friends uf
    WHERE uf.user_id = p_user_id AND uf.status = 'accepted'
    UNION
    SELECT uf2.user_id FROM user_friends uf2
    WHERE uf2.friend_id = p_user_id AND uf2.status = 'accepted'
    UNION
    SELECT ufl.following_id FROM user_follows ufl
    WHERE ufl.follower_id = p_user_id
  ),
  friend_played AS (
    SELECT DISTINCT uca.course_id AS cid
    FROM user_course_activity uca
    WHERE uca.user_id IN (SELECT fid FROM friends)
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
$$;

GRANT EXECUTE ON FUNCTION public.get_user_passport(uuid, int) TO authenticated;

-- =========================================================================
-- 5. get_global_course_videos
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_global_course_videos(
  p_user_id uuid,
  p_limit int DEFAULT 12,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  post_id uuid,
  media_id uuid,
  course_id uuid,
  course_name text,
  poster_url text,
  hls_url text,
  duration_ms int,
  creator_name text,
  creator_avatar_url text,
  like_count int,
  created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH watched AS (
    SELECT DISTINCT ucp.post_id
    FROM user_content_preferences ucp
    WHERE ucp.user_id = p_user_id
      AND ucp.signal_type IN ('watched_partial','watched_complete')
      AND ucp.post_id IS NOT NULL
  ),
  resolved AS (
    SELECT
      p.id AS pid,
      pm.id AS mid,
      COALESCE(p.course_id, pc.course_id) AS cid,
      pm.poster_url,
      pm.hls_url,
      pm.duration_ms,
      p.user_id AS creator_uid,
      p.like_count,
      p.created_at
    FROM posts p
    JOIN post_media pm ON pm.post_id = p.id AND pm.media_type = 'video'
    LEFT JOIN LATERAL (
      SELECT pc.course_id FROM post_courses pc
      WHERE pc.post_id = p.id ORDER BY pc.display_order ASC LIMIT 1
    ) pc ON true
    WHERE p.status = 'published'
      AND COALESCE(p.course_id, pc.course_id) IS NOT NULL
      AND p.id NOT IN (SELECT post_id FROM watched)
  )
  SELECT
    r.pid,
    r.mid,
    r.cid,
    gc.name,
    r.poster_url,
    r.hls_url,
    r.duration_ms::int,
    up.display_name,
    up.profile_photo_url,
    COALESCE(r.like_count, 0),
    r.created_at
  FROM resolved r
  JOIN golf_courses gc ON gc.id = r.cid
  LEFT JOIN user_profiles up ON up.id = r.creator_uid
  ORDER BY (COALESCE(r.like_count,0) * 2 + GREATEST(0, 30 - EXTRACT(DAY FROM (now() - r.created_at))::int)) DESC,
           r.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_course_videos(uuid, int, int) TO authenticated;

-- =========================================================================
-- 6. get_explore_hero
-- =========================================================================
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
  context_stats jsonb
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_played uuid[];
  v_wishlisted uuid[];
  v_top_style text;
  v_similar_course text;
BEGIN
  SELECT COALESCE(ARRAY_AGG(course_id), ARRAY[]::uuid[]) INTO v_played
  FROM user_course_activity WHERE user_id = p_user_id AND has_played = true;

  SELECT COALESCE(ARRAY_AGG(course_id), ARRAY[]::uuid[]) INTO v_wishlisted
  FROM course_shortlists WHERE user_id = p_user_id AND list_key = 'want_to_play';

  IF p_mood = 'foryou' THEN
    -- Find user's most-played course_type
    SELECT gc.course_type::text INTO v_top_style
    FROM user_course_activity uca
    JOIN golf_courses gc ON gc.id = uca.course_id
    WHERE uca.user_id = p_user_id AND uca.has_played = true AND gc.course_type IS NOT NULL
    GROUP BY gc.course_type ORDER BY COUNT(*) DESC LIMIT 1;

    -- Top-rated user-rated course as the "similar to"
    SELECT gc.name INTO v_similar_course
    FROM course_ratings cr JOIN golf_courses gc ON gc.id = cr.course_id
    WHERE cr.user_id = p_user_id AND cr.rating IS NOT NULL
    ORDER BY cr.rating DESC NULLS LAST LIMIT 1;

    RETURN QUERY
    SELECT
      gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
      gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
      mb.blurb,
      jsonb_build_object('similar_to', v_similar_course, 'style', v_top_style)
    FROM golf_courses gc
    JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'foryou'
       AND (mb.user_id = p_user_id OR (mb.user_id IS NULL AND v_top_style IS NULL))
       AND mb.expires_at > now()
    WHERE cra.avg_overall_score >= 4.0
      AND gc.id <> ALL(v_played)
      AND (v_top_style IS NULL OR gc.course_type::text = v_top_style)
    ORDER BY cra.avg_overall_score DESC NULLS LAST, cra.review_count DESC
    LIMIT 1;

  ELSIF p_mood = 'weekend' THEN
    -- Without lat/lng we fall back to top-rated UK course
    RETURN QUERY
    SELECT
      gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
      gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
      mb.blurb,
      jsonb_build_object('fallback', true, 'note', 'Geolocation not provided server-side')
    FROM golf_courses gc
    JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'weekend'
       AND mb.user_id IS NULL AND mb.expires_at > now()
    WHERE gc.id <> ALL(v_played)
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
      )
    FROM friend_recs fr
    JOIN golf_courses gc ON gc.id = fr.course_id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = fr.course_id AND mb.mood = 'friends'
       AND (mb.user_id = p_user_id OR mb.user_id IS NULL) AND mb.expires_at > now();

  ELSIF p_mood = 'hidden' THEN
    RETURN QUERY
    SELECT
      gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
      gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
      mb.blurb,
      jsonb_build_object('review_count', cra.review_count, 'avg_rating', cra.avg_overall_score)
    FROM golf_courses gc
    JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'hidden'
       AND mb.user_id IS NULL AND mb.expires_at > now()
    WHERE cra.avg_overall_score >= 4.0
      AND cra.review_count BETWEEN 3 AND 24
      AND (gc.global_rank IS NULL OR gc.global_rank > 200)
      AND gc.id <> ALL(v_played)
      AND gc.id <> ALL(v_wishlisted)
    ORDER BY cra.avg_overall_score DESC, cra.review_count DESC
    LIMIT 1;

  ELSIF p_mood = 'bucket' THEN
    RETURN QUERY
    WITH wish_counts AS (
      SELECT cs.course_id, COUNT(*)::int AS cnt
      FROM course_shortlists cs
      WHERE cs.list_key = 'want_to_play'
      GROUP BY cs.course_id
    )
    SELECT
      gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
      gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
      mb.blurb,
      jsonb_build_object('wishlist_count_in_network', wc.cnt)
    FROM wish_counts wc
    JOIN golf_courses gc ON gc.id = wc.course_id
    LEFT JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'bucket'
       AND mb.user_id IS NULL AND mb.expires_at > now()
    WHERE gc.id <> ALL(v_wishlisted)
      AND gc.id <> ALL(v_played)
    ORDER BY wc.cnt DESC
    LIMIT 1;
  END IF;

  -- Fallback: if no row returned, give global top-rated unplayed course
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
      gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
      NULL::text,
      jsonb_build_object('fallback', true)
    FROM golf_courses gc
    JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    WHERE gc.id <> ALL(v_played)
    ORDER BY cra.avg_overall_score DESC NULLS LAST, cra.review_count DESC
    LIMIT 1;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_explore_hero(uuid, text) TO authenticated;

-- =========================================================================
-- 7. get_explore_recommendations
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_explore_recommendations(
  p_user_id uuid,
  p_mood text,
  p_limit int DEFAULT 2
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
  match_label text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_played uuid[];
  v_wishlisted uuid[];
  v_top_style text;
  v_hero_id uuid;
BEGIN
  -- Get the hero pick to exclude it
  SELECT h.course_id INTO v_hero_id FROM get_explore_hero(p_user_id, p_mood) h LIMIT 1;

  SELECT COALESCE(ARRAY_AGG(course_id), ARRAY[]::uuid[]) INTO v_played
  FROM user_course_activity WHERE user_id = p_user_id AND has_played = true;

  SELECT COALESCE(ARRAY_AGG(course_id), ARRAY[]::uuid[]) INTO v_wishlisted
  FROM course_shortlists WHERE user_id = p_user_id AND list_key = 'want_to_play';

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
           ELSE 'Top rated' END
    FROM golf_courses gc
    JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'foryou'
       AND (mb.user_id = p_user_id OR mb.user_id IS NULL) AND mb.expires_at > now()
    WHERE cra.avg_overall_score >= 4.0
      AND gc.id <> ALL(v_played)
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
      'Saturday AM'::text
    FROM golf_courses gc
    JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'weekend'
       AND mb.user_id IS NULL AND mb.expires_at > now()
    WHERE gc.id <> ALL(v_played)
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
      (fr.friend_played_count || ' friend' || CASE WHEN fr.friend_played_count = 1 THEN '' ELSE 's' END || ' played')::text
    FROM friend_recs fr
    JOIN golf_courses gc ON gc.id = fr.course_id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = fr.course_id AND mb.mood = 'friends'
       AND (mb.user_id = p_user_id OR mb.user_id IS NULL) AND mb.expires_at > now()
    WHERE (v_hero_id IS NULL OR fr.course_id <> v_hero_id)
    LIMIT p_limit;

  ELSIF p_mood = 'hidden' THEN
    RETURN QUERY
    SELECT
      gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
      gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
      mb.blurb,
      jsonb_build_object('review_count', cra.review_count, 'avg_rating', cra.avg_overall_score),
      'Hidden gem'::text
    FROM golf_courses gc
    JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'hidden'
       AND mb.user_id IS NULL AND mb.expires_at > now()
    WHERE cra.avg_overall_score >= 4.0
      AND cra.review_count BETWEEN 3 AND 24
      AND (gc.global_rank IS NULL OR gc.global_rank > 200)
      AND gc.id <> ALL(v_played)
      AND gc.id <> ALL(v_wishlisted)
      AND (v_hero_id IS NULL OR gc.id <> v_hero_id)
    ORDER BY cra.avg_overall_score DESC, cra.review_count DESC
    LIMIT p_limit;

  ELSIF p_mood = 'bucket' THEN
    RETURN QUERY
    WITH wish_counts AS (
      SELECT cs.course_id, COUNT(*)::int AS cnt
      FROM course_shortlists cs
      WHERE cs.list_key = 'want_to_play'
      GROUP BY cs.course_id
    )
    SELECT
      gc.id, gc.name, gc.country, COALESCE(gc.region, gc.sub_country),
      gc.thumbnail_image, cra.avg_overall_score, cra.review_count::int, gc.global_rank,
      mb.blurb,
      jsonb_build_object('wishlist_count_in_network', wc.cnt),
      ('Wishlisted by ' || wc.cnt)::text
    FROM wish_counts wc
    JOIN golf_courses gc ON gc.id = wc.course_id
    LEFT JOIN course_rating_aggregates cra ON cra.course_id = gc.id
    LEFT JOIN course_mood_blurbs mb ON mb.course_id = gc.id AND mb.mood = 'bucket'
       AND mb.user_id IS NULL AND mb.expires_at > now()
    WHERE gc.id <> ALL(v_wishlisted)
      AND gc.id <> ALL(v_played)
      AND (v_hero_id IS NULL OR gc.id <> v_hero_id)
    ORDER BY wc.cnt DESC
    LIMIT p_limit;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_explore_recommendations(uuid, text, int) TO authenticated;
