-- Add slug column to taggable_entities for URL-friendly filtering
ALTER TABLE public.taggable_entities ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index for slug within entity_type (allows same slug for different types)
CREATE UNIQUE INDEX IF NOT EXISTS idx_taggable_entities_type_slug 
ON public.taggable_entities(entity_type, slug) 
WHERE slug IS NOT NULL;

-- Seed slugs for existing video_category entities
UPDATE public.taggable_entities SET slug = 'funny' WHERE entity_type = 'video_category' AND name = 'Funny';
UPDATE public.taggable_entities SET slug = 'challenges' WHERE entity_type = 'video_category' AND name = 'Challenges';
UPDATE public.taggable_entities SET slug = 'course-vlogs' WHERE entity_type = 'video_category' AND name = 'Course Vlogs';
UPDATE public.taggable_entities SET slug = 'reviews' WHERE entity_type = 'video_category' AND name = 'Reviews';
UPDATE public.taggable_entities SET slug = 'tips' WHERE entity_type = 'video_category' AND name = 'Tips';
UPDATE public.taggable_entities SET slug = 'tour-pro' WHERE entity_type = 'video_category' AND name = 'Tour / Pro';
UPDATE public.taggable_entities SET slug = 'gear' WHERE entity_type = 'video_category' AND name = 'Gear';