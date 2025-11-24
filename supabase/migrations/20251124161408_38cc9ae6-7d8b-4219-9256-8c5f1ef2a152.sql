-- Fix course_ratings constraints to allow 0.1 step increments

-- 1) Drop the old rating constraint that only allows 0.5 steps
ALTER TABLE public.course_ratings
  DROP CONSTRAINT IF EXISTS course_ratings_rating_check;

-- 2) Drop conflicting _check constraints on breakdown scores (they don't allow NULL)
ALTER TABLE public.course_ratings
  DROP CONSTRAINT IF EXISTS course_ratings_design_score_check,
  DROP CONSTRAINT IF EXISTS course_ratings_condition_score_check,
  DROP CONSTRAINT IF EXISTS course_ratings_facilities_score_check;

-- 3) Add new rating constraint allowing 0.1 steps (0.5 to 10.0)
ALTER TABLE public.course_ratings
  ADD CONSTRAINT course_ratings_rating_check
    CHECK (
      rating >= 0.5 
      AND rating <= 10.0
      AND ((rating * 10)::int = rating * 10)
    );

-- Note: clubhouse_score doesn't have a conflicting _check constraint
-- The _step constraints for all breakdown scores already allow 0.1 steps and NULL