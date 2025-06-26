
-- Delete all pending friend requests (status = 'pending')
-- This will keep all accepted friendships (status = 'accepted') in place
DELETE FROM public.user_friends 
WHERE status = 'pending';

-- Also clean up any friend request notifications that are no longer relevant
-- since the friend requests they reference will no longer exist
DELETE FROM public.notifications 
WHERE type = 'friend_request' 
AND data->>'friend_request_id' NOT IN (
    SELECT id::text FROM public.user_friends WHERE status = 'pending'
);
