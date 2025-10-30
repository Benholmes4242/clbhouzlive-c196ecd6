-- Add last_seen_at column for fallback analytics
ALTER TABLE public.user_nearby_status
ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Helper view for mutual friends check (if not present)
CREATE OR REPLACE VIEW public.user_friend_pairs AS
SELECT LEAST(a.follower_id, b.follower_id) AS u1,
       GREATEST(a.follower_id, b.follower_id) AS u2
FROM public.user_follows a
JOIN public.user_follows b
  ON a.follower_id = b.following_id
 AND a.following_id = b.follower_id;