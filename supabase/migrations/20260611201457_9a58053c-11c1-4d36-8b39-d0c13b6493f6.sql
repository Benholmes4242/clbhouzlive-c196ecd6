ALTER TABLE public.gam_course_legends
  DROP CONSTRAINT IF EXISTS gam_course_legends_category_check;

ALTER TABLE public.gam_course_legends
  ADD CONSTRAINT gam_course_legends_category_check
  CHECK (category = ANY (ARRAY[
    'lowest_gross_90d'::text,         'lowest_gross_all_time'::text,
    'best_score_diff_90d'::text,      'best_score_diff_all_time'::text,
    'most_birdies_90d'::text,         'most_birdies_all_time'::text,
    'best_stableford_90d'::text,      'best_stableford_all_time'::text,
    'most_eagles_90d'::text,          'most_eagles_all_time'::text,
    'most_aces_90d'::text,            'most_aces_all_time'::text,
    'most_albatrosses_90d'::text,     'most_albatrosses_all_time'::text,
    'most_rounds_90d'::text,          'most_rounds_all_time'::text
  ]));