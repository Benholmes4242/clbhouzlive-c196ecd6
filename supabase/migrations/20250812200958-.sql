-- Add pinned achievements functionality to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN show_achievements_public BOOLEAN DEFAULT true,
ADD COLUMN pinned_achievement_ids TEXT[] DEFAULT '{}';

-- Add comments for the new columns
COMMENT ON COLUMN public.user_profiles.show_achievements_public IS 'Whether to show achievements publicly on profile';
COMMENT ON COLUMN public.user_profiles.pinned_achievement_ids IS 'Array of pinned achievement IDs (max 4)';