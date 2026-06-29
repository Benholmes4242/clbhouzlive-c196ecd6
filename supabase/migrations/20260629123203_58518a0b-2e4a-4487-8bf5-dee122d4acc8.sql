-- Step 2: superset status constraint — add 'processing', keep all existing values.
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_status_check
  CHECK (status = ANY (ARRAY['draft'::text, 'processing'::text, 'scheduled'::text, 'published'::text, 'failed'::text]));

-- Step 3: extend SELECT policy. Published rows keep existing visibility rules;
-- any non-published row (processing/failed/draft/scheduled) is visible ONLY to its author.
DROP POLICY IF EXISTS posts_select_visibility ON public.posts;

CREATE POLICY posts_select_visibility ON public.posts
  FOR SELECT
  USING (
    (
      status = 'published'
      AND (
        visibility = 'anyone'::post_visibility
        OR (visibility = 'private'::post_visibility AND user_id = auth.uid())
        OR (visibility = 'followers'::post_visibility AND can_view_followers_post(user_id, actor_type, actor_id))
      )
    )
    OR (
      status <> 'published' AND user_id = auth.uid()
    )
  );