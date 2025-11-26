-- Add is_mock column to course_ratings table
ALTER TABLE course_ratings 
ADD COLUMN is_mock BOOLEAN NOT NULL DEFAULT false;

-- Add index for better query performance when filtering by is_mock
CREATE INDEX idx_course_ratings_is_mock ON course_ratings(is_mock);