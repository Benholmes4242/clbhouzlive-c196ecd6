CREATE OR REPLACE FUNCTION public.create_post_from_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip mock ratings (seed data, not real reviews)
  IF NEW.is_mock = true THEN
    RETURN NEW;
  END IF;

  -- Idempotency: don't create a duplicate if one somehow already exists
  IF EXISTS (
    SELECT 1 FROM posts WHERE source_review_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- Create the post row, mirroring useShareReview's structure
  INSERT INTO posts (
    user_id,
    actor_type,
    actor_id,
    course_id,
    content,
    visibility,
    source_review_id,
    categories,
    status,
    created_at
  ) VALUES (
    NEW.user_id,
    'personal',
    NEW.user_id,
    NEW.course_id,
    NEW.review,
    'anyone',
    NEW.id,
    ARRAY['review']::text[],
    'published',
    NEW.created_at
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_post_from_rating ON public.course_ratings;

CREATE TRIGGER trg_create_post_from_rating
  AFTER INSERT ON public.course_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_post_from_rating();

COMMENT ON FUNCTION public.create_post_from_rating IS
  'Creates a Clubhouse posts row whenever a course_ratings row is inserted. Replaces client-side useShareReview auto-share which had a race condition where the share would silently fail if the user navigated away before reaching the success step of the Review Wizard.';