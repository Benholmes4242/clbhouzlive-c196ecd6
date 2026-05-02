-- Per-(friend, course) best adjusted_gross over the last 90 days.
CREATE OR REPLACE VIEW public.whs_friend_course_bests AS
SELECT DISTINCT ON (s.connection_id, s.course_id)
  s.connection_id   AS friend_connection_id,
  s.course_id,
  s.adjusted_gross  AS best_gross,
  s.id              AS best_score_id,
  s.play_date       AS best_play_date
FROM public.whs_scores s
WHERE
  s.adjusted_gross IS NOT NULL
  AND s.course_id IS NOT NULL
  AND s.play_date >= (now() - interval '90 days')
ORDER BY
  s.connection_id,
  s.course_id,
  s.adjusted_gross ASC,
  s.play_date DESC;

GRANT SELECT ON public.whs_friend_course_bests TO authenticated;