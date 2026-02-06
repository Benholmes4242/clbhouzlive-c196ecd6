-- Phase 4: Create comment_mentions junction table for structural mention storage
-- This enables reliable mention tracking that survives username changes

CREATE TABLE public.comment_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  mentioned_entity_type TEXT NOT NULL CHECK (mentioned_entity_type IN ('user', 'business')),
  mentioned_entity_id UUID NOT NULL,
  mentioned_username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prevent duplicate mentions per comment
CREATE UNIQUE INDEX idx_comment_mentions_unique 
  ON public.comment_mentions (comment_id, mentioned_entity_type, mentioned_entity_id);

-- Fast lookup: "show me all comments that mention this entity"
CREATE INDEX idx_comment_mentions_entity 
  ON public.comment_mentions (mentioned_entity_type, mentioned_entity_id);

-- Fast lookup by comment
CREATE INDEX idx_comment_mentions_comment 
  ON public.comment_mentions (comment_id);

-- Enable Row Level Security
ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;

-- Everyone can read mentions (needed for rendering)
CREATE POLICY "Anyone can read comment mentions"
  ON public.comment_mentions
  FOR SELECT
  USING (true);

-- Only the comment author can insert mentions (via client after submitting comment)
CREATE POLICY "Comment authors can insert mentions"
  ON public.comment_mentions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.post_comments pc
      WHERE pc.id = comment_id
      AND pc.user_id = auth.uid()
    )
  );

-- Only the comment author can delete mentions
CREATE POLICY "Comment authors can delete mentions"
  ON public.comment_mentions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.post_comments pc
      WHERE pc.id = comment_id
      AND pc.user_id = auth.uid()
    )
  );