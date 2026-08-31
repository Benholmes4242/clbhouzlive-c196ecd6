-- Widen the reaction target CHECK from the REAL live list (round, review).
ALTER TABLE public.content_reactions
  DROP CONSTRAINT content_reactions_target_type_check;
ALTER TABLE public.content_reactions
  ADD CONSTRAINT content_reactions_target_type_check
  CHECK (target_type = ANY (ARRAY['round'::text, 'review'::text, 'tour_story'::text, 'amateur_story'::text]));

-- Widen the comment target CHECK from the REAL live list (post, top_ten, editorial).
ALTER TABLE public.comments_v2
  DROP CONSTRAINT comments_v2_target_type_check;
ALTER TABLE public.comments_v2
  ADD CONSTRAINT comments_v2_target_type_check
  CHECK (target_type = ANY (ARRAY['post'::text, 'top_ten'::text, 'editorial'::text, 'tour_story'::text, 'amateur_story'::text]));

CREATE OR REPLACE FUNCTION public.get_story_engagement(
  p_target_type text,
  p_ids uuid[]
)
RETURNS TABLE (
  target_id uuid,
  like_count integer,
  comment_count integer,
  viewer_liked boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    t.id AS target_id,
    (SELECT count(*)::int FROM public.content_reactions r
       WHERE r.target_type = p_target_type AND r.target_id = t.id),
    (SELECT count(*)::int FROM public.comments_v2 c
       WHERE c.target_type = p_target_type AND c.target_id = t.id),
    (auth.uid() IS NOT NULL AND EXISTS (
       SELECT 1 FROM public.content_reactions r
        WHERE r.target_type = p_target_type
          AND r.target_id = t.id
          AND r.user_id = auth.uid()))
  FROM unnest(p_ids) AS t(id);
$$;

GRANT EXECUTE ON FUNCTION public.get_story_engagement(text, uuid[]) TO anon, authenticated;