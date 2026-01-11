
-- Drop and recreate explore_moments view to add duration_seconds
DROP VIEW IF EXISTS public.explore_moments;

CREATE OR REPLACE VIEW public.explore_moments AS
WITH post_moments AS (
    SELECT
        'post_' || pm.id AS moment_id,
        'post'::text AS source_type,
        pm.post_id AS source_id,
        p.course_id,
        gc.name AS course_name,
        p.user_id,
        p.created_at,
        lower(pm.media_type) AS media_type,
        pm.media_url,
        COALESCE(pm.poster_url, pm.media_url) AS thumbnail_url,
        pm.stream_id,
        pm.aspect_ratio,
        pm.display_order,
        gc.region_key,
        (SELECT count(*) FROM post_likes pl WHERE pl.post_id = p.id)::integer AS likes_count,
        pm.duration_seconds
    FROM post_media pm
    JOIN posts p ON p.id = pm.post_id
    JOIN golf_courses gc ON gc.id = p.course_id
    WHERE p.course_id IS NOT NULL
      AND pm.media_url IS NOT NULL
),
review_moments AS (
    SELECT
        'review_' || crm.id AS moment_id,
        'review'::text AS source_type,
        crm.review_id AS source_id,
        cr.course_id,
        gc.name AS course_name,
        cr.user_id,
        cr.created_at,
        lower(crm.media_type) AS media_type,
        crm.media_url,
        COALESCE(crm.poster_url, crm.media_url) AS thumbnail_url,
        crm.stream_id,
        NULL::numeric AS aspect_ratio,
        NULL::integer AS display_order,
        gc.region_key,
        (SELECT count(*) FROM course_media_likes cml WHERE cml.media_id = crm.id::text)::integer AS likes_count,
        NULL::integer AS duration_seconds
    FROM course_review_media crm
    JOIN course_ratings cr ON cr.id = crm.review_id
    JOIN golf_courses gc ON gc.id = cr.course_id
    WHERE cr.course_id IS NOT NULL
      AND crm.media_url IS NOT NULL
      AND (crm.status IS NULL OR crm.status = 'ready')
)
SELECT * FROM post_moments
UNION ALL
SELECT * FROM review_moments;
