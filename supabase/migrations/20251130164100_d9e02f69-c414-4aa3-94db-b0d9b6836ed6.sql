-- Create RPC to get Top 100 lists with hero courses and user progress
CREATE OR REPLACE FUNCTION get_top100_lists_with_hero_courses(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  list_id UUID,
  list_name TEXT,
  list_slug TEXT,
  list_short_label TEXT,
  total_courses BIGINT,
  played_count BIGINT,
  hero_course_id UUID,
  hero_course_name TEXT,
  hero_course_country TEXT,
  hero_course_region TEXT,
  hero_course_thumbnail TEXT,
  hero_course_rank INT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id AS list_id,
    l.name AS list_name,
    l.slug AS list_slug,
    l.short_label AS list_short_label,
    COUNT(DISTINCT ctm.course_id) AS total_courses,
    COALESCE(
      (SELECT COUNT(DISTINCT uc.course_id)
       FROM user_courses uc
       INNER JOIN course_top100_memberships ctm2 ON ctm2.course_id = uc.course_id
       WHERE ctm2.list_id = l.id
       AND (target_user_id IS NULL OR uc.user_id = target_user_id)
      ), 0
    ) AS played_count,
    hero.id AS hero_course_id,
    hero.name AS hero_course_name,
    hero.country AS hero_course_country,
    hero.region AS hero_course_region,
    hero.thumbnail_image AS hero_course_thumbnail,
    hero_membership.rank AS hero_course_rank
  FROM top100_lists l
  LEFT JOIN course_top100_memberships ctm ON ctm.list_id = l.id
  LEFT JOIN LATERAL (
    SELECT gc.*, ctm_hero.rank
    FROM course_top100_memberships ctm_hero
    INNER JOIN golf_courses gc ON gc.id = ctm_hero.course_id
    WHERE ctm_hero.list_id = l.id
    ORDER BY ctm_hero.rank ASC
    LIMIT 1
  ) hero ON TRUE
  LEFT JOIN course_top100_memberships hero_membership 
    ON hero_membership.course_id = hero.id 
    AND hero_membership.list_id = l.id
  WHERE l.is_active = TRUE
  GROUP BY 
    l.id, 
    l.name, 
    l.slug, 
    l.short_label, 
    l.sort_order,
    hero.id,
    hero.name,
    hero.country,
    hero.region,
    hero.thumbnail_image,
    hero_membership.rank
  ORDER BY l.sort_order ASC;
END;
$$;