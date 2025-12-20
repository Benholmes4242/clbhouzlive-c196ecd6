-- Extend entity_type check constraint to include video_category
-- This enables category filtering for long-form videos

-- Drop existing constraint
ALTER TABLE public.taggable_entities DROP CONSTRAINT taggable_entities_entity_type_check;

-- Add new constraint with video_category included
ALTER TABLE public.taggable_entities ADD CONSTRAINT taggable_entities_entity_type_check
  CHECK (entity_type = ANY (ARRAY['user'::text, 'golf_club'::text, 'business'::text, 'video_category'::text]));

-- Seed video categories
INSERT INTO public.taggable_entities (entity_type, entity_id, name)
VALUES
  ('video_category', gen_random_uuid(), 'Funny'),
  ('video_category', gen_random_uuid(), 'Challenges'),
  ('video_category', gen_random_uuid(), 'Course Vlogs'),
  ('video_category', gen_random_uuid(), 'Reviews'),
  ('video_category', gen_random_uuid(), 'Tips'),
  ('video_category', gen_random_uuid(), 'Tour / Pro'),
  ('video_category', gen_random_uuid(), 'Gear')
ON CONFLICT DO NOTHING;