-- Phase 2: Personal course ranking infrastructure
-- Stores a per-user custom ordering of their rated courses.

CREATE TABLE public.user_course_personal_rank (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.golf_courses(id) ON DELETE CASCADE,
  personal_rank integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);

CREATE INDEX idx_user_course_personal_rank_user_rank
  ON public.user_course_personal_rank(user_id, personal_rank);

ALTER TABLE public.user_course_personal_rank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own personal ranks"
  ON public.user_course_personal_rank FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personal ranks"
  ON public.user_course_personal_rank FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal ranks"
  ON public.user_course_personal_rank FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own personal ranks"
  ON public.user_course_personal_rank FOR DELETE
  USING (auth.uid() = user_id);

-- Seed function: on first entry into "My Order", populate ranks 1..N
-- using the canonical own-rating cascade so the user's first view of
-- My Order matches the rating-sorted order they were just looking at.
CREATE OR REPLACE FUNCTION public.seed_user_personal_ranks(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Cannot seed another user''s personal rank order';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_course_personal_rank WHERE user_id = p_user_id) THEN
    RETURN;
  END IF;

  INSERT INTO public.user_course_personal_rank (user_id, course_id, personal_rank)
  SELECT
    p_user_id,
    cr.course_id,
    ROW_NUMBER() OVER (
      ORDER BY
        cr.rating DESC NULLS LAST,
        (COALESCE(cr.design_score, 0) + COALESCE(cr.condition_score, 0)
          + COALESCE(cr.clubhouse_score, 0) + COALESCE(cr.facilities_score, 0)) DESC,
        cr.review_date DESC NULLS LAST,
        cr.course_id ASC
    ) AS personal_rank
  FROM public.course_ratings cr
  WHERE cr.user_id = p_user_id;
END;
$$;

-- Bulk reorder RPC: replaces personal_rank for the supplied ordered array.
CREATE OR REPLACE FUNCTION public.update_user_personal_rank_order(
  p_user_id uuid,
  p_ordered_course_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Cannot update another user''s personal rank order';
  END IF;

  INSERT INTO public.user_course_personal_rank (user_id, course_id, personal_rank, updated_at)
  SELECT
    p_user_id,
    course_id,
    rn::int,
    now()
  FROM UNNEST(p_ordered_course_ids) WITH ORDINALITY AS t(course_id, rn)
  ON CONFLICT (user_id, course_id) DO UPDATE
    SET personal_rank = EXCLUDED.personal_rank,
        updated_at    = EXCLUDED.updated_at;
END;
$$;