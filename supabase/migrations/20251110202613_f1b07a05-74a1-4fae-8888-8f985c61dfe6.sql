-- Echo Thread Tags
-- Enables tagging and filtering of conversations

-- Table for conversation tags
CREATE TABLE IF NOT EXISTS public.echo_thread_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.echo_threads(id) ON DELETE CASCADE,
  tag TEXT NOT NULL CHECK (length(tag) BETWEEN 1 AND 32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, thread_id, tag)
);

-- Enable RLS
ALTER TABLE public.echo_thread_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see/manage their own tags
CREATE POLICY "Users can view their own tags"
  ON public.echo_thread_tags
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
  ON public.echo_thread_tags
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON public.echo_thread_tags
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_echo_tags_user ON public.echo_thread_tags(user_id, tag);
CREATE INDEX IF NOT EXISTS idx_echo_tags_thread ON public.echo_thread_tags(user_id, thread_id);

-- RPC: Add tag (case-insensitive, deduplicated)
CREATE OR REPLACE FUNCTION public.echo_tag_add(p_thread UUID, p_tag TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.echo_thread_tags (user_id, thread_id, tag)
  VALUES (auth.uid(), p_thread, trim(lower(p_tag)))
  ON CONFLICT (user_id, thread_id, tag) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Remove tag
CREATE OR REPLACE FUNCTION public.echo_tag_remove(p_thread UUID, p_tag TEXT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.echo_thread_tags
  WHERE user_id = auth.uid()
    AND thread_id = p_thread
    AND tag = trim(lower(p_tag));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;