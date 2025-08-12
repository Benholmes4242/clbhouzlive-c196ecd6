-- Fix security issues with user_bag and taggable_entities tables

-- First, let's update the taggable_entities RLS policy to be more restrictive
-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Everyone can view taggable entities" ON public.taggable_entities;

-- Create more secure policies for taggable_entities
-- Users can view their own entities
CREATE POLICY "Users can view their own entities" 
ON public.taggable_entities 
FOR SELECT 
USING (
  CASE 
    WHEN entity_type IN ('user', 'business') THEN 
      entity_id = auth.uid()
    ELSE false
  END
);

-- Public can view entities from public profiles only
CREATE POLICY "Public can view entities from public profiles" 
ON public.taggable_entities 
FOR SELECT 
USING (
  CASE 
    WHEN entity_type IN ('user', 'business') THEN 
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = entity_id 
        AND is_public = true
      )
    WHEN entity_type = 'golf_club' THEN 
      true  -- Golf clubs remain public as they're venues
    ELSE false
  END
);

-- Add additional security to user_bag table
-- Update the existing policy to be more specific about bag visibility
DROP POLICY IF EXISTS "Public profiles bags are viewable" ON public.user_bag;

-- Create a more restrictive policy for viewing other users' bags
CREATE POLICY "Public can view bags from public profiles with bag visibility enabled" 
ON public.user_bag 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = user_bag.user_id 
    AND is_public = true 
    AND bag_visible = true
  )
  AND auth.uid() != user_id  -- This ensures it's not the user viewing their own bag
);

-- The existing "Users can view their own bag" policy remains unchanged