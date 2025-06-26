
-- First, let's create mutual follow relationships for all existing accepted friendships
-- that don't already have corresponding follow relationships

-- Create follows for user -> friend direction
INSERT INTO public.user_follows (follower_id, following_id)
SELECT DISTINCT uf.user_id, uf.friend_id
FROM public.user_friends uf
WHERE uf.status = 'accepted'
AND NOT EXISTS (
    SELECT 1 FROM public.user_follows ufo
    WHERE ufo.follower_id = uf.user_id 
    AND ufo.following_id = uf.friend_id
);

-- Create follows for friend -> user direction  
INSERT INTO public.user_follows (follower_id, following_id)
SELECT DISTINCT uf.friend_id, uf.user_id
FROM public.user_friends uf
WHERE uf.status = 'accepted'
AND NOT EXISTS (
    SELECT 1 FROM public.user_follows ufo
    WHERE ufo.follower_id = uf.friend_id 
    AND ufo.following_id = uf.user_id
);
