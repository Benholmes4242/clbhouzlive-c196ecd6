-- ============================================================================
-- R1 — a review's likes are split across two stores
--
-- BEN RUNS THESE BY HAND, IN THIS ORDER. Nothing here has been applied.
-- Every statement below was built from the LIVE definition read out of the
-- database with pg_get_functiondef / pg_get_triggerdef / pg_get_viewdef on
-- 18 Sep 2026 — not from docs/sql or supabase/migrations, which have drifted.
--
-- Measured on live data before writing (read-only):
--   personal post_likes on review-backed posts ...... 283  across 108 posts
--   of those, already present in content_reactions ..  10
--   business post_likes on review-backed posts ......   0
-- So step 1 should report: read 283, inserted 273, skipped 10, deleted 283.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- STEP 1 (R1.4) — MIGRATE the 283 personal post_likes into content_reactions.
--
-- Runs FIRST, while the old triggers are still in place: the DELETE decrements
-- posts.like_count through trg_posts_like_delete, and STEP 5 recounts every
-- review post afterwards, so the column lands correct either way.
--
-- Business-actor rows are left in post_likes untouched (there are none today,
-- but the predicate is written so that stays true if one appears).
--
-- WHY THE notify_content_reaction TRIGGER IS DISABLED FOR THE INSERT:
-- content_reactions carries AFTER INSERT ... tg_notify_content_reaction(), which
-- writes a notification row per like. Replaying 273 historical likes through it
-- would send 273 fresh "liked your review" notifications for likes that are
-- months old. It is re-enabled in the same transaction.
-- ----------------------------------------------------------------------------
BEGIN;

ALTER TABLE public.content_reactions DISABLE TRIGGER notify_content_reaction;

WITH src AS (
  SELECT pl.ctid,
         pl.user_id,
         pl.created_at,
         p.source_review_id
    FROM public.post_likes pl
    JOIN public.posts p ON p.id = pl.post_id
   WHERE p.source_review_id IS NOT NULL
     AND COALESCE(pl.actor_type, 'personal') <> 'business'
), ins AS (
  INSERT INTO public.content_reactions (target_type, target_id, user_id, created_at)
  SELECT DISTINCT ON (s.source_review_id, s.user_id)
         'review', s.source_review_id, s.user_id, s.created_at
    FROM src s
   WHERE NOT EXISTS (
     SELECT 1 FROM public.content_reactions cr
      WHERE cr.target_type = 'review'
        AND cr.target_id = s.source_review_id
        AND cr.user_id = s.user_id
   )
   ORDER BY s.source_review_id, s.user_id, s.created_at ASC
  RETURNING 1
), del AS (
  DELETE FROM public.post_likes pl
   USING src s
   WHERE pl.ctid = s.ctid
  RETURNING 1
)
SELECT (SELECT count(*) FROM src)                          AS rows_read,
       (SELECT count(*) FROM ins)                          AS rows_inserted,
       (SELECT count(*) FROM src) - (SELECT count(*) FROM ins) AS duplicates_skipped,
       (SELECT count(*) FROM del)                          AS rows_deleted;

ALTER TABLE public.content_reactions ENABLE TRIGGER notify_content_reaction;

COMMIT;


-- ----------------------------------------------------------------------------
-- STEP 2 (R1.1) — viewer_liked_post gains a REVIEW branch.
--
-- CHANGED vs live: added the third OR arm (the review branch) and rewrote the
-- COMMENT to name both 'round' and 'review'. The base post_likes predicate and
-- the round branch are byte-identical to the deployed text.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.viewer_liked_post(p_post_id uuid, p_viewer uuid, p_actor_type text DEFAULT 'personal'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN p_post_id IS NULL OR p_viewer IS NULL THEN FALSE
    ELSE (
      EXISTS (
        SELECT 1 FROM public.post_likes pl
        WHERE pl.post_id = p_post_id
          AND pl.actor_type = COALESCE(p_actor_type, 'personal')
          AND pl.actor_id = p_viewer
      )
      OR (
        COALESCE(p_actor_type, 'personal') = 'personal'
        AND EXISTS (
          SELECT 1
          FROM public.posts p
          JOIN public.content_reactions cr
            ON cr.target_type = 'round'
           AND cr.target_id = p.whs_score_id
          WHERE p.id = p_post_id
            AND p.whs_score_id IS NOT NULL
            AND cr.user_id = p_viewer
        )
      )
      OR (
        COALESCE(p_actor_type, 'personal') = 'personal'
        AND EXISTS (
          SELECT 1
          FROM public.posts p
          JOIN public.content_reactions cr
            ON cr.target_type = 'review'
           AND cr.target_id = p.source_review_id
          WHERE p.id = p_post_id
            AND p.source_review_id IS NOT NULL
            AND cr.user_id = p_viewer
        )
      )
    )
  END
$function$;

COMMENT ON FUNCTION public.viewer_liked_post(uuid, uuid, text) IS
  'Canonical viewer-liked predicate. Reads post_likes plus content_reactions for the two backed cases: target_type=round for round-backed posts (whs_score_id) and target_type=review for review-backed posts (source_review_id). All liked flags in every RPC and client read must route through this. Change here only.';


-- ----------------------------------------------------------------------------
-- STEP 3 (R1.2) — the count triggers.
--
-- 3a. New recount, modelled on recount_round_post_likes: content_reactions
--     (target_type='review') + business post_likes.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recount_review_post_likes(p_review_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.posts p
     SET like_count = (
           SELECT count(*) FROM public.content_reactions cr
            WHERE cr.target_type = 'review' AND cr.target_id = p_review_id
         ) + (
           SELECT count(*) FROM public.post_likes pl
            WHERE pl.post_id = p.id AND pl.actor_type = 'business'
         )
   WHERE p.source_review_id = p_review_id;
$function$;

-- 3b. content_reactions sync: was an early RETURN for anything that is not
--     'round'. CHANGED to route 'review' to the new recount. Round path
--     untouched.
CREATE OR REPLACE FUNCTION public.content_reactions_sync_post_like_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_target_type text := COALESCE(NEW.target_type, OLD.target_type);
  v_target_id uuid := COALESCE(NEW.target_id, OLD.target_id);
BEGIN
  IF v_target_type = 'round' THEN
    PERFORM public.recount_round_post_likes(v_target_id);
  ELSIF v_target_type = 'review' THEN
    PERFORM public.recount_review_post_likes(v_target_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 3c. post_likes sync for BUSINESS actors: was round-only. CHANGED to also
--     recount a review-backed post, so a business like still lands in the
--     column now that the column is owned by the recount functions.
--     (Renaming the function would break trg_post_likes_sync_round_like_count,
--     so the name stays and the body widens.)
CREATE OR REPLACE FUNCTION public.post_likes_sync_round_like_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_post uuid := COALESCE(NEW.post_id, OLD.post_id);
  v_actor_type text := COALESCE(NEW.actor_type, OLD.actor_type);
  v_score uuid;
  v_review uuid;
BEGIN
  IF COALESCE(v_actor_type, 'personal') <> 'business' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  SELECT whs_score_id, source_review_id INTO v_score, v_review
    FROM public.posts WHERE id = v_post;
  IF v_score IS NOT NULL THEN
    PERFORM public.recount_round_post_likes(v_score);
  ELSIF v_review IS NOT NULL THEN
    PERFORM public.recount_review_post_likes(v_review);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 3d. NARROW THE GATE. This is the step that makes the count correct: the
--     increment/decrement pair must stop writing the column for review posts,
--     or both trigger sets fight over it.
CREATE OR REPLACE FUNCTION public.posts_increment_like_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.posts
     SET like_count = like_count + 1
   WHERE id = NEW.post_id
     AND whs_score_id IS NULL
     AND source_review_id IS NULL;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.posts_decrement_like_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.posts
     SET like_count = GREATEST(like_count - 1, 0)
   WHERE id = OLD.post_id
     AND whs_score_id IS NULL
     AND source_review_id IS NULL;
  RETURN OLD;
END;
$function$;


-- ----------------------------------------------------------------------------
-- STEP 4 (R1.3) — the drift assertion, modelled on round_post_like_count_drift.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.review_post_like_count_drift AS
 SELECT p.id AS post_id,
    p.user_id,
    p.source_review_id,
    COALESCE(p.like_count, 0) AS stored_like_count,
    cr.n AS content_reaction_count,
    bl.n AS business_post_like_count,
    cr.n + bl.n AS expected_like_count
   FROM posts p
     CROSS JOIN LATERAL ( SELECT count(*)::integer AS n
           FROM content_reactions r
          WHERE r.target_type = 'review'::text AND r.target_id = p.source_review_id) cr
     CROSS JOIN LATERAL ( SELECT count(*)::integer AS n
           FROM post_likes l
          WHERE l.post_id = p.id AND l.actor_type = 'business'::text) bl
  WHERE p.source_review_id IS NOT NULL AND COALESCE(p.like_count, 0) <> (cr.n + bl.n);

COMMENT ON VIEW public.review_post_like_count_drift IS
  'Assertion: must return zero rows. Any review post whose posts.like_count disagrees with (content_reactions target_type=review) + (post_likes actor_type=business). Guards the two complementary trigger sets: recount_review_post_likes vs posts_increment/decrement_like_count (whs_score_id IS NULL AND source_review_id IS NULL).';

GRANT SELECT ON public.review_post_like_count_drift TO service_role;


-- ----------------------------------------------------------------------------
-- STEP 5 — backfill the column once, now that the recount owns it.
-- Steps 1-4 leave historical review posts with whatever the old increment /
-- decrement pair had accumulated. This sets every one of them to the truth.
-- ----------------------------------------------------------------------------
SELECT count(*) AS review_posts_recounted
  FROM (
    SELECT public.recount_review_post_likes(s.source_review_id)
      FROM (SELECT DISTINCT source_review_id
              FROM public.posts
             WHERE source_review_id IS NOT NULL) s
  ) t;


-- ----------------------------------------------------------------------------
-- STEP 6 — the two assertions. Both must return zero rows.
-- ----------------------------------------------------------------------------
SELECT * FROM public.review_post_like_count_drift;
SELECT * FROM public.round_post_like_count_drift;
