-- get_activity_feed: adds the 'crowns' (game-family) filter and excludes the
-- game family from every other filter, including the default (all).
--
-- Game family = the notification types the gam-evaluator produces. They now get
-- an Activity row alongside the gam_notification_outbox delivery row, so the
-- feed needs a dedicated home for them.
--
-- KEEP IN LOCKSTEP WITH public.get_unread_notification_count for every
-- predicate EXCEPT the game-family split: game rows deliberately DO count
-- toward the bell badge (genuinely new information) while being scoped out of
-- the all/new lists.

CREATE OR REPLACE FUNCTION public.get_activity_feed(
  p_user_id uuid,
  p_actor_type text DEFAULT 'personal'::text,
  p_actor_id uuid DEFAULT NULL::uuid,
  p_filter text DEFAULT NULL::text,
  p_page_size integer DEFAULT 30,
  p_cursor timestamp with time zone DEFAULT NULL::timestamp with time zone
)
 RETURNS TABLE(notif_id uuid, notif_type text, entity_type text, entity_id uuid, title text, message text, data jsonb, is_read boolean, created_at timestamp with time zone, actor_user_id uuid, actor_username text, actor_display_name text, actor_avatar_url text, target_poster_url text, target_course_name text, target_course_image text, target_review_rating numeric, liker_avatar_urls jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_actor_id uuid := COALESCE(p_actor_id, p_user_id);
  -- Game family. MUST match GAME_NOTIF_TYPES in
  -- src/features/activity-v2/components/ledgerKinds.tsx and the copy map in
  -- supabase/functions/gam-evaluator/index.ts.
  v_game_types text[] := ARRAY[
    'level_up','level_near',
    'legend_earned','legend_lost',
    'crown_taken','crown_lost',
    'streak_at_risk','streak_broken','streak_freeze_applied',
    'status_at_risk','status_reclaimed',
    'rival_played'
  ];
BEGIN
  RETURN QUERY
  WITH my_friends AS (
    SELECT friend_id AS uid FROM user_friends WHERE user_id = p_user_id AND status = 'accepted'
    UNION
    SELECT user_id AS uid FROM user_friends WHERE friend_id = p_user_id AND status = 'accepted'
  ),
  prefs AS (
    SELECT muted_types, muted_user_ids FROM notification_preferences WHERE user_id = p_user_id LIMIT 1
  )
  SELECT
    n.id, n.type, n.entity_type, n.entity_id,
    n.title, n.message, n.data, n.is_read, n.created_at,
    n.actor_id,
    up.username, up.display_name, up.profile_photo_url,
    ppm.poster_url,
    gc.name, gc.thumbnail_image, cr.rating,
    la.avatars
  FROM notifications n
  LEFT JOIN user_profiles up ON up.id = n.actor_id
  LEFT JOIN prefs pf ON TRUE
  LEFT JOIN course_ratings cr
    ON n.entity_type = 'course_rating' AND cr.id = n.entity_id
  LEFT JOIN golf_courses gc ON gc.id = cr.course_id
  LEFT JOIN LATERAL (
    SELECT pm.poster_url
    FROM post_media pm
    WHERE n.entity_type = 'post' AND pm.post_id = n.entity_id
    ORDER BY pm.display_order ASC
    LIMIT 1
  ) ppm ON TRUE
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(pp.profile_photo_url) AS avatars
    FROM (
      SELECT jsonb_array_elements_text(n.data->'recent_liker_ids') AS lid
      LIMIT 3
    ) ids
    JOIN user_profiles pp ON pp.id::text = ids.lid
    WHERE n.type = 'like'
  ) la ON TRUE
  WHERE n.recipient_actor_type = COALESCE(p_actor_type, 'personal')
    AND n.recipient_actor_id = v_actor_id
    AND n.is_deleted = false
    AND n.type <> 'friend_request'
    AND (p_cursor IS NULL OR n.created_at < p_cursor)
    AND (pf.muted_types IS NULL OR NOT (n.type = ANY(pf.muted_types)))
    AND (pf.muted_user_ids IS NULL OR n.actor_id IS NULL OR NOT (n.actor_id = ANY(pf.muted_user_ids)))
    -- existence filtering: comments_v2 + course_ratings are HARD-deleted
    -- (receipted from generated types), so bare EXISTS is the liveness check;
    -- posts are soft-deleted via status.
    AND (
      CASE n.entity_type
        WHEN 'post' THEN EXISTS (
          SELECT 1 FROM posts p WHERE p.id = n.entity_id AND p.status = 'published'
        )
        WHEN 'comment' THEN EXISTS (
          SELECT 1 FROM comments_v2 c WHERE c.id = n.entity_id
        )
        WHEN 'course_rating' THEN EXISTS (
          SELECT 1 FROM course_ratings cr2 WHERE cr2.id = n.entity_id
        )
        ELSE TRUE
      END
    )
    -- Game-family split: 'crowns' shows ONLY game rows; every other filter
    -- (including the default NULL/'all') shows only non-game rows.
    AND (
      CASE WHEN p_filter = 'crowns'
        THEN n.type = ANY(v_game_types)
        ELSE NOT (n.type = ANY(v_game_types))
      END
    )
    AND (
      p_filter IS NULL OR p_filter = 'all' OR p_filter = 'crowns'
      OR (p_filter = 'new' AND n.is_read = false)
      OR (p_filter = 'mentions' AND n.type IN ('mention', 'comment_mention'))
      OR (p_filter = 'friends' AND n.actor_id IN (SELECT uid FROM my_friends))
    )
  ORDER BY n.created_at DESC
  LIMIT p_page_size;
END;
$function$;