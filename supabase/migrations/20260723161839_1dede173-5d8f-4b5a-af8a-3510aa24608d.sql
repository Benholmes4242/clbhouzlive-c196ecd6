
-- 1. Add logic_version to ai_predictions for cache invalidation
ALTER TABLE public.ai_predictions
  ADD COLUMN IF NOT EXISTS logic_version integer NOT NULL DEFAULT 0;

-- 2. Delete flat-50 placeholder rows in course_dna_profiles.
--    Predicate matches ONLY rows where every one of the 9 importance fields
--    equals 50 — genuine or near-genuine profiles (e.g. The Glen Club, which
--    has scrambling_importance = 9) are intentionally preserved for manual review.
DELETE FROM public.course_dna_profiles
WHERE driving_distance_importance = 50
  AND driving_accuracy_importance = 50
  AND gir_importance = 50
  AND scrambling_importance = 50
  AND putting_importance = 50
  AND sg_off_tee_importance = 50
  AND sg_approach_importance = 50
  AND sg_around_green_importance = 50
  AND sg_putting_importance = 50;
