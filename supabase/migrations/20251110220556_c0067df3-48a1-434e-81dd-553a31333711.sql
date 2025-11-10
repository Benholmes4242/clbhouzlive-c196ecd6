-- ================================================
-- Echo History Tag Management Schema (Step 1: Tables)
-- ================================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS public.echo_thread_tags CASCADE;
DROP TABLE IF EXISTS public.echo_tags CASCADE;

-- 1. Create echo_tags table (normalized tag vocabulary per user)
CREATE TABLE public.echo_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (trim(name) <> ''),
  name_norm TEXT GENERATED ALWAYS AS (lower(trim(name))) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, name_norm)
);

-- 2. Create echo_thread_tags junction table
CREATE TABLE public.echo_thread_tags (
  thread_id UUID NOT NULL REFERENCES public.echo_threads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.echo_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, tag_id)
);

-- 3. Create indexes for efficient lookups
CREATE INDEX idx_echo_tags_owner_name ON public.echo_tags(owner_id, name_norm);
CREATE INDEX idx_echo_thread_tags_thread ON public.echo_thread_tags(thread_id);
CREATE INDEX idx_echo_thread_tags_tag ON public.echo_thread_tags(tag_id);

-- 4. Enable RLS
ALTER TABLE public.echo_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echo_thread_tags ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for echo_tags
CREATE POLICY "Users can view their own tags"
  ON public.echo_tags FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create their own tags"
  ON public.echo_tags FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own tags"
  ON public.echo_tags FOR DELETE
  USING (owner_id = auth.uid());

-- 6. RLS Policies for echo_thread_tags
CREATE POLICY "Users can view tags on their threads"
  ON public.echo_thread_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.echo_threads t
      WHERE t.id = thread_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add tags to their threads"
  ON public.echo_thread_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.echo_threads t
      WHERE t.id = thread_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tags from their threads"
  ON public.echo_thread_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.echo_threads t
      WHERE t.id = thread_id AND t.user_id = auth.uid()
    )
  );