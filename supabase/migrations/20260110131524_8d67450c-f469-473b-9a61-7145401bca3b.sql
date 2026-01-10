-- College Media Table
-- Stores canonical college metadata and branding for Tour Hub
CREATE TABLE public.college_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_name TEXT NOT NULL,
  normalized_name TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  short_name TEXT,
  country TEXT DEFAULT 'United States',
  source TEXT DEFAULT 'official',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.college_media ENABLE ROW LEVEL SECURITY;

-- Public read access (college data is public)
CREATE POLICY "College media is publicly readable"
ON public.college_media
FOR SELECT
USING (true);

-- Admin-only write access (check admin_memberships)
CREATE POLICY "Admins can manage college media"
ON public.college_media
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_memberships
    WHERE user_id = auth.uid()
  )
);

-- Index for fast lookups by normalized name
CREATE INDEX idx_college_media_normalized_name ON public.college_media(normalized_name);

-- Index for search by college name
CREATE INDEX idx_college_media_college_name ON public.college_media USING gin(to_tsvector('english', college_name));

-- Trigger for updated_at
CREATE TRIGGER update_college_media_updated_at
BEFORE UPDATE ON public.college_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();