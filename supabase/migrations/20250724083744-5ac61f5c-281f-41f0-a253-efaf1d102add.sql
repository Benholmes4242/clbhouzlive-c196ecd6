-- Fix remaining database functions with search_path protection

-- 8. Fix update_user_profiles_updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 9. Fix assign_default_user_role trigger function
CREATE OR REPLACE FUNCTION public.assign_default_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Insert a 'user' role for the new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- 10. Fix create_message_notification trigger function
CREATE OR REPLACE FUNCTION public.create_message_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  -- Get the sender's display name or username
  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT 
    NEW.recipient_id,
    'message',
    'New Message',
    COALESCE(up.display_name, up.username, 'Someone') || ' sent you a message',
    jsonb_build_object(
      'message_id', NEW.id,
      'sender_id', NEW.sender_id,
      'sender_name', COALESCE(up.display_name, up.username, 'Someone'),
      'content_preview', LEFT(NEW.content, 50)
    )
  FROM public.user_profiles up
  WHERE up.id = NEW.sender_id;
  
  RETURN NEW;
END;
$function$;

-- 11. Fix trigger_badge_check trigger function
CREATE OR REPLACE FUNCTION public.trigger_badge_check()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  -- Check badges for the affected user based on table type
  CASE TG_TABLE_NAME
    WHEN 'user_top100_courses' THEN
      PERFORM public.check_and_award_badges(NEW.user_id);
    WHEN 'posts' THEN
      PERFORM public.check_and_award_badges(NEW.user_id);
    WHEN 'course_ratings' THEN
      PERFORM public.check_and_award_badges(NEW.user_id);
    WHEN 'user_follows' THEN
      PERFORM public.check_and_award_badges(NEW.follower_id);
  END CASE;
  
  RETURN NEW;
END;
$function$;

-- 12. Fix update_badges_updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_badges_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 13. Fix create_follow_notification trigger function
CREATE OR REPLACE FUNCTION public.create_follow_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  follower_name TEXT;
BEGIN
  -- Get the follower's display name or username
  SELECT COALESCE(display_name, username, 'Someone') INTO follower_name
  FROM public.user_profiles
  WHERE id = NEW.follower_id;
  
  -- Send notification using new system
  PERFORM public.send_push_notification(
    NEW.following_id,
    'follow',
    'New Follower',
    follower_name || ' started following you',
    jsonb_build_object(
      'follower_id', NEW.follower_id,
      'follower_name', follower_name
    )
  );
  
  RETURN NEW;
END;
$function$;

-- 14. Fix create_like_notification trigger function
CREATE OR REPLACE FUNCTION public.create_like_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  post_owner_id UUID;
  liker_name TEXT;
  post_content_preview TEXT;
  course_name TEXT;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if user liked their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker's name
  SELECT COALESCE(display_name, username, 'Someone') INTO liker_name
  FROM public.user_profiles
  WHERE id = NEW.user_id;
  
  -- Get post content preview
  SELECT LEFT(COALESCE(content, ''), 50) INTO post_content_preview
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Get course name if post is tagged to a course
  SELECT gc.name INTO course_name
  FROM public.post_tags pt
  JOIN public.taggable_entities te ON pt.tagged_entity_id = te.id
  JOIN public.golf_courses gc ON te.entity_id = gc.id
  WHERE pt.post_id = NEW.post_id AND te.entity_type = 'course'
  LIMIT 1;
  
  -- Send notification
  PERFORM public.send_push_notification(
    post_owner_id,
    'like',
    'Post Liked',
    CASE 
      WHEN course_name IS NOT NULL THEN
        liker_name || ' liked your Moment at ' || course_name || '.'
      ELSE
        liker_name || ' liked your post.'
    END,
    jsonb_build_object(
      'post_id', NEW.post_id,
      'liker_id', NEW.user_id,
      'liker_name', liker_name,
      'content_preview', post_content_preview,
      'course_name', course_name
    )
  );
  
  RETURN NEW;
END;
$function$;

-- 15. Fix populate_taggable_entities function
CREATE OR REPLACE FUNCTION public.populate_taggable_entities()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Insert users
  INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
  SELECT 
    'user'::text,
    id,
    COALESCE(display_name, username, 'User'),
    username,
    profile_photo_url
  FROM public.user_profiles
  WHERE user_type = 'individual' OR user_type IS NULL
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    profile_image_url = EXCLUDED.profile_image_url,
    updated_at = now();

  -- Insert business accounts
  INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
  SELECT 
    'business'::text,
    id,
    COALESCE(business_name, display_name, username, 'Business'),
    username,
    COALESCE(logo_url, profile_photo_url)
  FROM public.user_profiles
  WHERE user_type IN ('club', 'pro_shop', 'academy', 'tour_event', 'other')
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    profile_image_url = EXCLUDED.profile_image_url,
    updated_at = now();

  -- Insert golf clubs
  INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
  SELECT 
    'golf_club'::text,
    id,
    name,
    NULL,
    thumbnail_image
  FROM public.golf_courses
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    name = EXCLUDED.name,
    profile_image_url = EXCLUDED.profile_image_url,
    updated_at = now();
END;
$function$;

-- 16. Fix sync_golf_course_to_taggable_entities trigger function
CREATE OR REPLACE FUNCTION public.sync_golf_course_to_taggable_entities()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
  VALUES (
    'golf_club'::text,
    NEW.id,
    NEW.name,
    NULL,
    NEW.thumbnail_image
  )
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    name = EXCLUDED.name,
    profile_image_url = EXCLUDED.profile_image_url,
    updated_at = now();

  RETURN NEW;
END;
$function$;

-- 17. Fix sync_user_to_taggable_entities trigger function
CREATE OR REPLACE FUNCTION public.sync_user_to_taggable_entities()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Determine entity type based on user_type
  CASE NEW.user_type
    WHEN 'individual' THEN
      INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
      VALUES (
        'user'::text,
        NEW.id,
        COALESCE(NEW.display_name, NEW.username, 'User'),
        NEW.username,
        NEW.profile_photo_url
      )
      ON CONFLICT (entity_type, entity_id) DO UPDATE SET
        name = EXCLUDED.name,
        username = EXCLUDED.username,
        profile_image_url = EXCLUDED.profile_image_url,
        updated_at = now();
    ELSE
      INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
      VALUES (
        'business'::text,
        NEW.id,
        COALESCE(NEW.business_name, NEW.display_name, NEW.username, 'Business'),
        NEW.username,
        COALESCE(NEW.logo_url, NEW.profile_photo_url)
      )
      ON CONFLICT (entity_type, entity_id) DO UPDATE SET
        name = EXCLUDED.name,
        username = EXCLUDED.username,
        profile_image_url = EXCLUDED.profile_image_url,
        updated_at = now();
  END CASE;

  RETURN NEW;
END;
$function$;

-- 18. Fix fetch_social_feed_posts function
CREATE OR REPLACE FUNCTION public.fetch_social_feed_posts(followed_user_ids uuid[], current_offset integer, posts_per_page integer)
 RETURNS TABLE(id uuid, user_id uuid, content text, created_at timestamp with time zone, likes_count integer, comments_count integer, shares_count integer, interaction_type text, post_media jsonb, post_tags jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;