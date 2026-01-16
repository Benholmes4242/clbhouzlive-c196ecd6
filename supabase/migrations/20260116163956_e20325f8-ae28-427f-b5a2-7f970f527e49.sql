-- Create function to recalculate vote counts from course_review_votes
CREATE OR REPLACE FUNCTION public.update_course_review_vote_counts()
RETURNS TRIGGER AS $$
DECLARE
  target_rating_id UUID;
  helpful_total INTEGER;
  unhelpful_total INTEGER;
BEGIN
  -- Determine which rating_id to update
  IF TG_OP = 'DELETE' THEN
    target_rating_id := OLD.rating_id;
  ELSE
    target_rating_id := NEW.rating_id;
  END IF;

  -- Calculate totals from course_review_votes
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE vote_type = 'helpful'), 0),
    COALESCE(COUNT(*) FILTER (WHERE vote_type = 'unhelpful'), 0)
  INTO helpful_total, unhelpful_total
  FROM public.course_review_votes
  WHERE rating_id = target_rating_id;

  -- Update the course_ratings table
  UPDATE public.course_ratings
  SET 
    helpful_count = helpful_total,
    unhelpful_count = unhelpful_total,
    updated_at = now()
  WHERE id = target_rating_id;

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on course_review_votes
DROP TRIGGER IF EXISTS trigger_update_course_review_vote_counts ON public.course_review_votes;

CREATE TRIGGER trigger_update_course_review_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON public.course_review_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_course_review_vote_counts();

-- Add unique constraint for upsert to work properly (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'course_review_votes_rating_user_unique'
  ) THEN
    ALTER TABLE public.course_review_votes 
    ADD CONSTRAINT course_review_votes_rating_user_unique 
    UNIQUE (rating_id, user_id);
  END IF;
END $$;

-- Recalculate existing vote counts (one-time fix for existing data)
UPDATE public.course_ratings cr
SET 
  helpful_count = COALESCE(vote_counts.helpful, 0),
  unhelpful_count = COALESCE(vote_counts.unhelpful, 0)
FROM (
  SELECT 
    rating_id,
    COUNT(*) FILTER (WHERE vote_type = 'helpful') as helpful,
    COUNT(*) FILTER (WHERE vote_type = 'unhelpful') as unhelpful
  FROM public.course_review_votes
  GROUP BY rating_id
) vote_counts
WHERE cr.id = vote_counts.rating_id;

COMMENT ON FUNCTION public.update_course_review_vote_counts IS 'Trigger function to keep helpful/unhelpful counts in sync on course_ratings';