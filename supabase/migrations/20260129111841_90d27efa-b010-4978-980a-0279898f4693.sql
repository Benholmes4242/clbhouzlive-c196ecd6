-- Phase 1.1: Create junction table for multi-course tagging
CREATE TABLE public.post_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.golf_courses(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate course tags on same post
  UNIQUE(post_id, course_id)
);

-- Index for fast lookups
CREATE INDEX idx_post_courses_post_id ON public.post_courses(post_id);
CREATE INDEX idx_post_courses_course_id ON public.post_courses(course_id);

-- Enable RLS
ALTER TABLE public.post_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (match posts table policies)
CREATE POLICY "Anyone can view post_courses" ON public.post_courses
  FOR SELECT USING (true);

CREATE POLICY "Users can insert post_courses for own posts" ON public.post_courses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete post_courses for own posts" ON public.post_courses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
  );

-- Phase 1.2: Migrate existing course_id data to junction table
INSERT INTO public.post_courses (post_id, course_id, display_order)
SELECT id, course_id, 0
FROM public.posts
WHERE course_id IS NOT NULL;