ALTER TABLE course_ratings ADD COLUMN IF NOT EXISTS is_review_of_week boolean DEFAULT false;
ALTER TABLE course_ratings ADD COLUMN IF NOT EXISTS review_of_week_week text;