-- 1. Duplicate partial index on posts(whs_score_id): identical definitions,
-- neither UNIQUE, neither backing a constraint. Keep idx_posts_whs_score_id.
DROP INDEX IF EXISTS public.posts_whs_score_id_idx;

-- 2. Retire the dead round-reaction path (0 rows, no writer, no callers).
DROP FUNCTION IF EXISTS public.toggle_whs_round_reaction(uuid, text);
DROP TABLE IF EXISTS public.whs_round_reactions;

-- 3. Standing assertion: a round post's like_count must equal
-- (content_reactions round rows) + (post_likes rows for business actors).
CREATE OR REPLACE VIEW public.round_post_like_count_drift AS
SELECT
  p.id                AS post_id,
  p.user_id,
  p.whs_score_id,
  COALESCE(p.like_count, 0) AS stored_like_count,
  cr.n                AS content_reaction_count,
  bl.n                AS business_post_like_count,
  cr.n + bl.n         AS expected_like_count
FROM public.posts p
CROSS JOIN LATERAL (
  SELECT COUNT(*)::int AS n
  FROM public.content_reactions r
  WHERE r.target_type = 'round'
    AND r.target_id = p.whs_score_id
) cr
CROSS JOIN LATERAL (
  SELECT COUNT(*)::int AS n
  FROM public.post_likes l
  WHERE l.post_id = p.id
    AND l.actor_type = 'business'
) bl
WHERE p.whs_score_id IS NOT NULL
  AND COALESCE(p.like_count, 0) <> cr.n + bl.n;

COMMENT ON VIEW public.round_post_like_count_drift IS
  'Assertion: must return zero rows. Any round post whose posts.like_count disagrees with (content_reactions target_type=round) + (post_likes actor_type=business). Guards the two complementary trigger sets: recount_round_post_likes vs posts_increment/decrement_like_count (whs_score_id IS NULL).';

GRANT SELECT ON public.round_post_like_count_drift TO service_role;