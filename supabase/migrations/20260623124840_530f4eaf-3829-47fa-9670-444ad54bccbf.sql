-- Backfill any remaining NULL display_order on post_media using created_at order per post.
WITH ranked AS (
  SELECT id,
         (ROW_NUMBER() OVER (PARTITION BY post_id ORDER BY created_at ASC, id ASC) - 1)::int AS rn
  FROM public.post_media
  WHERE display_order IS NULL
)
UPDATE public.post_media pm
SET display_order = r.rn
FROM ranked r
WHERE pm.id = r.id;

-- Tighten the column going forward. DEFAULT 0 is a safety net only; the live insert
-- paths set display_order explicitly per item.
ALTER TABLE public.post_media
  ALTER COLUMN display_order SET DEFAULT 0,
  ALTER COLUMN display_order SET NOT NULL;

-- Support ordered reads of a post's media.
CREATE INDEX IF NOT EXISTS post_media_post_id_display_order_idx
  ON public.post_media (post_id, display_order);
