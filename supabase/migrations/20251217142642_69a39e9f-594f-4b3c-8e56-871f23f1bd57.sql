-- Phase 1: business_tag_visibility table for hiding tagged posts
CREATE TABLE public.business_tag_visibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  hidden_by UUID REFERENCES auth.users(id),
  hidden_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, post_id)
);

-- Enable RLS
ALTER TABLE public.business_tag_visibility ENABLE ROW LEVEL SECURITY;

-- Policies: business admins can manage visibility
CREATE POLICY "Business admins can manage tag visibility"
ON public.business_tag_visibility
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM business_members bm
    WHERE bm.business_id = business_tag_visibility.business_id
    AND bm.user_profile_id = auth.uid()
    AND bm.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM business_members bm
    WHERE bm.business_id = business_tag_visibility.business_id
    AND bm.user_profile_id = auth.uid()
    AND bm.role IN ('owner', 'admin')
  )
);

-- Phase 2: Add pinned post columns to posts table
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES auth.users(id);

-- Phase 4: post_views table for insights
CREATE TABLE public.post_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views (even anonymous)
CREATE POLICY "Anyone can insert post views"
ON public.post_views
FOR INSERT
WITH CHECK (true);

-- Post authors and business admins can read views for their posts
CREATE POLICY "Post authors can read views"
ON public.post_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM posts p
    WHERE p.id = post_views.post_id
    AND (
      p.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = p.actor_id
        AND bm.user_profile_id = auth.uid()
        AND bm.role IN ('owner', 'admin')
      )
    )
  )
);

-- Index for efficient querying
CREATE INDEX idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX idx_post_views_created_at ON public.post_views(created_at);
CREATE INDEX idx_business_tag_visibility_business_post ON public.business_tag_visibility(business_id, post_id);
CREATE INDEX idx_posts_pinned ON public.posts(actor_id, is_pinned) WHERE is_pinned = true;