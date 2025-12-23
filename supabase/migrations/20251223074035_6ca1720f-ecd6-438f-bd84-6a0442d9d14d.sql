-- OPTIMIZATION 2: Add index for faster video posts queries
-- This index optimizes the common query pattern: type='video' ordered by created_at DESC

-- Index for posts with video media type and aspect ratio filtering (covers Clubhouse queries)
CREATE INDEX IF NOT EXISTS idx_post_media_video_vertical 
ON post_media(media_type, duration_seconds, aspect_ratio, created_at DESC) 
WHERE media_type = 'video';

-- Composite index for posts ordered by created_at (covers cursor pagination)
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc 
ON posts(created_at DESC);

-- Index for the inner join between posts and post_media
CREATE INDEX IF NOT EXISTS idx_post_media_post_id_created 
ON post_media(post_id, created_at DESC);