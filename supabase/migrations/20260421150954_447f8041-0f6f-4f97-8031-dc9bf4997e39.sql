-- ============================================================
-- Session 3 of Watch tab uplift: personalization + depth
-- ============================================================

-- 1. user_content_preferences ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_content_preferences (
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id              uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  signal_type          text        NOT NULL CHECK (signal_type IN ('saved','dismissed','watched_partial','watched_complete')),
  progress_seconds     integer     DEFAULT NULL,
  total_seconds        integer     DEFAULT NULL,
  last_interaction_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id, signal_type)
);

CREATE INDEX IF NOT EXISTS idx_user_content_preferences_user_last
  ON public.user_content_preferences(user_id, last_interaction_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_content_preferences_user_signal
  ON public.user_content_preferences(user_id, signal_type);

ALTER TABLE public.user_content_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ucp_select_own"
  ON public.user_content_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ucp_insert_own"
  ON public.user_content_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ucp_update_own"
  ON public.user_content_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "ucp_delete_own"
  ON public.user_content_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Mirror `dismissed` rows into the legacy post_dismissals table
--    so existing get_watch_shorts filter keeps working without churn.
CREATE OR REPLACE FUNCTION public.mirror_ucp_dismissal_to_post_dismissals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.signal_type = 'dismissed' THEN
    INSERT INTO public.post_dismissals (user_id, post_id)
    VALUES (NEW.user_id, NEW.post_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mirror_ucp_dismissal ON public.user_content_preferences;
CREATE TRIGGER trg_mirror_ucp_dismissal
AFTER INSERT ON public.user_content_preferences
FOR EACH ROW
EXECUTE FUNCTION public.mirror_ucp_dismissal_to_post_dismissals();

-- Reverse mirror: when a user removes a dismissal, drop the legacy row too.
CREATE OR REPLACE FUNCTION public.remove_post_dismissal_on_ucp_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.signal_type = 'dismissed' THEN
    DELETE FROM public.post_dismissals
    WHERE user_id = OLD.user_id AND post_id = OLD.post_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_remove_post_dismissal_on_ucp_delete ON public.user_content_preferences;
CREATE TRIGGER trg_remove_post_dismissal_on_ucp_delete
AFTER DELETE ON public.user_content_preferences
FOR EACH ROW
EXECUTE FUNCTION public.remove_post_dismissal_on_ucp_delete();

-- 3. user_profiles new columns ───────────────────────────────
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS last_seen_post_id uuid NULL REFERENCES public.posts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS has_seen_watch_longpress_tip boolean NOT NULL DEFAULT false;

-- 4. creator_quality_scores materialized view ────────────────
DROP MATERIALIZED VIEW IF EXISTS public.creator_quality_scores;
CREATE MATERIALIZED VIEW public.creator_quality_scores AS
SELECT
  p.user_id,
  AVG(
    COALESCE(plc.cnt, 0) * 1.0
    + COALESCE(pcc.cnt, 0) * 2.0
  ) / GREATEST(1, COUNT(*)) AS quality_score,
  COUNT(*)::int AS post_count,
  MAX(p.created_at) AS last_post_at
FROM public.posts p
LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM public.post_likes lk WHERE lk.post_id = p.id) plc ON TRUE
LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM public.post_comments cm WHERE cm.post_id = p.id) pcc ON TRUE
WHERE p.created_at > NOW() - INTERVAL '90 days'
  AND p.status = 'published'
GROUP BY p.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_quality_scores_user
  ON public.creator_quality_scores(user_id);

-- Cron: nightly refresh at 03:00 UTC
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Remove any prior schedule before recreating (idempotent).
DO $$
DECLARE jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'refresh_creator_quality';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'refresh_creator_quality',
  '0 3 * * *',
  $cron$REFRESH MATERIALIZED VIEW CONCURRENTLY public.creator_quality_scores;$cron$
);

-- 5. RPC: get_continue_watching ──────────────────────────────
CREATE OR REPLACE FUNCTION public.get_continue_watching(
  p_user_id uuid,
  p_limit   int DEFAULT 10
)
RETURNS TABLE(
  post_id uuid,
  post_content text,
  post_created_at timestamptz,
  post_user_id uuid,
  media_id uuid,
  media_type text,
  media_url text,
  poster_url text,
  stream_id text,
  duration_seconds integer,
  width integer,
  height integer,
  display_order integer,
  creator_username text,
  creator_display_name text,
  creator_avatar_url text,
  creator_is_verified boolean,
  like_count bigint,
  comment_count bigint,
  share_count bigint,
  progress_seconds integer,
  total_seconds integer,
  last_interaction_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.content, p.created_at, p.user_id,
    pm.id, pm.media_type, pm.media_url, pm.poster_url, pm.stream_id,
    pm.duration_seconds, pm.width, pm.height, pm.display_order,
    up.username, up.display_name, up.profile_photo_url,
    COALESCE(up.is_verified, FALSE),
    COALESCE(plc.cnt, 0), COALESCE(pcc.cnt, 0), COALESCE(psc.cnt, 0),
    ucp.progress_seconds, ucp.total_seconds, ucp.last_interaction_at
  FROM public.user_content_preferences ucp
  INNER JOIN public.posts p ON p.id = ucp.post_id AND p.status = 'published'
  INNER JOIN public.post_media pm ON pm.post_id = p.id AND pm.media_type = 'video'
  LEFT JOIN public.user_profiles up ON up.id = p.user_id
  LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM public.post_likes lk WHERE lk.post_id = p.id) plc ON TRUE
  LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM public.post_comments cm WHERE cm.post_id = p.id) pcc ON TRUE
  LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM public.post_shares sh WHERE sh.post_id = p.id) psc ON TRUE
  -- Only show partial watches that aren't dismissed and aren't already complete
  LEFT JOIN public.user_content_preferences dismissed
    ON dismissed.user_id = p_user_id AND dismissed.post_id = p.id AND dismissed.signal_type = 'dismissed'
  LEFT JOIN public.user_content_preferences complete
    ON complete.user_id = p_user_id AND complete.post_id = p.id AND complete.signal_type = 'watched_complete'
  WHERE ucp.user_id = p_user_id
    AND ucp.signal_type = 'watched_partial'
    AND ucp.last_interaction_at > NOW() - INTERVAL '30 days'
    AND ucp.progress_seconds IS NOT NULL
    AND ucp.total_seconds IS NOT NULL
    AND ucp.progress_seconds > 2  -- ignore trivial sub-2s scrubs
    AND ucp.progress_seconds < (ucp.total_seconds - 2)  -- ignore near-complete
    AND dismissed.post_id IS NULL
    AND complete.post_id IS NULL
  ORDER BY ucp.last_interaction_at DESC
  LIMIT p_limit;
END;
$$;

-- 6. Negative personalization + quality — get_watch_shorts ───
CREATE OR REPLACE FUNCTION public.get_watch_shorts(
  p_user_id      uuid,
  p_mode         text DEFAULT 'trending'::text,
  p_page_size    integer DEFAULT 30,
  p_cursor       timestamptz DEFAULT NULL,
  p_seen_ids     uuid[] DEFAULT '{}'::uuid[],
  p_search_query text DEFAULT NULL,
  p_user_lat     double precision DEFAULT NULL,
  p_user_lng     double precision DEFAULT NULL,
  p_category     text DEFAULT NULL
)
RETURNS TABLE(
  post_id uuid, post_content text, post_created_at timestamptz, post_user_id uuid,
  post_actor_type text, post_actor_id uuid, post_status text, source_review_id uuid,
  media_id uuid, media_type text, media_url text, poster_url text, stream_id text,
  duration_seconds integer, width integer, height integer, display_order integer,
  creator_username text, creator_display_name text, creator_avatar_url text,
  creator_is_verified boolean, business_name text, business_logo_url text,
  business_is_verified boolean, like_count bigint, comment_count bigint, share_count bigint,
  review_rating numeric, review_course_id uuid, review_course_name text,
  review_course_image text, course_region text, course_country text,
  creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean,
  engagement_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_duration INT := 180;
BEGIN
  RETURN QUERY
  WITH
  blocked_users AS (
    SELECT blocked_id AS uid FROM user_blocks WHERE blocker_id = p_user_id
    UNION SELECT blocker_id AS uid FROM user_blocks WHERE blocked_id = p_user_id
  ),
  dismissed AS (
    SELECT pd.post_id AS pid FROM post_dismissals pd WHERE pd.user_id = p_user_id
  ),
  -- Per-creator dismissal counts → soft creator deprio.
  creator_dismissals AS (
    SELECT p2.user_id AS creator_uid, COUNT(*)::int AS dismiss_count
    FROM post_dismissals pd
    INNER JOIN posts p2 ON p2.id = pd.post_id
    WHERE pd.user_id = p_user_id
    GROUP BY p2.user_id
  ),
  my_follows AS (
    SELECT following_id AS uid FROM user_follows WHERE follower_id = p_user_id
  ),
  my_friends AS (
    SELECT friend_id AS uid FROM user_friends WHERE user_id = p_user_id AND status = 'accepted'
    UNION SELECT user_id AS uid FROM user_friends WHERE friend_id = p_user_id AND status = 'accepted'
  ),
  my_business_follows AS (
    SELECT business_id AS bid FROM business_follows WHERE follower_id = p_user_id
  ),
  candidates AS (
    SELECT
      p.id AS p_id, p.content AS p_content, p.created_at AS p_created_at,
      p.user_id AS p_user_id, p.actor_type AS p_actor_type, p.actor_id AS p_actor_id,
      p.status AS p_status, p.source_review_id AS p_source_review_id,
      pm.id AS pm_id, pm.media_type AS pm_media_type, pm.media_url AS pm_media_url,
      pm.poster_url AS pm_poster_url, pm.stream_id AS pm_stream_id,
      pm.duration_seconds AS pm_duration, pm.width AS pm_width, pm.height AS pm_height,
      pm.display_order AS pm_display_order,
      COALESCE(plc.cnt, 0) AS p_like_count,
      COALESCE(pcc.cnt, 0) AS p_comment_count,
      COALESCE(psc.cnt, 0) AS p_share_count,
      cr.rating AS p_review_rating, gc.id AS p_review_course_id,
      gc.name AS p_review_course_name, gc.thumbnail_image AS p_review_course_image,
      gc.region AS p_course_region, gc.country AS p_course_country,
      up.username AS p_creator_username, up.display_name AS p_creator_display_name,
      up.profile_photo_url AS p_creator_avatar,
      COALESCE(up.is_verified, FALSE) AS p_creator_verified,
      ba.name AS p_business_name, ba.logo_url AS p_business_logo,
      COALESCE(ba.is_verified, FALSE) AS p_business_verified,
      CASE
        WHEN mfr.uid IS NOT NULL THEN 'friend'
        WHEN mfl.uid IS NOT NULL THEN 'following'
        WHEN mbf.bid IS NOT NULL AND p.actor_type = 'business' THEN 'following'
        ELSE 'none'
      END AS p_relation,
      CASE WHEN ml.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS p_liked_by_me,
      CASE
        WHEN mfl.uid IS NOT NULL THEN TRUE
        WHEN mbf.bid IS NOT NULL AND p.actor_type = 'business' THEN TRUE
        ELSE FALSE
      END AS p_followed_by_me,
      GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600, 0.1) AS hours_old,
      -- Soft creator deprio: 3+ dismissals → 0.4×, 2 → 0.7×, else 1.0×
      CASE
        WHEN COALESCE(cd.dismiss_count, 0) >= 3 THEN 0.40
        WHEN COALESCE(cd.dismiss_count, 0) = 2  THEN 0.70
        ELSE 1.00
      END AS creator_deprio,
      -- Modest creator-quality multiplier in 0.85..1.15 range; weight 0.10.
      (1.0 + 0.10 * (LEAST(GREATEST(COALESCE(cqs.quality_score, 0), 0), 50) / 50.0 - 0.5)) AS creator_quality_factor
    FROM posts p
    INNER JOIN post_media pm ON pm.post_id = p.id
    LEFT JOIN user_profiles up ON up.id = p.user_id
    LEFT JOIN business_accounts ba ON ba.id = p.actor_id AND p.actor_type = 'business'
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes lk WHERE lk.post_id = p.id) plc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_comments cm WHERE cm.post_id = p.id) pcc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_shares sh WHERE sh.post_id = p.id) psc ON TRUE
    LEFT JOIN my_friends mfr ON mfr.uid = p.user_id
    LEFT JOIN my_follows mfl ON mfl.uid = p.user_id
    LEFT JOIN my_business_follows mbf ON mbf.bid = p.actor_id AND p.actor_type = 'business'
    LEFT JOIN blocked_users bu ON bu.uid = p.user_id
    LEFT JOIN dismissed d ON d.pid = p.id
    LEFT JOIN post_likes ml ON ml.post_id = p.id AND ml.user_id = p_user_id
    LEFT JOIN course_ratings cr ON cr.id = p.source_review_id
    LEFT JOIN golf_courses gc ON gc.id = COALESCE(cr.course_id, p.course_id)
    LEFT JOIN creator_dismissals cd ON cd.creator_uid = p.user_id
    LEFT JOIN creator_quality_scores cqs ON cqs.user_id = p.user_id
    WHERE p.status = 'published'
      AND bu.uid IS NULL
      AND d.pid IS NULL
      AND pm.media_type = 'video'
      AND pm.duration_seconds IS NOT NULL
      AND pm.duration_seconds <= v_max_duration
      AND (p_cursor IS NULL OR p.created_at < p_cursor)
      AND NOT (p.id = ANY(p_seen_ids))
      AND (
        p_search_query IS NULL
        OR p.content ILIKE '%' || p_search_query || '%'
        OR gc.name ILIKE '%' || p_search_query || '%'
        OR up.display_name ILIKE '%' || p_search_query || '%'
        OR up.username ILIKE '%' || p_search_query || '%'
      )
      AND p.created_at > NOW() - INTERVAL '365 days'
      AND (
        p_mode != 'near'
        OR (
          p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL
          AND gc.latitude IS NOT NULL AND gc.longitude IS NOT NULL
          AND gc.latitude BETWEEN (p_user_lat - 0.45) AND (p_user_lat + 0.45)
          AND gc.longitude BETWEEN (p_user_lng - 0.6) AND (p_user_lng + 0.6)
        )
      )
      AND (p_category IS NULL OR p.post_categories @> ARRAY[p_category])
    ORDER BY p.created_at DESC
    LIMIT p_page_size * 3
  ),
  scored AS (
    SELECT c.*,
      CASE
        WHEN c.pm_duration BETWEEN 8 AND 180 THEN 1.00
        WHEN c.pm_duration BETWEEN 4 AND 7   THEN 0.50
        WHEN c.pm_duration BETWEEN 181 AND 300 THEN 0.50
        WHEN c.pm_duration < 4                THEN 0.20
        ELSE 0.20
      END AS duration_quality,
      CASE p_mode
        WHEN 'trending' THEN
          ((c.p_like_count * 1.0 + c.p_comment_count * 2.5 + c.p_share_count * 3.0) / c.hours_old)
          * CASE WHEN c.hours_old < 6 THEN 2.0 * (1.0 - c.hours_old / 6.0) ELSE 1.0 END
        WHEN 'latest' THEN EXTRACT(EPOCH FROM c.p_created_at)
        WHEN 'top' THEN
          (c.p_like_count * 1.0 + c.p_comment_count * 2.5 + c.p_share_count * 3.0)
          * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - c.p_created_at)) / 86400 / 30)
        WHEN 'near' THEN EXTRACT(EPOCH FROM c.p_created_at)
        ELSE 0
      END AS base_score
    FROM candidates c
  ),
  scored_final AS (
    SELECT s.*,
      CASE p_mode
        WHEN 'trending' THEN s.base_score * s.duration_quality * s.creator_deprio * s.creator_quality_factor
        WHEN 'top'      THEN s.base_score * s.duration_quality * s.creator_deprio * s.creator_quality_factor
        ELSE s.base_score * s.creator_deprio
      END AS score
    FROM scored s
  ),
  filtered AS (
    SELECT * FROM scored_final
    ORDER BY score DESC
    LIMIT p_page_size
  )
  SELECT
    f.p_id, f.p_content, f.p_created_at, f.p_user_id, f.p_actor_type, f.p_actor_id,
    f.p_status, f.p_source_review_id,
    f.pm_id, f.pm_media_type, f.pm_media_url, f.pm_poster_url, f.pm_stream_id,
    f.pm_duration, f.pm_width, f.pm_height, f.pm_display_order,
    f.p_creator_username, f.p_creator_display_name, f.p_creator_avatar, f.p_creator_verified,
    f.p_business_name, f.p_business_logo, f.p_business_verified,
    f.p_like_count, f.p_comment_count, f.p_share_count,
    f.p_review_rating, f.p_review_course_id, f.p_review_course_name, f.p_review_course_image,
    f.p_course_region, f.p_course_country,
    f.p_relation, f.p_liked_by_me, f.p_followed_by_me,
    f.score
  FROM filtered f
  ORDER BY f.score DESC;
END;
$$;

-- 7. Reset personalization RPC ───────────────────────────────
CREATE OR REPLACE FUNCTION public.reset_watch_personalization(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Cascading delete via trigger handles post_dismissals mirror cleanup
  DELETE FROM public.user_content_preferences WHERE user_id = p_user_id;
END;
$$;

-- Initial population so the MV isn't empty when first queried.
REFRESH MATERIALIZED VIEW public.creator_quality_scores;
