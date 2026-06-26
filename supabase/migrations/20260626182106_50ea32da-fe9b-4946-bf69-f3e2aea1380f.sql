
-- 1) Per-actor social counts RPC
CREATE OR REPLACE FUNCTION public.get_actor_social_counts(
  p_actor_type text,
  p_actor_id uuid
)
RETURNS TABLE(followers integer, following integer, friends integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*)::int FROM public.follows f
       WHERE f.following_actor_type = p_actor_type
         AND f.following_actor_id   = p_actor_id),
    (SELECT COUNT(*)::int FROM public.follows f
       WHERE f.follower_actor_type = p_actor_type
         AND f.follower_actor_id   = p_actor_id),
    CASE WHEN p_actor_type = 'personal' THEN
      (SELECT COUNT(*)::int FROM public.user_friends uf
         WHERE uf.status = 'accepted'
           AND (uf.user_id = p_actor_id OR uf.friend_id = p_actor_id))
    ELSE 0 END;
$$;

GRANT EXECUTE ON FUNCTION public.get_actor_social_counts(text, uuid)
  TO anon, authenticated, service_role;

-- 2) Drop the unused 4-arg is_following_actor helper if it exists
DROP FUNCTION IF EXISTS public.is_following_actor(uuid, text, uuid, text);

-- 3) Drop the empty deprecated table (confirmed 0 rows)
DROP TABLE IF EXISTS public.business_outbound_follows;
