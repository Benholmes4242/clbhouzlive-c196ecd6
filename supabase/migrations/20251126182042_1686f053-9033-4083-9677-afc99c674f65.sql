-- Create course_media_likes table for media helpful/like functionality
CREATE TABLE IF NOT EXISTS public.course_media_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_media_user_like UNIQUE (media_id, user_id)
);

-- Enable RLS
ALTER TABLE public.course_media_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all likes
CREATE POLICY "Anyone can view media likes"
  ON public.course_media_likes
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own likes
CREATE POLICY "Users can like media"
  ON public.course_media_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own likes
CREATE POLICY "Users can unlike media"
  ON public.course_media_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_likes_media_id ON public.course_media_likes(media_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_user_id ON public.course_media_likes(user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_course_media_likes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_media_likes_updated_at
  BEFORE UPDATE ON public.course_media_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_media_likes_updated_at();