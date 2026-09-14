-- UNAPPLIED DRAFT. Ben rules on this.
--
-- PRINCIPLE: A WRITE THAT NEVER HAPPENS LEAVES NO TRACE. A column that can be
-- silently skipped will be. The client fix (postUploadController runVideo now
-- always writes poster_url, via @/uploads/posterUrl) closes the current hole.
-- This makes the same mistake impossible to repeat quietly from ANY writer.
--
-- INSERT-ORDER FINDING (established before drafting, as instructed):
--   * postUploadController.runVideo awaits uploadVideoResilient and only then
--     inserts the row - stream_id is known at insert time.
--   * The legacy uploadPipeline does the same (TUS upload resolves the uid,
--     then the post_media insert runs).
--   * Measured on production: 131 video rows, 0 with a NULL stream_id, 0 with
--     upload_status other than 'completed'. No row has ever existed as a video
--     awaiting a stream id on a callback.
--   THEREFORE a CHECK constraint is the right shape. No legitimate path
--   inserts a video row before its stream_id exists, so a CHECK cannot break
--   uploading. An UPDATE trigger would be the correct shape only if the id
--   arrived later - it does not.
--
-- The constraint is deliberately NARROW: it says nothing about video rows with
-- no stream_id (none exist today, but an external/R2-hosted video is a
-- plausible future shape and must not be blocked), and nothing about images.

BEGIN;

-- Guard: refuse to add a constraint the existing data would violate, rather
-- than failing halfway through a deploy. Run the backfill
-- (docs/sql/post_media_poster_backfill.sql) FIRST.
DO $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n
  FROM public.post_media
  WHERE media_type = 'video'
    AND stream_id IS NOT NULL
    AND poster_url IS NULL;
  IF n > 0 THEN
    RAISE EXCEPTION 'aborting: % video rows still have a stream_id and no poster_url - run the backfill first', n;
  END IF;
END $$;

ALTER TABLE public.post_media
  ADD CONSTRAINT post_media_video_poster_required
  CHECK (
    media_type <> 'video'
    OR stream_id IS NULL
    OR poster_url IS NOT NULL
  );

COMMENT ON CONSTRAINT post_media_video_poster_required ON public.post_media IS
  'A video row with a stream_id must carry a poster_url. Added after an eight-week silent fault where the upload controller omitted the column entirely and nothing reported it. A write that never happens leaves no trace.';

COMMIT;

-- Verify afterwards:
--   SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--   WHERE conrelid = 'public.post_media'::regclass
--     AND conname = 'post_media_video_poster_required';
