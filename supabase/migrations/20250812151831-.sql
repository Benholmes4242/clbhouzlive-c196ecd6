-- Fix post_media RLS policies to allow proper inserts during background upload

-- Drop existing policies for post_media
DROP POLICY IF EXISTS "Users can create media for their own posts" ON public.post_media;
DROP POLICY IF EXISTS "Users can view media from their own posts" ON public.post_media;
DROP POLICY IF EXISTS "Users can view media from followed users" ON public.post_media;
DROP POLICY IF EXISTS "Authenticated users can view media from public profiles" ON public.post_media;
DROP POLICY IF EXISTS "Users can update media for their own posts" ON public.post_media;
DROP POLICY IF EXISTS "Users can delete media for their own posts" ON public.post_media;

-- Create new RLS policies for post_media that work with background uploads
CREATE POLICY "Users can create media for their posts" 
ON public.post_media 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts 
    WHERE posts.id = post_media.post_id 
    AND posts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view media from their own posts" 
ON public.post_media 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM posts 
    WHERE posts.id = post_media.post_id 
    AND posts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view media from followed users posts" 
ON public.post_media 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM posts p
    JOIN user_follows uf ON uf.following_id = p.user_id
    WHERE p.id = post_media.post_id 
    AND uf.follower_id = auth.uid()
  )
);

CREATE POLICY "Users can view media from public profile posts" 
ON public.post_media 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM posts p
    JOIN user_profiles up ON up.id = p.user_id
    WHERE p.id = post_media.post_id 
    AND up.is_public = true
  )
);

CREATE POLICY "Users can update their own post media" 
ON public.post_media 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM posts 
    WHERE posts.id = post_media.post_id 
    AND posts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own post media" 
ON public.post_media 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM posts 
    WHERE posts.id = post_media.post_id 
    AND posts.user_id = auth.uid()
  )
);