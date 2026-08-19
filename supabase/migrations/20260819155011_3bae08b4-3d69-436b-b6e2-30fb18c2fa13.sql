CREATE OR REPLACE VIEW public.sr_tournament_course_resolution AS
WITH tok AS (
  SELECT t.id AS tournament_id,
         btrim(t.venue_name) AS venue_name,
         NULLIF(btrim(t.venue_course_name), '') AS venue_course_name,
         lower(regexp_replace(COALESCE(t.venue_name, ''), '[^a-z0-9 ]', ' ', 'gi')) AS venue_norm,
         (SELECT array_agg(w.w)
            FROM unnest(regexp_split_to_array(lower(regexp_replace(COALESCE(NULLIF(btrim(t.venue_course_name), ''), ''), '[^a-z0-9 ]', ' ', 'gi')), '\s+')) w(w)
           WHERE w.w <> ''
             AND w.w <> ALL (ARRAY['golf','club','clubs','course','courses','country','the','at','of','and','a','resort','spa','cc','gc','links','championship','tournament','lodge','no'])
         ) AS course_tokens
    FROM public.sr_tournaments t
   WHERE t.venue_name IS NOT NULL
), m AS (
  SELECT sr_course_map.golf_course_id,
         lower(btrim(sr_course_map.sr_venue_name)) AS venue_key,
         lower(btrim(COALESCE(sr_course_map.sr_venue_course_name, sr_course_map.sr_venue_name))) AS course_key
    FROM public.sr_course_map
   WHERE sr_course_map.golf_course_id IS NOT NULL
), m_unique AS (
  /* a course name may only be used venue-blind when it identifies exactly one of our courses */
  SELECT course_key, min(golf_course_id::text)::uuid AS golf_course_id
    FROM m
   GROUP BY course_key
  HAVING count(DISTINCT golf_course_id) = 1
), forced_queue(venue_key, course_key) AS (
  /* held for a human decision - the mapping points at a different layout or club */
  VALUES
    ('tpc scottsdale', 'stadium course'),
    ('siam country club', 'pattaya old course'),
    ('trump national golf club', 'championship course')
), step AS (
  SELECT tok.*,
         (SELECT m.golf_course_id FROM m
           WHERE m.course_key = lower(tok.venue_course_name)
             AND m.venue_key = lower(tok.venue_name)
           LIMIT 1) AS course_gc_same_venue,
         (SELECT mu.golf_course_id FROM m_unique mu
           WHERE mu.course_key = lower(tok.venue_course_name)) AS course_gc_unique,
         (SELECT m.golf_course_id FROM m
           WHERE m.venue_key = lower(tok.venue_name)
           LIMIT 1) AS venue_gc,
         (SELECT count(*) FROM unnest(COALESCE(tok.course_tokens, ARRAY[]::text[])) w(w)
           WHERE POSITION(w.w IN tok.venue_norm) = 0) AS foreign_tokens,
         EXISTS (SELECT 1 FROM forced_queue f
                  WHERE f.venue_key = lower(tok.venue_name)
                    AND f.course_key = lower(tok.venue_course_name)) AS forced
    FROM tok
), resolved AS (
  SELECT step.*,
         COALESCE(step.course_gc_same_venue, step.course_gc_unique) AS course_gc
    FROM step
), classed AS (
  SELECT resolved.*,
         CASE
           WHEN resolved.forced THEN 'unresolved'
           WHEN resolved.course_gc IS NOT NULL THEN 'course'
           WHEN resolved.venue_course_name IS NULL THEN 'venue'
           WHEN resolved.foreign_tokens = 0 THEN 'venue'
           ELSE 'unresolved'
         END AS route
    FROM resolved
), ambiguous AS (
  SELECT lower(classed.venue_name) AS venue_key
    FROM classed
   WHERE classed.route = 'venue'
   GROUP BY lower(classed.venue_name)
  HAVING count(DISTINCT lower(classed.venue_course_name)) > 1
  UNION
  SELECT DISTINCT lower(classed.venue_name)
    FROM classed
   WHERE classed.route = 'unresolved'
)
SELECT tournament_id,
       venue_name,
       venue_course_name,
       CASE
         WHEN route = 'course' THEN course_gc
         WHEN route = 'venue' AND lower(venue_name) NOT IN (SELECT venue_key FROM ambiguous) THEN venue_gc
         ELSE NULL::uuid
       END AS golf_course_id,
       CASE
         WHEN route = 'course' THEN 'course_name'
         WHEN route = 'venue' AND lower(venue_name) IN (SELECT venue_key FROM ambiguous) THEN 'ambiguous_venue'
         WHEN route = 'venue' AND venue_gc IS NOT NULL THEN 'venue_name_fallback'
         WHEN route = 'venue' THEN 'unmapped_venue'
         ELSE 'course_name_unresolved'
       END AS resolution
  FROM classed c;