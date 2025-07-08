-- Remove all problematic post_media policies that are causing infinite recursion
DROP POLICY IF EXISTS "Users can view post media from followed users and own posts" ON post_media;
DROP POLICY IF EXISTS "Users can view all post media for explore" ON post_media;
DROP POLICY IF EXISTS "Users can view post media" ON post_media;
DROP POLICY IF EXISTS "Users can view media from followed users posts and their own po" ON post_media;

-- Create a simple, working policy that allows everyone to view post media
CREATE POLICY "Everyone can view post media" 
ON post_media 
FOR SELECT 
USING (true);

-- Also ensure posts table has the right policies without recursion
DROP POLICY IF EXISTS "Users can view followed and own posts for personal feed" ON posts;
DROP POLICY IF EXISTS "Anyone can view posts with media for explore" ON posts;

-- Create simple working policies for posts
CREATE POLICY "Users can view their own posts" 
ON posts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view posts from followed users" 
ON posts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_follows 
    WHERE follower_id = auth.uid() AND following_id = posts.user_id
  )
);

CREATE POLICY "Anyone can view posts with media for explore" 
ON posts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM post_media 
    WHERE post_id = posts.id
  )
);