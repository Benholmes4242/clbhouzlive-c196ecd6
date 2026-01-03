-- Add fields to support upload-on-select for review videos with cleanup
-- status: 'pending' (uploaded, not attached) | 'attached' (linked to review) | 'failed'
-- upload_session_id: ties selected videos in one modal session for cleanup
-- owner_user_id: used for permission checks and cleanup safety

-- Add status column with default 'attached' for existing records
ALTER TABLE public.course_review_media 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'attached';

-- Add upload_session_id for tracking modal sessions
ALTER TABLE public.course_review_media 
ADD COLUMN IF NOT EXISTS upload_session_id text;

-- Add owner_user_id for permission checks
ALTER TABLE public.course_review_media 
ADD COLUMN IF NOT EXISTS owner_user_id uuid;

-- Create index for cleanup queries (pending videos older than 24h)
CREATE INDEX IF NOT EXISTS idx_course_review_media_pending_cleanup 
ON public.course_review_media (status, created_at) 
WHERE status = 'pending';

-- Create index for session-based lookups
CREATE INDEX IF NOT EXISTS idx_course_review_media_session 
ON public.course_review_media (upload_session_id) 
WHERE upload_session_id IS NOT NULL;

-- Update RLS policies to allow pending video management

-- Policy: Users can insert their own pending videos (before review is created)
CREATE POLICY "Users can insert their own pending media" 
ON public.course_review_media 
FOR INSERT 
WITH CHECK (
  auth.uid() = owner_user_id OR 
  (owner_user_id IS NULL AND review_id IS NOT NULL)
);

-- Policy: Users can update their own pending media to attach to review
CREATE POLICY "Users can update their own pending media" 
ON public.course_review_media 
FOR UPDATE 
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

-- Policy: Users can delete their own pending media (cleanup)
CREATE POLICY "Users can delete their own pending media" 
ON public.course_review_media 
FOR DELETE 
USING (auth.uid() = owner_user_id OR status = 'pending');

-- Policy: Anyone can select media (for public review display)
CREATE POLICY "Anyone can view review media" 
ON public.course_review_media 
FOR SELECT 
USING (true);