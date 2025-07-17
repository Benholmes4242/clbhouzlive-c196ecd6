-- Create a function to fetch social feed posts
CREATE OR REPLACE FUNCTION fetch_social_feed_posts(
  followed_user_ids UUID[], 
  current_offset INT, 
  posts_per_page INT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  likes_count INT,
  comments_count INT,
  shares_count INT,
  interaction_type TEXT,
  post_media JSONB,
  post_tags JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH combined_posts AS (
    -- Posts by followed users
    SELECT 
      p.id, 
      p.user_id, 
      p.content, 
      p.created_at,
      0 as likes_count,
      0 as comments_count,
      0 as shares_count,
      'posted' as interaction_type,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pm.id,
            'media_type', pm.media_type,
            'media_url', pm.media_url
          )
        )
        FROM post_media pm 
        WHERE pm.post_id = p.id
      ) as post_media,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pt.id,
            'tagged_entity_id', pt.tagged_entity_id,
            'taggable_entities', jsonb_build_object(
              'id', te.id,
              'entity_type', te.entity_type,
              'entity_id', te.entity_id,
              'name', te.name
            )
          )
        )
        FROM post_tags pt
        JOIN taggable_entities te ON pt.tagged_entity_id = te.id
        WHERE pt.post_id = p.id
      ) as post_tags
    FROM posts p
    WHERE p.user_id = ANY(followed_user_ids)

    UNION

    -- Posts liked by followed users
    SELECT 
      p.id, 
      p.user_id, 
      p.content, 
      p.created_at,
      0 as likes_count,
      0 as comments_count,
      0 as shares_count,
      'liked' as interaction_type,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pm.id,
            'media_type', pm.media_type,
            'media_url', pm.media_url
          )
        )
        FROM post_media pm 
        WHERE pm.post_id = p.id
      ) as post_media,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pt.id,
            'tagged_entity_id', pt.tagged_entity_id,
            'taggable_entities', jsonb_build_object(
              'id', te.id,
              'entity_type', te.entity_type,
              'entity_id', te.entity_id,
              'name', te.name
            )
          )
        )
        FROM post_tags pt
        JOIN taggable_entities te ON pt.tagged_entity_id = te.id
        WHERE pt.post_id = p.id
      ) as post_tags
    FROM posts p
    WHERE p.id IN (
      SELECT post_id 
      FROM post_likes 
      WHERE user_id = ANY(followed_user_ids)
    )

    UNION

    -- Posts commented on by followed users
    SELECT 
      p.id, 
      p.user_id, 
      p.content, 
      p.created_at,
      0 as likes_count,
      0 as comments_count,
      0 as shares_count,
      'commented' as interaction_type,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pm.id,
            'media_type', pm.media_type,
            'media_url', pm.media_url
          )
        )
        FROM post_media pm 
        WHERE pm.post_id = p.id
      ) as post_media,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pt.id,
            'tagged_entity_id', pt.tagged_entity_id,
            'taggable_entities', jsonb_build_object(
              'id', te.id,
              'entity_type', te.entity_type,
              'entity_id', te.entity_id,
              'name', te.name
            )
          )
        )
        FROM post_tags pt
        JOIN taggable_entities te ON pt.tagged_entity_id = te.id
        WHERE pt.post_id = p.id
      ) as post_tags
    FROM posts p
    WHERE p.id IN (
      SELECT post_id 
      FROM post_comments
      WHERE user_id = ANY(followed_user_ids)
    )

    UNION

    -- Posts shared by followed users
    SELECT 
      p.id, 
      p.user_id, 
      p.content, 
      p.created_at,
      0 as likes_count,
      0 as comments_count,
      0 as shares_count,
      'shared' as interaction_type,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pm.id,
            'media_type', pm.media_type,
            'media_url', pm.media_url
          )
        )
        FROM post_media pm 
        WHERE pm.post_id = p.id
      ) as post_media,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pt.id,
            'tagged_entity_id', pt.tagged_entity_id,
            'taggable_entities', jsonb_build_object(
              'id', te.id,
              'entity_type', te.entity_type,
              'entity_id', te.entity_id,
              'name', te.name
            )
          )
        )
        FROM post_tags pt
        JOIN taggable_entities te ON pt.tagged_entity_id = te.id
        WHERE pt.post_id = p.id
      ) as post_tags
    FROM posts p
    WHERE p.id IN (
      SELECT post_id 
      FROM post_shares
      WHERE user_id = ANY(followed_user_ids)
    )
  )
  
  SELECT 
    cp.id, 
    cp.user_id, 
    cp.content, 
    cp.created_at,
    (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = cp.id) as likes_count,
    (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = cp.id) as comments_count,
    (SELECT COUNT(*) FROM post_shares ps WHERE ps.post_id = cp.id) as shares_count,
    cp.interaction_type,
    cp.post_media,
    cp.post_tags
  FROM combined_posts cp
  ORDER BY cp.created_at DESC
  LIMIT posts_per_page
  OFFSET current_offset;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION fetch_social_feed_posts TO authenticated;