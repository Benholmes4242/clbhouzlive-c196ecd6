-- SECTION F — CAPTURE ONLY. NO BEHAVIOUR CHANGE.
--
-- comments_v2_count_inc / comments_v2_count_dec and their triggers exist in the
-- live database but in NO migration file, so a rebuild or replay from
-- migrations would silently lose the only thing keeping posts.comment_count in
-- step with reality — and the count would then drift with nothing to surface it.
--
-- The definitions below are the live ones, dumped verbatim with
-- pg_get_functiondef / pg_get_triggerdef and re-expressed as CREATE OR REPLACE
-- plus DROP TRIGGER IF EXISTS / CREATE TRIGGER, so applying this to the live
-- database is a no-op. Nothing live is dropped, recreated or altered in
-- substance.
--
-- DEAD MIGRATION: supabase/migrations/20251229172822_268c7043-94ee-4e34-ab25-cd6eef408562.sql
-- defines posts_increment_comment_count / posts_decrement_comment_count and
-- attaches trg_posts_comment_insert / trg_posts_comment_delete to
-- public.post_comments. public.post_comments is now a VIEW over
-- public.comments_v2, so those triggers can never fire. The comment counter has
-- moved to comments_v2 and is captured here. That migration is superseded and
-- retained for history only.

CREATE OR REPLACE FUNCTION public.comments_v2_count_inc()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN
  IF NEW.target_type = 'post' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.target_id;
  END IF; RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.comments_v2_count_dec()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN
  IF OLD.target_type = 'post' THEN
    UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.target_id;
  END IF; RETURN OLD;
END; $function$;

DROP TRIGGER IF EXISTS trg_comments_v2_count_inc ON public.comments_v2;
CREATE TRIGGER trg_comments_v2_count_inc
AFTER INSERT ON public.comments_v2
FOR EACH ROW EXECUTE FUNCTION public.comments_v2_count_inc();

DROP TRIGGER IF EXISTS trg_comments_v2_count_dec ON public.comments_v2;
CREATE TRIGGER trg_comments_v2_count_dec
AFTER DELETE ON public.comments_v2
FOR EACH ROW EXECUTE FUNCTION public.comments_v2_count_dec();