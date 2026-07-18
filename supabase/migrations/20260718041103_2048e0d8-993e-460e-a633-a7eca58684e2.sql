
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(
  p_user_id uuid,
  p_actor_type text DEFAULT 'personal',
  p_actor_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
-- KEEP IN LOCKSTEP WITH public.get_activity_feed:
-- predicate set (recipient_actor scoping, is_deleted=false,
-- type <> 'friend_request', muted_types/muted_user_ids, entity liveness)
-- MUST match the feed's WHERE clause. If you change one, change both.
DECLARE
  v_actor_id uuid := COALESCE(p_actor_id, p_user_id);
  v_count integer;
BEGIN
  WITH prefs AS (
    SELECT muted_types, muted_user_ids
    FROM notification_preferences
    WHERE user_id = p_user_id
    LIMIT 1
  )
  SELECT COUNT(*)::int INTO v_count
  FROM notifications n
  LEFT JOIN prefs pf ON TRUE
  WHERE n.recipient_actor_type = COALESCE(p_actor_type, 'personal')
    AND n.recipient_actor_id = v_actor_id
    AND n.is_deleted = false
    AND n.is_read = false
    AND n.type <> 'friend_request'
    AND n.type NOT IN ('message','message_received','dm')
    AND (pf.muted_types IS NULL OR NOT (n.type = ANY(pf.muted_types)))
    AND (pf.muted_user_ids IS NULL OR n.actor_id IS NULL OR NOT (n.actor_id = ANY(pf.muted_user_ids)))
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
    );

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_notification_count(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count(uuid, text, uuid) TO service_role;
