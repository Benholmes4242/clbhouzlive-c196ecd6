-- Remove all tagging-related data and tables

-- First, remove all existing tagging data
DELETE FROM public.post_tags;
DELETE FROM public.taggable_entities;

-- Drop the post_tags table
DROP TABLE IF EXISTS public.post_tags CASCADE;

-- Drop the taggable_entities table  
DROP TABLE IF EXISTS public.taggable_entities CASCADE;

-- Remove the trigger that creates user taggable entities (with CASCADE)
DROP TRIGGER IF EXISTS create_user_taggable_entity_trigger ON public.user_profiles CASCADE;
DROP TRIGGER IF EXISTS on_user_profile_upsert ON public.user_profiles CASCADE;
DROP FUNCTION IF EXISTS public.create_user_taggable_entity() CASCADE;

-- Remove tag notification functions and triggers
DROP TRIGGER IF EXISTS post_tag_notification_trigger ON public.post_tags CASCADE;
DROP FUNCTION IF EXISTS public.create_tag_notification() CASCADE;

-- Clean up any notification data related to tags
DELETE FROM public.notifications WHERE type = 'tag';