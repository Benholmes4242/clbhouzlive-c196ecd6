-- Update any remaining iframe URLs to HLS manifest URLs in database
UPDATE post_media 
SET media_url = REPLACE(
  REPLACE(media_url, 'iframe.videodelivery.net/', 'videodelivery.net/'),
  '/iframe', '/manifest/video.m3u8'
)
WHERE media_url LIKE '%iframe.videodelivery.net%' OR media_url LIKE '%cloudflarestream.com/embed%';

UPDATE profile_media 
SET media_url = REPLACE(
  REPLACE(media_url, 'iframe.videodelivery.net/', 'videodelivery.net/'),
  '/iframe', '/manifest/video.m3u8'
)
WHERE media_url LIKE '%iframe.videodelivery.net%' OR media_url LIKE '%cloudflarestream.com/embed%';

UPDATE course_review_media 
SET media_url = REPLACE(
  REPLACE(media_url, 'iframe.videodelivery.net/', 'videodelivery.net/'),
  '/iframe', '/manifest/video.m3u8'
)
WHERE media_url LIKE '%iframe.videodelivery.net%' OR media_url LIKE '%cloudflarestream.com/embed%';