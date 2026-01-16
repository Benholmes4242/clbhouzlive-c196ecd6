-- Fix conflicting INSERT policies on posts table
-- Problem: Two INSERT policies can conflict, causing silent failures
-- Solution: Drop the old simpler policy and keep the more comprehensive one

-- First, drop the simpler policy that can conflict
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;

-- Verify the remaining policy covers all cases
-- The insert_posts_as_valid_actor policy handles:
-- 1. Personal posts: actor_type='personal' AND actor_id=auth.uid()
-- 2. Business posts: actor_type='business' AND user is owner/admin/editor of that business

-- Add diagnostic logging function for debugging
CREATE OR REPLACE FUNCTION public.debug_post_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE LOG 'POST INSERT: user_id=%, actor_type=%, actor_id=%, auth.uid()=%', 
    NEW.user_id, NEW.actor_type, NEW.actor_id, auth.uid();
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS debug_post_insert_trigger ON public.posts;

-- Note: Commenting out debug trigger for production - uncomment for debugging
-- CREATE TRIGGER debug_post_insert_trigger
--   BEFORE INSERT ON public.posts
--   FOR EACH ROW EXECUTE FUNCTION public.debug_post_insert();