-- Insert PGA Riviera Maya golf course with the uploaded image
INSERT INTO public.golf_courses (name, country, country_code, continent, thumbnail_image)
VALUES (
  'PGA Riviera Maya',
  'Mexico',
  'MX',
  'North America',
  'https://ybxkehyomcakqjvuhnna.supabase.co/storage/v1/object/public/course-images/pga-riviera-maya.jpg'
)
ON CONFLICT DO NOTHING;

-- Map the SR venue name to this golf course for the image resolver
INSERT INTO public.sr_course_map (sr_venue_name, sr_venue_course_name, golf_course_id, confidence, source)
SELECT 
  'PGA Riviera Maya',
  'PGA Riviera Maya',
  id,
  1.0,
  'manual'
FROM public.golf_courses
WHERE name = 'PGA Riviera Maya'
LIMIT 1
ON CONFLICT (sr_venue_name) DO UPDATE SET
  golf_course_id = EXCLUDED.golf_course_id,
  confidence = EXCLUDED.confidence,
  source = EXCLUDED.source;