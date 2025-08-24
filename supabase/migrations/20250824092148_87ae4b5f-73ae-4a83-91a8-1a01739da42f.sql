-- Remove posts with broken R2 image URLs
-- First, let's identify and delete post media entries for images from R2
DELETE FROM post_media 
WHERE media_type = 'image' 
AND media_url LIKE '%media.clbhouz.co.uk%';

-- Clean up any posts that no longer have any media after the above deletion
DELETE FROM posts 
WHERE id NOT IN (
  SELECT DISTINCT post_id 
  FROM post_media
) AND id IN (
  -- Only delete posts that previously had media (to avoid deleting text-only posts)
  SELECT DISTINCT p.id 
  FROM posts p
  JOIN post_comments pc ON p.id = pc.post_id
  WHERE pc.content LIKE '%image%' OR pc.content LIKE '%photo%'
  UNION
  SELECT DISTINCT p.id
  FROM posts p  
  WHERE p.content IS NULL OR trim(p.content) = ''
);

-- Also clean up related data for posts that no longer exist
DELETE FROM post_tags WHERE post_id NOT IN (SELECT id FROM posts);
DELETE FROM post_likes WHERE post_id NOT IN (SELECT id FROM posts);
DELETE FROM post_comments WHERE post_id NOT IN (SELECT id FROM posts);
DELETE FROM post_shares WHERE post_id NOT IN (SELECT id FROM posts);