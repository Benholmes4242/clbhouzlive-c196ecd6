-- Phase 2B: Enforce Followers visibility via RLS
-- This creates proper visibility enforcement at the database level

-- Helper function to check if current user can view a post with 'followers' visibility
-- Checks both user follows (personal posts) and business follows (business posts)
CREATE OR REPLACE FUNCTION public.can_view_followers_post(
  p_post_user_id uuid,
  p_actor_type text,
  p_actor_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Post owner can always see their own post
    auth.uid() = p_post_user_id
    OR
    -- Check follow relationship based on actor type
    EXISTS (
      SELECT 1
      FROM (
        -- Personal posts: check user_follows
        SELECT 1
        FROM user_follows uf
        WHERE p_actor_type = 'personal'
          AND uf.follower_id = auth.uid()
          AND uf.following_id = p_post_user_id
        
        UNION ALL
        
        -- Business posts: check business_follows
        SELECT 1
        FROM business_follows bf
        WHERE p_actor_type = 'business'
          AND bf.follower_id = auth.uid()
          AND bf.business_id = p_actor_id
      ) follows_check
    );
$$;

-- Drop the overly permissive public_read_posts policy
DROP POLICY IF EXISTS "public_read_posts" ON posts;

-- Create a new comprehensive SELECT policy that respects visibility
-- This replaces all SELECT policies with one unified policy
DROP POLICY IF EXISTS "posts_select_visibility" ON posts;
DROP POLICY IF EXISTS "Authenticated users can view posts from public profiles" ON posts;
DROP POLICY IF EXISTS "Users can view posts from followed users" ON posts;
DROP POLICY IF EXISTS "Users can view their own posts" ON posts;

CREATE POLICY "posts_select_visibility"
ON posts
FOR SELECT
USING (
  -- Anyone visibility: everyone can see
  visibility = 'anyone'
  
  -- Private visibility: only the owner can see
  OR (visibility = 'private' AND user_id = auth.uid())
  
  -- Followers visibility: only followers of the actor can see
  OR (
    visibility = 'followers'
    AND can_view_followers_post(user_id, actor_type::text, actor_id)
  )
);