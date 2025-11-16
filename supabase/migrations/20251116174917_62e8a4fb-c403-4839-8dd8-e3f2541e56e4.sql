-- Create user_top_ten_courses table for normalized Top 10 management
CREATE TABLE IF NOT EXISTS public.user_top_ten_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.golf_courses(id) ON DELETE CASCADE,
  position INT NOT NULL CHECK (position >= 1 AND position <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id),
  UNIQUE (user_id, position)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_top_ten_user_id
  ON public.user_top_ten_courses(user_id);

CREATE INDEX IF NOT EXISTS idx_user_top_ten_course_id
  ON public.user_top_ten_courses(course_id);

-- RLS policies
ALTER TABLE public.user_top_ten_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view top 10" ON public.user_top_ten_courses;
CREATE POLICY "Users can view top 10"
  ON public.user_top_ten_courses
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage their own top 10" ON public.user_top_ten_courses;
CREATE POLICY "Users can manage their own top 10"
  ON public.user_top_ten_courses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Helper view
CREATE OR REPLACE VIEW public.user_top_ten_courses_view AS
SELECT
  utt.id,
  utt.user_id,
  utt.course_id,
  utt.position,
  utt.created_at,
  utt.updated_at,
  gc.name,
  gc.country,
  gc.sub_country,
  gc.region,
  gc.thumbnail_image,
  gc.global_rank,
  gc.regional_rank,
  gc.usa_rank
FROM public.user_top_ten_courses utt
JOIN public.golf_courses gc ON gc.id = utt.course_id
ORDER BY utt.user_id, utt.position;