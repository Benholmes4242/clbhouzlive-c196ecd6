-- Remove all posts that contain video media
-- This will cascade to remove associated post_media, post_tags, and other related data

DELETE FROM posts 
WHERE id IN (
  SELECT DISTINCT post_id 
  FROM post_media 
  WHERE media_type = 'video'
);

-- Clean up any orphaned post_media records (shouldn't be any due to cascading, but good practice)
DELETE FROM post_media 
WHERE media_type = 'video';

-- Clean up any orphaned post_tags that might reference deleted posts
DELETE FROM post_tags 
WHERE post_id NOT IN (SELECT id FROM posts);