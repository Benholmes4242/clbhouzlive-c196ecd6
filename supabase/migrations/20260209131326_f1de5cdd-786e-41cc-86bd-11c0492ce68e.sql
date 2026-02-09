-- Fix 7: Server-side pin limit enforcement (max 3 pinned posts)
CREATE OR REPLACE FUNCTION public.enforce_pinned_post_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.pinned_post_ids IS NOT NULL AND array_length(NEW.pinned_post_ids, 1) > 3 THEN
    RAISE EXCEPTION 'Maximum 3 pinned posts allowed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_pinned_post_limit_trigger
  BEFORE INSERT OR UPDATE OF pinned_post_ids ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_pinned_post_limit();

-- Fix 4: Creator-only profile enforcement function
-- Security definer function to check if a user follows another user
CREATE OR REPLACE FUNCTION public.is_following_user(follower uuid, followed uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_follows
    WHERE follower_id = follower AND following_id = followed
  );
$$;