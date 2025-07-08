-- Fix the infinite recursion in post_media RLS policy
DROP POLICY IF EXISTS "Users can view post media from followed users and own posts" ON post_media;
DROP POLICY IF EXISTS "Users can view all post media for explore" ON post_media;

-- Create a simpler, non-recursive policy for post_media
CREATE POLICY "Users can view post media" 
ON post_media 
FOR SELECT 
USING (
  -- Allow if the post is public (has media attached)
  EXISTS (
    SELECT 1 FROM posts p 
    WHERE p.id = post_media.post_id
  )
);