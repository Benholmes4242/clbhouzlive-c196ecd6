-- Remove all tagging-related data and tables

-- First, remove all existing tagging data
DELETE FROM public.post_tags;
DELETE FROM public.taggable_entities;

-- Drop the post_tags table
DROP TABLE IF EXISTS public.post_tags CASCADE;

-- Drop the taggable_entities table  
DROP TABLE IF EXISTS public.taggable_entities CASCADE;

-- Remove the trigger that creates user taggable entities
DROP TRIGGER IF EXISTS create_user_taggable_entity_trigger ON public.user_profiles;
DROP FUNCTION IF EXISTS public.create_user_taggable_entity();

-- Remove tag notification functions and triggers
DROP TRIGGER IF EXISTS post_tag_notification_trigger ON public.post_tags;
DROP FUNCTION IF EXISTS public.create_tag_notification();

-- Clean up any notification data related to tags
DELETE FROM public.notifications WHERE type = 'tag';