
-- Add tagged_by_user_id column to post_tags (currently missing from live schema)
ALTER TABLE public.post_tags
  ADD COLUMN IF NOT EXISTS tagged_by_user_id uuid;

-- Backfill existing rows using the post's user_id
UPDATE public.post_tags pt
SET tagged_by_user_id = p.user_id
FROM public.posts p
WHERE pt.post_id = p.id
  AND pt.tagged_by_user_id IS NULL;

-- Now make it NOT NULL
ALTER TABLE public.post_tags
  ALTER COLUMN tagged_by_user_id SET NOT NULL;
