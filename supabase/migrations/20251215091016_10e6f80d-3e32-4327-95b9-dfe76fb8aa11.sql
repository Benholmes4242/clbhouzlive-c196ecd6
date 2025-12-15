-- Phase 3.2: Add featured_post_id and pinned_post_ids for Creator Mode

-- Add featured_post_id column for featured video slot
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS featured_post_id uuid REFERENCES posts(id) ON DELETE SET NULL;

-- Add pinned_post_ids array for pinned posts (max 3)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS pinned_post_ids uuid[] DEFAULT '{}';

-- Create index for efficient featured post lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_featured_post 
ON public.user_profiles(featured_post_id) 
WHERE featured_post_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.featured_post_id IS 'The post ID to feature at the top of creator profiles';
COMMENT ON COLUMN public.user_profiles.pinned_post_ids IS 'Array of up to 3 post IDs to pin at the top of creator content grid';