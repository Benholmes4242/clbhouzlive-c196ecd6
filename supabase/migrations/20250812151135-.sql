-- Fix security issue: Restrict access to posts and media based on privacy settings and relationships

-- First, drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can view posts tagged with golf courses" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view posts with media for explore" ON public.posts;
DROP POLICY IF EXISTS "Everyone can view post media" ON public.post_media;

-- Create more restrictive policies for posts
-- Users can view their own posts
CREATE POLICY "Users can view their own posts" ON public.posts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view posts from users they follow
CREATE POLICY "Users can view posts from followed users" ON public.posts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_follows 
      WHERE follower_id = auth.uid() 
      AND following_id = posts.user_id
    )
  );

-- Users can view posts from public profiles (but only if authenticated)
CREATE POLICY "Authenticated users can view posts from public profiles" ON public.posts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = posts.user_id 
      AND is_public = true
    )
  );

-- Create restrictive policies for post_media
-- Users can view media from their own posts
CREATE POLICY "Users can view media from their own posts" ON public.post_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_media.post_id 
      AND posts.user_id = auth.uid()
    )
  );

-- Users can view media from posts they can access (followed users)
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

-- Users can view media from public profiles (but only if authenticated)
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

-- Update post_likes, post_comments, and post_shares policies to ensure consistency
-- These should only be viewable for posts the user can access

-- Drop and recreate post_likes policies
DROP POLICY IF EXISTS "Everyone can view post likes" ON public.post_likes;

CREATE POLICY "Users can view likes on accessible posts" ON public.post_likes
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    (
      -- Own posts
      EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_likes.post_id 
        AND posts.user_id = auth.uid()
      )
      OR
      -- Posts from followed users
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_follows uf ON uf.following_id = p.user_id
        WHERE p.id = post_likes.post_id 
        AND uf.follower_id = auth.uid()
      )
      OR
      -- Posts from public profiles
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_profiles up ON up.id = p.user_id
        WHERE p.id = post_likes.post_id 
        AND up.is_public = true
      )
    )
  );

-- Drop and recreate post_comments policies  
DROP POLICY IF EXISTS "Everyone can view post comments" ON public.post_comments;

CREATE POLICY "Users can view comments on accessible posts" ON public.post_comments
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    (
      -- Own posts
      EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_comments.post_id 
        AND posts.user_id = auth.uid()
      )
      OR
      -- Posts from followed users
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_follows uf ON uf.following_id = p.user_id
        WHERE p.id = post_comments.post_id 
        AND uf.follower_id = auth.uid()
      )
      OR
      -- Posts from public profiles
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_profiles up ON up.id = p.user_id
        WHERE p.id = post_comments.post_id 
        AND up.is_public = true
      )
    )
  );

-- Drop and recreate post_shares policies
DROP POLICY IF EXISTS "Everyone can view post shares" ON public.post_shares;

CREATE POLICY "Users can view shares on accessible posts" ON public.post_shares
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    (
      -- Own posts
      EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_shares.post_id 
        AND posts.user_id = auth.uid()
      )
      OR
      -- Posts from followed users
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_follows uf ON uf.following_id = p.user_id
        WHERE p.id = post_shares.post_id 
        AND uf.follower_id = auth.uid()
      )
      OR
      -- Posts from public profiles
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_profiles up ON up.id = p.user_id
        WHERE p.id = post_shares.post_id 
        AND up.is_public = true
      )
    )
  );

-- Drop and recreate post_tags policies
DROP POLICY IF EXISTS "Everyone can view post tags" ON public.post_tags;

CREATE POLICY "Users can view tags on accessible posts" ON public.post_tags
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    (
      -- Own posts
      EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_tags.post_id 
        AND posts.user_id = auth.uid()
      )
      OR
      -- Posts from followed users
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_follows uf ON uf.following_id = p.user_id
        WHERE p.id = post_tags.post_id 
        AND uf.follower_id = auth.uid()
      )
      OR
      -- Posts from public profiles
      EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.user_profiles up ON up.id = p.user_id
        WHERE p.id = post_tags.post_id 
        AND up.is_public = true
      )
    )
  );