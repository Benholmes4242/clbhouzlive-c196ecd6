-- Add clubhouse_score column to course_ratings
ALTER TABLE public.course_ratings
  ADD COLUMN clubhouse_score numeric(3,1);

-- Add range constraint (0-10)
ALTER TABLE public.course_ratings
  ADD CONSTRAINT course_ratings_clubhouse_score_range
    CHECK (
      clubhouse_score IS NULL 
      OR (clubhouse_score >= 0 AND clubhouse_score <= 10)
    );

-- Add step constraint (0.5 increments)
ALTER TABLE public.course_ratings
  ADD CONSTRAINT course_ratings_clubhouse_score_step
    CHECK (
      clubhouse_score IS NULL 
      OR (clubhouse_score * 2 = floor(clubhouse_score * 2))
    );

-- Drop and recreate course_rating_aggregates view to include clubhouse average
DROP VIEW IF EXISTS public.course_rating_aggregates;

CREATE VIEW public.course_rating_aggregates AS
SELECT
  course_id,
  avg(rating)          AS avg_overall_score,
  avg(design_score)    AS avg_design_score,
  avg(condition_score) AS avg_condition_score,
  avg(clubhouse_score) AS avg_clubhouse_score,
  avg(facilities_score) AS avg_facilities_score,
  count(*)             AS review_count,
  count(*) FILTER (
    WHERE review IS NOT NULL AND review <> ''
  ) AS text_review_count
FROM public.course_ratings
GROUP BY course_id;