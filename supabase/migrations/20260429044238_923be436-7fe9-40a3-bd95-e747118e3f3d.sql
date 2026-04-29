-- =====================================================
-- Fix: post_likes + post_comments SELECT policies
-- =====================================================
-- Context: The Aug 2025 SELECT policies join through posts.user_id
-- (the human operator) only. For business posts, this hides like
-- and comment rows from viewers who follow the business but not the
-- human operator. The parent posts table is publicly readable
-- (`public_read_posts` USING (true)), so engagement tables should
-- mirror that.
--
-- DEPENDENCY NOTE: If `posts` SELECT is ever tightened (e.g. to
-- support private posts), then post_likes and post_comments SELECT
-- must also be tightened in lockstep.
-- =====================================================

-- 1. post_likes — drop old SELECT policy, replace with public read
DROP POLICY IF EXISTS "Users can view likes on accessible posts" ON public.post_likes;
DROP POLICY IF EXISTS "Everyone can view post likes" ON public.post_likes;

CREATE POLICY "public_read_post_likes"
ON public.post_likes
FOR SELECT
TO public
USING (true);

-- 2. post_comments — drop old SELECT policy, replace with public read
DROP POLICY IF EXISTS "Users can view comments on accessible posts" ON public.post_comments;
DROP POLICY IF EXISTS "Everyone can view post comments" ON public.post_comments;

CREATE POLICY "public_read_post_comments"
ON public.post_comments
FOR SELECT
TO public
USING (true);