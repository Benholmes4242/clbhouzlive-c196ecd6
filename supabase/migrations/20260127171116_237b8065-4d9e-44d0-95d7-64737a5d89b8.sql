-- One-time fix: Copy media from course_review_media to post_media for review posts missing media
-- This addresses posts created via share-to-clubhouse where media wasn't properly copied

INSERT INTO post_media (post_id, media_type, media_url, poster_url, stream_id, display_order)
SELECT 
  p.id as post_id,
  crm.media_type,
  crm.media_url,
  crm.poster_url,
  crm.stream_id,
  ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY crm.created_at ASC) - 1 as display_order
FROM posts p
JOIN course_review_media crm ON crm.review_id = p.source_review_id
LEFT JOIN post_media pm ON pm.post_id = p.id
WHERE p.source_review_id IS NOT NULL
  AND pm.id IS NULL  -- Only for posts that don't already have media
  AND crm.status = 'attached'
ON CONFLICT DO NOTHING;