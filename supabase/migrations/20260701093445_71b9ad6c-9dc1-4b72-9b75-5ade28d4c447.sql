
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS pre_moderation_status text;

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_status_check
  CHECK (status = ANY (ARRAY[
    'draft'::text,
    'processing'::text,
    'scheduled'::text,
    'published'::text,
    'failed'::text,
    'moderation_hidden'::text
  ]));

CREATE OR REPLACE FUNCTION public.posts_apply_moderation_hidden_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.moderation_hidden, false) = true AND NEW.status <> 'moderation_hidden' THEN
      NEW.pre_moderation_status := NEW.status;
      NEW.status := 'moderation_hidden';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF COALESCE(NEW.moderation_hidden, false) = true
     AND COALESCE(OLD.moderation_hidden, false) = false THEN
    IF NEW.status <> 'moderation_hidden' THEN
      NEW.pre_moderation_status := NEW.status;
      NEW.status := 'moderation_hidden';
    END IF;
  ELSIF COALESCE(NEW.moderation_hidden, false) = false
        AND COALESCE(OLD.moderation_hidden, false) = true THEN
    IF NEW.status = 'moderation_hidden' THEN
      NEW.status := COALESCE(OLD.pre_moderation_status, 'published');
    END IF;
    NEW.pre_moderation_status := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_apply_moderation_hidden_status ON public.posts;
CREATE TRIGGER trg_posts_apply_moderation_hidden_status
BEFORE INSERT OR UPDATE OF moderation_hidden, status ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.posts_apply_moderation_hidden_status();
