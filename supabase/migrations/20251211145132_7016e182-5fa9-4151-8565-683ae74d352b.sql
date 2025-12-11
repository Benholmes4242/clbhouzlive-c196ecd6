-- PHASE 3: Add soft delete columns to business_accounts
ALTER TABLE public.business_accounts
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Create index for efficient filtering of non-deleted businesses
CREATE INDEX IF NOT EXISTS idx_business_accounts_not_deleted 
ON public.business_accounts(id) 
WHERE is_deleted = false;

-- PHASE 2: Create business_follows table for business profile followers
CREATE TABLE IF NOT EXISTS public.business_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, business_id)
);

-- Enable RLS
ALTER TABLE public.business_follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_follows
CREATE POLICY "Anyone can view business follows"
ON public.business_follows FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can follow businesses"
ON public.business_follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow businesses"
ON public.business_follows FOR DELETE
USING (auth.uid() = follower_id);

-- Create index for efficient follower counts
CREATE INDEX IF NOT EXISTS idx_business_follows_business_id ON public.business_follows(business_id);
CREATE INDEX IF NOT EXISTS idx_business_follows_follower_id ON public.business_follows(follower_id);