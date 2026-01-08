-- ============================================
-- Explore Page Phase 1: region_key + explore_moments view
-- ============================================

-- 2.1 Add region_key to golf_courses
ALTER TABLE public.golf_courses
ADD COLUMN IF NOT EXISTS region_key text;

ALTER TABLE public.golf_courses
ADD CONSTRAINT golf_courses_region_key_check
CHECK (region_key IN ('GBI','EU','USA','ROW')) NOT VALID;

ALTER TABLE public.golf_courses
VALIDATE CONSTRAINT golf_courses_region_key_check;

-- 2.2 Backfill region_key (continent enum values include "Europe")
UPDATE public.golf_courses
SET region_key =
  CASE
    WHEN lower(country) IN (
      'united kingdom','uk','u.k.','great britain','britain',
      'england','scotland','wales','northern ireland',
      'ireland','republic of ireland','eire'
    ) THEN 'GBI'
    WHEN lower(country) IN (
      'united states','united states of america','usa','u.s.a.','us','u.s.'
    ) THEN 'USA'
    WHEN continent = 'Europe' THEN 'EU'
    ELSE 'ROW'
  END
WHERE region_key IS NULL;

-- 2.3 Indexes (performance)
CREATE INDEX IF NOT EXISTS idx_golf_courses_region_key ON public.golf_courses(region_key);
CREATE INDEX IF NOT EXISTS idx_golf_courses_region_rank ON public.golf_courses(region_key, global_rank ASC);

CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON public.post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_course_review_media_review_id ON public.course_review_media(review_id);

CREATE INDEX IF NOT EXISTS idx_posts_course_created ON public.posts(course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_ratings_course_created ON public.course_ratings(course_id, created_at DESC);

-- 2.4 Create unified view explore_moments
CREATE OR REPLACE VIEW public.explore_moments AS
WITH post_moments AS (
  SELECT
    ('post_' || pm.id)                         AS moment_id,
    'post'::text                               AS source_type,
    pm.post_id                                 AS source_id,
    p.course_id                                AS course_id,
    p.user_id                                  AS user_id,
    p.created_at                               AS created_at,

    lower(pm.media_type)                       AS media_type,
    pm.media_url                               AS media_url,
    coalesce(pm.poster_url, pm.media_url)      AS thumbnail_url,
    pm.stream_id                               AS stream_id,
    pm.aspect_ratio                            AS aspect_ratio,
    pm.display_order                           AS display_order,

    gc.region_key                              AS region_key
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
    cr.user_id                                 AS user_id,
    cr.created_at                              AS created_at,

    lower(crm.media_type)                      AS media_type,
    crm.media_url                              AS media_url,
    coalesce(crm.poster_url, crm.media_url)    AS thumbnail_url,
    crm.stream_id                              AS stream_id,

    NULL::numeric                              AS aspect_ratio,
    NULL::int                                  AS display_order,

    gc.region_key                              AS region_key
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