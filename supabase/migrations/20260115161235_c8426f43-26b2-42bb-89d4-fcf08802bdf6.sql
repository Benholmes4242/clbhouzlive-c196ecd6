-- ================================================
-- REVIEW SYSTEM CLEANUP - Beta Launch Preparation
-- ================================================

-- Step 1: Delete course review media (child table first)
DELETE FROM course_review_media;

-- Step 2: Delete review votes
DELETE FROM review_votes;

-- Step 3: Delete course review votes
DELETE FROM course_review_votes;

-- Step 4: Delete all course ratings (the main reviews)
DELETE FROM course_ratings;

-- Note: course_rating_stats is a VIEW that auto-aggregates from course_ratings
-- It will automatically reflect empty results now