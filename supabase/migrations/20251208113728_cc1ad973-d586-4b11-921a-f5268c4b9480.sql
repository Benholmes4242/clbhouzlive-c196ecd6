-- Update course_rating_aggregates view to exclude mock reviews
-- This ensures community scores only show real user ratings when SHOW_MOCK_REVIEWS = false

DROP VIEW IF EXISTS course_rating_aggregates;

CREATE VIEW course_rating_aggregates AS
SELECT 
    course_id,
    avg(rating) AS avg_overall_score,
    avg(design_score) AS avg_design_score,
    avg(condition_score) AS avg_condition_score,
    avg(clubhouse_score) AS avg_clubhouse_score,
    avg(facilities_score) AS avg_facilities_score,
    count(*) AS review_count,
    count(*) FILTER (WHERE (review IS NOT NULL) AND (review <> ''::text)) AS text_review_count
FROM course_ratings
WHERE is_mock = false
GROUP BY course_id;