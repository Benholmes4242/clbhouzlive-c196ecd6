-- =====================================================
-- POST DRAFTS SYSTEM
-- Database-backed drafts with media storage
-- =====================================================

-- Create post_drafts table for storing draft posts
CREATE TABLE public.post_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_type TEXT DEFAULT 'personal' CHECK (actor_type IN ('personal', 'creator', 'business')),
  actor_id UUID NOT NULL,
  content TEXT,
  visibility TEXT DEFAULT 'anyone' CHECK (visibility IN ('anyone', 'followers', 'private')),
  categories TEXT[] DEFAULT '{}',
  badges TEXT[] DEFAULT '{}',
  course_id UUID REFERENCES public.golf_courses(id) ON DELETE SET NULL,
  course_name TEXT,
  course_country TEXT,
  studio_music JSONB,
  audio_mode TEXT CHECK (audio_mode IN ('original', 'music_only')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post_draft_media table for storing draft media references
CREATE TABLE public.post_draft_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES public.post_drafts(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  stream_id TEXT,
  poster_url TEXT,
  width INTEGER,
  height INTEGER,
  aspect_ratio NUMERIC,
  duration_seconds INTEGER,
  studio_edits JSONB,
  filter_id TEXT,
  display_order INTEGER DEFAULT 0,
  file_name TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_post_drafts_user_id ON public.post_drafts(user_id);
CREATE INDEX idx_post_drafts_updated_at ON public.post_drafts(updated_at DESC);
CREATE INDEX idx_post_draft_media_draft_id ON public.post_draft_media(draft_id);

-- Enable RLS
ALTER TABLE public.post_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_draft_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_drafts
-- Users can view their own drafts
CREATE POLICY "Users can view their own drafts"
  ON public.post_drafts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own drafts
CREATE POLICY "Users can create their own drafts"
  ON public.post_drafts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own drafts
CREATE POLICY "Users can update their own drafts"
  ON public.post_drafts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own drafts
CREATE POLICY "Users can delete their own drafts"
  ON public.post_drafts
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for post_draft_media
-- Users can view media for their own drafts
CREATE POLICY "Users can view their draft media"
  ON public.post_draft_media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.post_drafts
      WHERE post_drafts.id = post_draft_media.draft_id
      AND post_drafts.user_id = auth.uid()
    )
  );

-- Users can insert media for their own drafts
CREATE POLICY "Users can insert their draft media"
  ON public.post_draft_media
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.post_drafts
      WHERE post_drafts.id = post_draft_media.draft_id
      AND post_drafts.user_id = auth.uid()
    )
  );

-- Users can update media for their own drafts
CREATE POLICY "Users can update their draft media"
  ON public.post_draft_media
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.post_drafts
      WHERE post_drafts.id = post_draft_media.draft_id
      AND post_drafts.user_id = auth.uid()
    )
  );

-- Users can delete media for their own drafts
CREATE POLICY "Users can delete their draft media"
  ON public.post_draft_media
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.post_drafts
      WHERE post_drafts.id = post_draft_media.draft_id
      AND post_drafts.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_post_draft_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on drafts
CREATE TRIGGER update_post_drafts_updated_at
  BEFORE UPDATE ON public.post_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_draft_updated_at();

-- Also update parent draft when media changes
CREATE OR REPLACE FUNCTION public.touch_draft_on_media_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.post_drafts 
  SET updated_at = NOW() 
  WHERE id = COALESCE(NEW.draft_id, OLD.draft_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER touch_draft_on_media_insert
  AFTER INSERT ON public.post_draft_media
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_draft_on_media_change();

CREATE TRIGGER touch_draft_on_media_update
  AFTER UPDATE ON public.post_draft_media
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_draft_on_media_change();

CREATE TRIGGER touch_draft_on_media_delete
  AFTER DELETE ON public.post_draft_media
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_draft_on_media_change();