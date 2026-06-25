CREATE OR REPLACE FUNCTION public.get_suggested_dm_users(p_limit integer DEFAULT 6)
 RETURNS TABLE(id uuid, username text, display_name text, profile_photo_url text, eg_handicap_index double precision, home_club text, reason text, reason_detail text, tier integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_my_home_club TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT up.home_club
    INTO v_my_home_club
  FROM public.user_profiles up
  WHERE up.id = v_user_id;

  RETURN QUERY
  WITH
  blocked AS (
    SELECT ub.blocked_id AS other_id
    FROM public.user_blocks ub
    WHERE ub.blocker_id = v_user_id
    UNION
    SELECT ub.blocker_id AS other_id
    FROM public.user_blocks ub
    WHERE ub.blocked_id = v_user_id
    UNION
    SELECT CASE WHEN uf.user_id = v_user_id THEN uf.friend_id ELSE uf.user_id END AS other_id
    FROM public.user_friends uf
    WHERE (uf.user_id = v_user_id OR uf.friend_id = v_user_id)
      AND uf.status = 'blocked'
  ),
  existing_dms AS (
    SELECT cp_other.user_id AS other_id
    FROM public.conversation_participants cp_self
    JOIN public.conversations c
      ON c.id = cp_self.conversation_id
    JOIN public.conversation_participants cp_other
      ON cp_other.conversation_id = cp_self.conversation_id
     AND cp_other.user_id <> v_user_id
    WHERE cp_self.user_id = v_user_id
      AND c.type = 'direct'
  ),
  excluded AS (
    SELECT v_user_id AS other_id
    UNION SELECT other_id FROM blocked
    UNION SELECT other_id FROM existing_dms
  ),
  tier1_friends AS (
    SELECT
      CASE WHEN uf.user_id = v_user_id THEN uf.friend_id ELSE uf.user_id END AS other_id,
      'friend'::TEXT AS reason,
      NULL::TEXT     AS reason_detail,
      1              AS tier
    FROM public.user_friends uf
    WHERE (uf.user_id = v_user_id OR uf.friend_id = v_user_id)
      AND uf.status = 'accepted'
  ),
  tier2_following AS (
    SELECT
      uf.following_id AS other_id,
      'following'::TEXT AS reason,
      NULL::TEXT        AS reason_detail,
      2                 AS tier
    FROM public.user_follows uf
    WHERE uf.follower_id = v_user_id
  ),
  tier3_home_club AS (
    SELECT
      up.id AS other_id,
      'home_club'::TEXT AS reason,
      up.home_club      AS reason_detail,
      3                 AS tier
    FROM public.user_profiles up
    WHERE v_my_home_club IS NOT NULL
      AND up.home_club = v_my_home_club
      AND up.id <> v_user_id
  ),
  all_suggestions AS (
    SELECT * FROM tier1_friends
    UNION ALL SELECT * FROM tier2_following
    UNION ALL SELECT * FROM tier3_home_club
  ),
  ranked AS (
    SELECT DISTINCT ON (s.other_id)
      s.other_id, s.reason, s.reason_detail, s.tier
    FROM all_suggestions s
    WHERE s.other_id NOT IN (SELECT other_id FROM excluded)
    ORDER BY s.other_id, s.tier ASC
  )
  SELECT
    up.id,
    up.username,
    up.display_name,
    up.profile_photo_url,
    CASE WHEN public.can_view_handicap(v_user_id, up.id)
         THEN up.eg_handicap_index
         ELSE NULL
    END AS eg_handicap_index,
    up.home_club,
    r.reason,
    r.reason_detail,
    r.tier
  FROM ranked r
  JOIN public.user_profiles up ON up.id = r.other_id
  ORDER BY r.tier ASC, up.display_name ASC NULLS LAST
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 6), 24));
END;
$function$;