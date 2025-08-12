-- Fix security issue: Remove duplicate policies and implement proper access controls

-- Drop all existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view posts from followed users" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can view posts from public profiles" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view posts tagged with golf courses" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view posts with media for explore" ON public.posts;

DROP POLICY IF EXISTS "Everyone can view post media" ON public.post_media;
DROP POLICY IF EXISTS "Users can view media from their own posts" ON public.post_media;
DROP POLICY IF EXISTS "Users can view media from followed users" ON public.post_media;
DROP POLICY IF EXISTS "Authenticated users can view media from public profiles" ON public.post_media;

DROP POLICY IF EXISTS "Everyone can view post likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can view likes on accessible posts" ON public.post_likes;

DROP POLICY IF EXISTS "Everyone can view post comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can view comments on accessible posts" ON public.post_comments;

DROP POLICY IF EXISTS "Everyone can view post shares" ON public.post_shares;
DROP POLICY IF EXISTS "Users can view shares on accessible posts" ON public.post_shares;

DROP POLICY IF EXISTS "Everyone can view post tags" ON public.post_tags;
DROP POLICY IF EXISTS "Users can view tags on accessible posts" ON public.post_tags;

-- Create secure policies for posts
CREATE POLICY "Users can view their own posts" ON public.posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view posts from followed users" ON public.posts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_follows 
      WHERE follower_id = auth.uid() 
      AND following_id = posts.user_id
    )
  );

CREATE POLICY "Authenticated users can view posts from public profiles" ON public.posts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = posts.user_id 
      AND is_public = true
    )
  );

-- Create secure policies for post_media
CREATE POLICY "Users can view media from their own posts" ON public.post_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_media.post_id 
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view media from followed users" ON public.post_media
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.user_follows uf ON uf.following_id = p.user_id
      WHERE p.id = post_media.post_id 
      AND uf.follower_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can view media from public profiles" ON public.post_media
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.user_profiles up ON up.id = p.user_id
      WHERE p.id = post_media.post_id 
      AND up.is_public = true
    )
  );

-- Create secure policies for post interactions
CREATE POLICY "Users can view likes on accessible posts" ON public.post_likes
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    (
      EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_likes.post_id 
        AND posts.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_follows uf ON uf.following_id = p.user_id
        WHERE p.id = post_likes.post_id 
        AND uf.follower_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_profiles up ON up.id = p.user_id
        WHERE p.id = post_likes.post_id 
        AND up.is_public = true
      )
    )
  );

CREATE POLICY "Users can view comments on accessible posts" ON public.post_comments
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    (
      EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_comments.post_id 
        AND posts.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_follows uf ON uf.following_id = p.user_id
        WHERE p.id = post_comments.post_id 
        AND uf.follower_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_profiles up ON up.id = p.user_id
        WHERE p.id = post_comments.post_id 
        AND up.is_public = true
      )
    )
  );

CREATE POLICY "Users can view shares on accessible posts" ON public.post_shares
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    (
      EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_shares.post_id 
        AND posts.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_follows uf ON uf.following_id = p.user_id
        WHERE p.id = post_shares.post_id 
        AND uf.follower_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_profiles up ON up.id = p.user_id
        WHERE p.id = post_shares.post_id 
        AND up.is_public = true
      )
    )
  );

CREATE POLICY "Users can view tags on accessible posts" ON public.post_tags
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    (
      EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_tags.post_id 
        AND posts.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_follows uf ON uf.following_id = p.user_id
        WHERE p.id = post_tags.post_id 
        AND uf.follower_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_profiles up ON up.id = p.user_id
        WHERE p.id = post_tags.post_id 
        AND up.is_public = true
      )
    )
  );