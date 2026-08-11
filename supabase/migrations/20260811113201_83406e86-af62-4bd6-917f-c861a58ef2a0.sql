-- 1. Round posts take their like_count from content_reactions ONLY.
CREATE OR REPLACE FUNCTION public.posts_increment_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.posts
     SET like_count = like_count + 1
   WHERE id = NEW.post_id
     AND whs_score_id IS NULL;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.posts_decrement_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.posts
     SET like_count = GREATEST(like_count - 1, 0)
   WHERE id = OLD.post_id
     AND whs_score_id IS NULL;
  RETURN OLD;
END;
$function$;

-- 2. content_reactions('round') is the canonical writer of round-post like_count.
CREATE OR REPLACE FUNCTION public.content_reactions_sync_post_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_target_type text := COALESCE(NEW.target_type, OLD.target_type);
  v_target_id uuid := COALESCE(NEW.target_id, OLD.target_id);
BEGIN
  IF v_target_type <> 'round' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE public.posts p
     SET like_count = (
           SELECT count(*)
             FROM public.content_reactions cr
            WHERE cr.target_type = 'round'
              AND cr.target_id = v_target_id
         )
   WHERE p.whs_score_id = v_target_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS trg_content_reactions_sync_post_like_count ON public.content_reactions;
CREATE TRIGGER trg_content_reactions_sync_post_like_count
AFTER INSERT OR DELETE ON public.content_reactions
FOR EACH ROW EXECUTE FUNCTION public.content_reactions_sync_post_like_count();

-- 3. Notification scoping: round posts are notified by tg_notify_content_reaction,
--    so the post_likes aggregator must skip them (no double alerts from stale clients).
CREATE OR REPLACE FUNCTION public.post_likes_skip_round_posts()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$ SELECT true $function$;

-- 4. Re-derive round-post like_count from content_reactions (uses posts_whs_score_id_idx).
UPDATE public.posts p
   SET like_count = COALESCE(cr.n, 0)
  FROM (
    SELECT target_id, count(*) AS n
      FROM public.content_reactions
     WHERE target_type = 'round'
     GROUP BY target_id
  ) cr
 WHERE p.whs_score_id = cr.target_id
   AND p.like_count <> cr.n;

UPDATE public.posts p
   SET like_count = 0
 WHERE p.whs_score_id IS NOT NULL
   AND p.like_count <> 0
   AND NOT EXISTS (
     SELECT 1 FROM public.content_reactions cr
      WHERE cr.target_type = 'round' AND cr.target_id = p.whs_score_id
   );