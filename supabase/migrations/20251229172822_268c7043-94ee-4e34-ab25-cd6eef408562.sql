-- 1.1 Add columns
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count integer NOT NULL DEFAULT 0;

-- 1.2 Backfill from truth tables
UPDATE public.posts p
SET like_count = COALESCE(x.cnt, 0)
FROM (
  SELECT post_id, COUNT(*)::int AS cnt
  FROM public.post_likes
  GROUP BY post_id
) x
WHERE p.id = x.post_id;

UPDATE public.posts p
SET comment_count = COALESCE(x.cnt, 0)
FROM (
  SELECT post_id, COUNT(*)::int AS cnt
  FROM public.post_comments
  GROUP BY post_id
) x
WHERE p.id = x.post_id;

-- 1.3 Create triggers for likes
CREATE OR REPLACE FUNCTION public.posts_increment_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.posts_decrement_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_like_insert ON public.post_likes;
CREATE TRIGGER trg_posts_like_insert
AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.posts_increment_like_count();

DROP TRIGGER IF EXISTS trg_posts_like_delete ON public.post_likes;
CREATE TRIGGER trg_posts_like_delete
AFTER DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.posts_decrement_like_count();

-- 1.3 Create triggers for comments
CREATE OR REPLACE FUNCTION public.posts_increment_comment_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.posts_decrement_comment_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_comment_insert ON public.post_comments;
CREATE TRIGGER trg_posts_comment_insert
AFTER INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.posts_increment_comment_count();

DROP TRIGGER IF EXISTS trg_posts_comment_delete ON public.post_comments;
CREATE TRIGGER trg_posts_comment_delete
AFTER DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.posts_decrement_comment_count();

-- 1.4 Add indexes
CREATE INDEX IF NOT EXISTS idx_posts_like_count ON public.posts (like_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_comment_count ON public.posts (comment_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);