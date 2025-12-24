-- Phase 1A: Add soft delete support
-- Phase 2: Add creator_only support

-- Add deleted_at column for soft delete
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Add creator_only column for creator-only mode
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS creator_only boolean NOT NULL DEFAULT false;

-- Create index for efficient filtering of non-deleted users
CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted_at ON public.user_profiles (deleted_at) WHERE deleted_at IS NULL;

-- Create index for creator_only queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_creator_only ON public.user_profiles (creator_only) WHERE creator_only = true;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.deleted_at IS 'Soft delete timestamp. When set, user is considered deleted but data is preserved for referential integrity.';
COMMENT ON COLUMN public.user_profiles.creator_only IS 'When true, personal profile is hidden and only creator page is visible.';