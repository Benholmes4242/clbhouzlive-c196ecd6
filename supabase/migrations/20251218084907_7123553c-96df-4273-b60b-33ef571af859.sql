-- Add unique constraint for pending access requests (de-dupe per user/business)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_access_request_pending
ON public.business_access_requests (business_id, requester_user_profile_id)
WHERE status = 'pending';

-- Add decided_at and decided_by columns for approval tracking
ALTER TABLE public.business_access_requests 
ADD COLUMN IF NOT EXISTS decided_at timestamptz,
ADD COLUMN IF NOT EXISTS decided_by uuid REFERENCES public.user_profiles(id);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_bar_status ON public.business_access_requests(status);