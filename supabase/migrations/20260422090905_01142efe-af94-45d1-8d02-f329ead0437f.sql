-- =============================================================================
-- Widen duration_seconds from integer to numeric(10,3) across all video tables.
-- (Re-run after pre-flight surfaced trg_sync_post_media_duration_update
--  also depending on duration_seconds via its OF column-list.)
--
-- Run order:
--   1. Drop dependent view AND the column-list trigger (both block ALTER TYPE)
--   2. Widen 4 tables
--   3. Recreate trigger and view
--   4. Reconcile 22 mismatched rows
--   5. Replace trigger function with reconciliation logic
-- =============================================================================

-- Step 1a: Drop dependent view.
DROP VIEW IF EXISTS public.explore_moments;

-- Step 1b: Drop the UPDATE trigger that has duration_seconds in its column-list.
-- The INSERT trigger is fine — it references the function but not the column.
DROP TRIGGER IF EXISTS trg_sync_post_media_duration_update ON public.post_media;

-- Step 2: Widen all four tables.
ALTER TABLE public.post_media
  ALTER COLUMN duration_seconds TYPE numeric(10,3)
  USING duration_seconds::numeric(10,3);

ALTER TABLE public.course_review_media
  ALTER COLUMN duration_seconds TYPE numeric(10,3)
  USING duration_seconds::numeric(10,3);

ALTER TABLE public.post_draft_media
  ALTER COLUMN duration_seconds TYPE numeric(10,3)
  USING duration_seconds::numeric(10,3);

ALTER TABLE public.video_progress
  ALTER COLUMN duration_seconds TYPE numeric(10,3)
  USING duration_seconds::numeric(10,3);

-- Step 3: Recreate the UPDATE trigger (identical definition).
CREATE TRIGGER trg_sync_post_media_duration_update
  BEFORE UPDATE OF duration_seconds, duration_ms ON public.post_media
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_post_media_duration();

-- Step 4: Re-assert non-negative constraint on post_media (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.post_media'::regclass
      AND conname = 'duration_seconds_nonneg'
  ) THEN
    ALTER TABLE public.post_media
      ADD CONSTRAINT duration_seconds_nonneg
      CHECK (duration_seconds IS NULL OR duration_seconds >= 0);
  END IF;
END $$;

-- Step 5: Document the change.
COMMENT ON COLUMN public.post_media.duration_seconds IS
  'Video duration in seconds with millisecond precision (numeric(10,3)). '
  'Widened from integer on 2026-04-22 to allow lossless equivalence with '
  'duration_ms (= duration_seconds * 1000 exactly). '
  'Trigger sync_post_media_duration mirrors and reconciles to duration_ms on INSERT/UPDATE.';

COMMENT ON COLUMN public.course_review_media.duration_seconds IS
  'Video duration in seconds with millisecond precision (numeric(10,3)). '
  'Widened from integer on 2026-04-22 for consistency with post_media.';

COMMENT ON COLUMN public.post_draft_media.duration_seconds IS
  'Video duration in seconds with millisecond precision (numeric(10,3)). '
  'Widened from integer on 2026-04-22 so client writes preserve sub-second precision.';

COMMENT ON COLUMN public.video_progress.duration_seconds IS
  'Video total duration in seconds with millisecond precision (numeric(10,3)). '
  'Widened from integer on 2026-04-22 so resume positions preserve sub-second precision.';

-- Step 6: Recreate explore_moments view. Identical to pre-drop, except the
-- review_moments branch projects NULL::numeric(10,3) (was NULL::integer) so
-- the UNION ALL branches align on the new column type.
CREATE VIEW public.explore_moments AS
WITH post_moments AS (
  SELECT 'post_'::text || pm.id AS moment_id,
    'post'::text AS source_type,
    pm.post_id AS source_id,
    p.course_id,
    gc.name AS course_name,
    p.user_id,
    p.created_at,
    lower(pm.media_type) AS media_type,
    pm.media_url,
    COALESCE(pm.poster_url, pm.media_url) AS thumbnail_url,
    pm.stream_id,
    pm.aspect_ratio,
    pm.display_order,
    gc.region_key,
    ((SELECT count(*) AS count FROM post_likes pl WHERE pl.post_id = p.id))::integer AS likes_count,
    pm.duration_seconds
  FROM post_media pm
    JOIN posts p ON p.id = pm.post_id
    JOIN golf_courses gc ON gc.id = p.course_id
  WHERE p.course_id IS NOT NULL AND pm.media_url IS NOT NULL
), review_moments AS (
  SELECT 'review_'::text || crm.id AS moment_id,
    'review'::text AS source_type,
    crm.review_id AS source_id,
    cr.course_id,
    gc.name AS course_name,
    cr.user_id,
    cr.created_at,
    lower(crm.media_type) AS media_type,
    crm.media_url,
    COALESCE(crm.poster_url, crm.media_url) AS thumbnail_url,
    crm.stream_id,
    NULL::numeric AS aspect_ratio,
    NULL::integer AS display_order,
    gc.region_key,
    ((SELECT count(*) AS count FROM course_media_likes cml WHERE cml.media_id = crm.id::text))::integer AS likes_count,
    NULL::numeric(10,3) AS duration_seconds
  FROM course_review_media crm
    JOIN course_ratings cr ON cr.id = crm.review_id
    JOIN golf_courses gc ON gc.id = cr.course_id
  WHERE cr.course_id IS NOT NULL AND crm.media_url IS NOT NULL
    AND (crm.status IS NULL OR crm.status = 'ready'::text)
)
SELECT post_moments.moment_id, post_moments.source_type, post_moments.source_id,
       post_moments.course_id, post_moments.course_name, post_moments.user_id,
       post_moments.created_at, post_moments.media_type, post_moments.media_url,
       post_moments.thumbnail_url, post_moments.stream_id, post_moments.aspect_ratio,
       post_moments.display_order, post_moments.region_key, post_moments.likes_count,
       post_moments.duration_seconds
FROM post_moments
UNION ALL
SELECT review_moments.moment_id, review_moments.source_type, review_moments.source_id,
       review_moments.course_id, review_moments.course_name, review_moments.user_id,
       review_moments.created_at, review_moments.media_type, review_moments.media_url,
       review_moments.thumbnail_url, review_moments.stream_id, review_moments.aspect_ratio,
       review_moments.display_order, review_moments.region_key, review_moments.likes_count,
       review_moments.duration_seconds
FROM review_moments;

-- Step 7: Replace trigger function with reconciliation logic (Case 3).
CREATE OR REPLACE FUNCTION public.sync_post_media_duration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Case 1: seconds set, ms NULL -> derive ms.
  IF NEW.duration_seconds IS NOT NULL AND NEW.duration_ms IS NULL THEN
    NEW.duration_ms := (NEW.duration_seconds * 1000)::bigint;
    RETURN NEW;
  END IF;

  -- Case 2: ms set, seconds NULL -> derive seconds (now exact, was lossy).
  IF NEW.duration_ms IS NOT NULL AND NEW.duration_seconds IS NULL THEN
    NEW.duration_seconds := (NEW.duration_ms::numeric / 1000);
    RETURN NEW;
  END IF;

  -- Case 3: both set. If they disagree, duration_ms wins (Cloudflare precision).
  -- This wasn't safe before duration_seconds was widened to numeric(10,3).
  IF NEW.duration_ms IS NOT NULL AND NEW.duration_seconds IS NOT NULL THEN
    IF NEW.duration_ms <> (NEW.duration_seconds * 1000)::bigint THEN
      NEW.duration_seconds := (NEW.duration_ms::numeric / 1000);
    END IF;
    RETURN NEW;
  END IF;

  -- Case 4: both NULL. Nothing to do.
  RETURN NEW;
END;
$function$;

-- Step 8: Reconcile the 22 existing mismatched rows in post_media.
-- Done LAST so the new trigger function is in place; the UPDATE will fire it
-- but Case 3 just re-writes seconds to the same ms/1000 value (idempotent).
UPDATE public.post_media
SET duration_seconds = (duration_ms::numeric / 1000)
WHERE media_type = 'video'
  AND duration_ms IS NOT NULL
  AND duration_seconds IS NOT NULL
  AND duration_ms <> (duration_seconds * 1000)::bigint;