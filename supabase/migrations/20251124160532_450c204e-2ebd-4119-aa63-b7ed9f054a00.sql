-- Drop old step constraints that enforce 0.5 increments
ALTER TABLE public.course_ratings
  DROP CONSTRAINT IF EXISTS course_ratings_design_score_step,
  DROP CONSTRAINT IF EXISTS course_ratings_condition_score_step,
  DROP CONSTRAINT IF EXISTS course_ratings_clubhouse_score_step,
  DROP CONSTRAINT IF EXISTS course_ratings_facilities_score_step;

-- Add new constraints allowing increments of 0.1 from 0.5 to 10
ALTER TABLE public.course_ratings
  ADD CONSTRAINT course_ratings_design_score_step
    CHECK (
      design_score IS NULL
      OR (design_score >= 0.5 AND design_score <= 10.0
          AND ((design_score * 10)::int = design_score * 10))
    ),
  ADD CONSTRAINT course_ratings_condition_score_step
    CHECK (
      condition_score IS NULL
      OR (condition_score >= 0.5 AND condition_score <= 10.0
          AND ((condition_score * 10)::int = condition_score * 10))
    ),
  ADD CONSTRAINT course_ratings_clubhouse_score_step
    CHECK (
      clubhouse_score IS NULL
      OR (clubhouse_score >= 0.5 AND clubhouse_score <= 10.0
          AND ((clubhouse_score * 10)::int = clubhouse_score * 10))
    ),
  ADD CONSTRAINT course_ratings_facilities_score_step
    CHECK (
      facilities_score IS NULL
      OR (facilities_score >= 0.5 AND facilities_score <= 10.0
          AND ((facilities_score * 10)::int = facilities_score * 10))
    );