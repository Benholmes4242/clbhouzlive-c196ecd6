CREATE OR REPLACE FUNCTION get_relationship_statuses(
  p_current_user_id uuid,
  p_target_user_ids uuid[]
)
RETURNS TABLE (
  target_user_id uuid,
  is_following boolean,
  is_followed_by boolean,
  friend_status text,
  is_blocked boolean,
  is_blocking boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS target_user_id,

    EXISTS (
      SELECT 1 FROM user_follows uf
      WHERE uf.follower_id = p_current_user_id
        AND uf.following_id = t.id
    ) AS is_following,

    EXISTS (
      SELECT 1 FROM user_follows uf
      WHERE uf.follower_id = t.id
        AND uf.following_id = p_current_user_id
    ) AS is_followed_by,

    CASE
      WHEN EXISTS (
        SELECT 1 FROM user_friends uf
        WHERE uf.status = 'accepted'
          AND (
            (uf.user_id = p_current_user_id AND uf.friend_id = t.id)
            OR (uf.user_id = t.id AND uf.friend_id = p_current_user_id)
          )
      ) THEN 'friends'
      WHEN EXISTS (
        SELECT 1 FROM user_friends uf
        WHERE uf.status = 'pending'
          AND uf.user_id = p_current_user_id
          AND uf.friend_id = t.id
      ) THEN 'pending_sent'
      WHEN EXISTS (
        SELECT 1 FROM user_friends uf
        WHERE uf.status = 'pending'
          AND uf.user_id = t.id
          AND uf.friend_id = p_current_user_id
      ) THEN 'pending_received'
      ELSE 'none'
    END AS friend_status,

    EXISTS (
      SELECT 1 FROM user_blocks ub
      WHERE ub.blocker_id = t.id
        AND ub.blocked_id = p_current_user_id
    ) AS is_blocked,

    EXISTS (
      SELECT 1 FROM user_blocks ub
      WHERE ub.blocker_id = p_current_user_id
        AND ub.blocked_id = t.id
    ) AS is_blocking

  FROM unnest(p_target_user_ids) AS t(id);
END;
$$;

GRANT EXECUTE ON FUNCTION get_relationship_statuses(uuid, uuid[]) TO authenticated;