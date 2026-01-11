-- Drop and recreate explore_moments view to add course_name and likes_count

DROP VIEW IF EXISTS public.explore_moments;

CREATE VIEW public.explore_moments AS
WITH post_moments AS (
  SELECT
    ('post_' || pm.id)                         AS moment_id,
    'post'::text                               AS source_type,
    pm.post_id                                 AS source_id,
    p.course_id                                AS course_id,
    gc.name                                    AS course_name,
    p.user_id                                  AS user_id,
    p.created_at                               AS created_at,

    lower(pm.media_type)                       AS media_type,
    pm.media_url                               AS media_url,
    coalesce(pm.poster_url, pm.media_url)      AS thumbnail_url,
    pm.stream_id                               AS stream_id,
    pm.aspect_ratio                            AS aspect_ratio,
    pm.display_order                           AS display_order,

    gc.region_key                              AS region_key,
    
    -- Likes count from post_likes
    (SELECT COUNT(*) FROM public.post_likes pl WHERE pl.post_id = p.id)::int AS likes_count
  FROM public.post_media pm
  JOIN public.posts p ON p.id = pm.post_id
  JOIN public.golf_courses gc ON gc.id = p.course_id
  WHERE p.course_id IS NOT NULL AND pm.media_url IS NOT NULL
),
review_moments AS (
  SELECT
    ('review_' || crm.id)                      AS moment_id,
    'review'::text                             AS source_type,
    crm.review_id                              AS source_id,
    cr.course_id                               AS course_id,
    gc.name                                    AS course_name,
    cr.user_id                                 AS user_id,
    cr.created_at                              AS created_at,

    lower(crm.media_type)                      AS media_type,
    crm.media_url                              AS media_url,
    coalesce(crm.poster_url, crm.media_url)    AS thumbnail_url,
    crm.stream_id                              AS stream_id,

    NULL::numeric                              AS aspect_ratio,
    NULL::int                                  AS display_order,

    gc.region_key                              AS region_key,
    
    -- Likes count from course_media_likes for reviews (cast UUID to text for comparison)
    (SELECT COUNT(*) FROM public.course_media_likes cml WHERE cml.media_id = crm.id::text)::int AS likes_count
  FROM public.course_review_media crm
  JOIN public.course_ratings cr ON cr.id = crm.review_id
  JOIN public.golf_courses gc ON gc.id = cr.course_id
  WHERE cr.course_id IS NOT NULL
    AND crm.media_url IS NOT NULL
    AND (crm.status IS NULL OR crm.status = 'ready')
)
SELECT * FROM post_moments
UNION ALL
SELECT * FROM review_moments;