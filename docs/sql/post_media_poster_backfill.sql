-- UNAPPLIED DRAFT. Ben rules on this.
--
-- WHY: from 2026-07-21 the post-v2 upload controller
-- (src/features/post-v2/lib/postUploadController.ts, runVideo) writes
-- poster_url ONLY when the member picked a custom poster frame:
--
--     ...(posterUrl ? { poster_url: posterUrl } : {})
--
-- Nobody picks a frame (poster_timestamp is NULL on every single row since
-- that date), so every video posted through it has a NULL poster_url. The old
-- pipeline (src/uploads/uploadPipeline.ts) always wrote a derived Stream
-- thumbnail URL. That one spread operator is the whole fault.
--
-- This backfills the rows that already exist. It does NOT stop new NULLs -
-- that is the controller fix, which is a separate change.
--
-- Affected at time of writing: 22 rows, all with a non-null stream_id, all
-- with media_url of the form 'stream:<uid>'. The URL shape below is exactly
-- what the old pipeline wrote and what Cloudflare Stream serves with
-- cache-control: public, max-age=864000.

BEGIN;

-- Guard: fail loudly if the shape of the problem has changed since it was
-- measured, rather than writing URLs for rows this was not drafted against.
DO $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n
  FROM public.post_media
  WHERE media_type = 'video'
    AND poster_url IS NULL
    AND stream_id IS NULL;
  IF n > 0 THEN
    RAISE EXCEPTION 'aborting: % video rows have no poster and no stream_id, so no poster can be derived', n;
  END IF;
END $$;

UPDATE public.post_media
SET poster_url =
      'https://customer-4ah4gni80ytefpck.cloudflarestream.com/'
      || stream_id
      || '/thumbnails/thumbnail.jpg?height=1080&fit=crop'
WHERE media_type = 'video'
  AND poster_url IS NULL
  AND stream_id IS NOT NULL;

-- Expect: UPDATE 22
COMMIT;

-- Verify afterwards:
--   SELECT count(*) FILTER (WHERE poster_url IS NULL) AS still_empty,
--          count(*) AS total
--   FROM public.post_media WHERE media_type = 'video';
