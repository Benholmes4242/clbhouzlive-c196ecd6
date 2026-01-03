-- Fix user_course_activity view to use correct "played" timestamp
-- Drop and recreate since column names are changing

DROP VIEW IF EXISTS public.user_course_activity;

CREATE VIEW public.user_course_activity AS
SELECT 
    user_id,
    course_id,
    created_at AS first_activity_at,
    -- played_at: the canonical "when user played/logged this course" timestamp
    -- Uses review_date if user specified it, otherwise falls back to created_at
    COALESCE(review_date, created_at) AS played_at,
    -- Keep updated_at as a separate field for admin/debug purposes only
    updated_at AS edited_at,
    rating AS rating_value,
    review IS NOT NULL AND review <> ''::text AS has_review,
    true AS has_rating,
    true AS has_played
FROM course_ratings cr;

-- Grant permissions to match original view
GRANT SELECT ON public.user_course_activity TO authenticated;
GRANT SELECT ON public.user_course_activity TO anon;