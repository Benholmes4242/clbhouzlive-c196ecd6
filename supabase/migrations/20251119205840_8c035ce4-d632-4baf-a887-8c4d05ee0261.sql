-- Fix achievement_type column issue in user_achievements table
-- This migration adds the achievement_type column if it doesn't exist,
-- ensuring that triggers or RPC functions that reference it won't fail

-- Add achievement_type column to user_achievements if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_achievements' 
    AND column_name = 'achievement_type'
  ) THEN
    ALTER TABLE public.user_achievements
      ADD COLUMN achievement_type text;
    
    -- Add a comment to document the column
    COMMENT ON COLUMN public.user_achievements.achievement_type IS 
      'Type of achievement (e.g., top100_course, milestone, badge)';
  END IF;
END $$;