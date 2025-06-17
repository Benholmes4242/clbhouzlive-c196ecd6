
-- First, let's create follow relationships for all existing accepted friendships
-- This handles cases where users became friends before the auto-follow trigger was implemented
INSERT INTO public.user_follows (follower_id, following_id)
SELECT DISTINCT 
  uf1.user_id as follower_id,
  uf1.friend_id as following_id
FROM public.user_friends uf1
WHERE uf1.status = 'accepted'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_follows uf_check
    WHERE uf_check.follower_id = uf1.user_id 
    AND uf_check.following_id = uf1.friend_id
  );

-- Also create the reverse follow relationships
INSERT INTO public.user_follows (follower_id, following_id)
SELECT DISTINCT 
  uf2.friend_id as follower_id,
  uf2.user_id as following_id
FROM public.user_friends uf2
WHERE uf2.status = 'accepted'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_follows uf_check
    WHERE uf_check.follower_id = uf2.friend_id 
    AND uf_check.following_id = uf2.user_id
  );
