-- Remove all tagging-related data and tables

-- First, remove all existing tagging data
TRUNCATE TABLE public.post_tags CASCADE;
TRUNCATE TABLE public.taggable_entities CASCADE;

-- Drop the post_tags table
DROP TABLE public.post_tags CASCADE;

-- Drop the taggable_entities table  
DROP TABLE public.taggable_entities CASCADE;

-- Remove the trigger that creates user taggable entities
DROP TRIGGER IF EXISTS on_user_profile_upsert ON public.user_profiles CASCADE;
DROP FUNCTION IF EXISTS public.create_user_taggable_entity() CASCADE;

-- Remove tag notification functions and triggers
DROP FUNCTION IF EXISTS public.create_tag_notification() CASCADE;

-- Clean up any notification data related to tags
DELETE FROM public.notifications WHERE type = 'tag';