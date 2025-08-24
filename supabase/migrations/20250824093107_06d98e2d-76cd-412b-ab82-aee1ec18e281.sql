-- Update the specific post's video URL to use Cloudflare Stream
UPDATE post_media 
SET media_url = 'https://customer-4ah4gni80ytefpck.cloudflarestream.com/037eaa0b2d9f4eb08bba7119075b1cc7/manifest/video.m3u8'
WHERE id = '92d573a1-e525-4fe9-a7d3-735f5197a9a7';