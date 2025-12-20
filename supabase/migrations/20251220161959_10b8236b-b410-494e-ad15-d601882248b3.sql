-- Create video_progress table for tracking watch progress on long-form videos
CREATE TABLE public.video_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  last_position_seconds integer NOT NULL DEFAULT 0,
  duration_seconds integer NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT video_progress_user_post_unique UNIQUE (user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own progress
CREATE POLICY "Users can view their own video progress"
ON public.video_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own video progress"
ON public.video_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own video progress"
ON public.video_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own progress
CREATE POLICY "Users can delete their own video progress"
ON public.video_progress
FOR DELETE
USING (auth.uid() = user_id);

-- Index for efficient lookups
CREATE INDEX idx_video_progress_user_updated ON public.video_progress(user_id, updated_at DESC);