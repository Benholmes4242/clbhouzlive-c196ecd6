-- Create profile_media table for storing multiple profile media items with header extension metadata
CREATE TABLE public.profile_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT, -- For videos
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Header extension fields
  header_extended_url TEXT, -- For processed images
  header_strip_url TEXT, -- For video tier-1 strips
  header_metadata JSONB DEFAULT '{}', -- Store sourceHash, headerHeightPx, generatedAt, method, etc.
  header_processing_status TEXT DEFAULT 'pending' CHECK (header_processing_status IN ('pending', 'processing', 'completed', 'failed', 'fallback')),
  header_processing_error TEXT,
  
  -- File metadata
  file_name TEXT,
  file_size INTEGER,
  aspect_ratio DECIMAL(5,3), -- width/height ratio
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profile_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile media" 
ON public.profile_media 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile media" 
ON public.profile_media 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile media" 
ON public.profile_media 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile media" 
ON public.profile_media 
FOR DELETE 
USING (auth.uid() = user_id);

-- Public access for viewing profile media (for profile visitors)
CREATE POLICY "Public can view profile media for public profiles" 
ON public.profile_media 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = profile_media.user_id 
    AND up.is_public = true
  )
);

-- Index for efficient queries
CREATE INDEX idx_profile_media_user_id ON public.profile_media(user_id);
CREATE INDEX idx_profile_media_display_order ON public.profile_media(user_id, display_order);
CREATE INDEX idx_profile_media_processing_status ON public.profile_media(header_processing_status) WHERE header_processing_status IN ('pending', 'processing');

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_profile_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_media_updated_at
  BEFORE UPDATE ON public.profile_media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_media_updated_at();

-- Function to limit profile media to 5 items per user
CREATE OR REPLACE FUNCTION public.check_profile_media_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Check if user already has 5 media items
    IF (
      SELECT COUNT(*) 
      FROM public.profile_media 
      WHERE user_id = NEW.user_id
    ) >= 5 THEN
      RAISE EXCEPTION 'Profile media limit of 5 items exceeded';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_profile_media_limit_trigger
  BEFORE INSERT ON public.profile_media
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_media_limit();

-- Function to get mobile detection info
CREATE OR REPLACE FUNCTION public.is_mobile_device()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is a placeholder - actual mobile detection will be done client-side
  -- and passed to the edge function
  RETURN FALSE;
END;
$$;