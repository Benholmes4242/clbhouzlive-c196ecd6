-- Update RLS policy to allow public viewing of posts for explore feed
-- First drop the restrictive policy
DROP POLICY IF EXISTS "Users can view posts from followed users and their own posts" ON public.posts;

-- Create new policies for different use cases
-- Policy for explore feed - anyone can view posts with media
CREATE POLICY "Anyone can view posts with media for explore" 
ON public.posts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.post_media 
    WHERE post_media.post_id = posts.id
  )
);

-- Policy for personal feed - users can view posts from followed users and their own posts
CREATE POLICY "Users can view followed and own posts for personal feed" 
ON public.posts 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1
    FROM user_follows
    WHERE user_follows.follower_id = auth.uid() 
    AND user_follows.following_id = posts.user_id
  ))
);

-- Keep existing policies for CUD operations
-- Users can create their own posts (already exists)
-- Users can update their own posts (already exists) 
-- Users can delete their own posts (already exists)