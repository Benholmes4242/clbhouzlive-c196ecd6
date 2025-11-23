
WITH dup_groups AS (
  SELECT
    name,
    country,
    COALESCE(sub_country, '') AS sub_country_norm,
    COUNT(*) AS duplicate_count
  FROM golf_courses
  GROUP BY
    name,
    country,
    COALESCE(sub_country, '')
  HAVING COUNT(*) > 1
),
candidates AS (
  SELECT
    c.*,
    ROW_NUMBER() OVER (
      PARTITION BY c.name, c.country, COALESCE(c.sub_country, '')
      ORDER BY c.created_at ASC
    ) AS rn
  FROM golf_courses c
  JOIN dup_groups g
    ON c.name = g.name
   AND c.country = g.country
   AND COALESCE(c.sub_country, '') = g.sub_country_norm
),
unused_dupes AS (
  SELECT
    c.id
  FROM candidates c
  LEFT JOIN course_ratings cr
    ON cr.course_id = c.id
  LEFT JOIN course_top100_memberships m
    ON m.course_id = c.id
  LEFT JOIN user_top100_courses utc
    ON utc.course_id = c.id AND utc.played = TRUE
  WHERE
    c.rn > 1
    AND cr.course_id IS NULL
    AND m.course_id IS NULL
    AND utc.course_id IS NULL
)
DELETE FROM golf_courses
WHERE id IN (SELECT id FROM unused_dupes);
