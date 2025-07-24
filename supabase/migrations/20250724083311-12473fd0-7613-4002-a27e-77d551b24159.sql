-- PHASE 1: CRITICAL SECURITY FIXES
-- Fix database function security by adding search_path protection to all security-critical functions

-- 1. Fix has_role function - CRITICAL for authorization
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$function$;

-- 2. Fix is_admin function - CRITICAL for admin access
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN public.has_role(auth.uid(), 'admin');
END;
$function$;

-- 3. Fix get_all_users_admin function - CRITICAL for admin operations
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
 RETURNS TABLE(id uuid, email text, auth_created_at timestamp with time zone, last_sign_in_at timestamp with time zone, email_confirmed_at timestamp with time zone, display_name text, username text, home_club text, is_public boolean, profile_created_at timestamp with time zone, role app_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Only allow admins to access this function
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    up.display_name,
    up.username,
    up.home_club,
    up.is_public,
    up.created_at as profile_created_at,
    ur.role
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON au.id = up.id
  LEFT JOIN public.user_roles ur ON au.id = ur.user_id;
END;
$function$;

-- 4. Fix can_change_email function - Prevent unauthorized email changes
CREATE OR REPLACE FUNCTION public.can_change_email(user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  cooldown_until TIMESTAMP WITH TIME ZONE;
  change_count INTEGER;
BEGIN
  -- Only allow users to check their own email change status
  IF auth.uid() != user_id_param AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Can only check your own email change status.';
  END IF;
  
  SELECT email_change_cooldown_until, COALESCE(email_change_count, 0) 
  INTO cooldown_until, change_count
  FROM public.user_profiles 
  WHERE id = user_id_param;
  
  -- If no cooldown set, allow change
  IF cooldown_until IS NULL THEN
    RETURN true;
  END IF;
  
  -- If cooldown period has passed, allow change
  IF cooldown_until < now() THEN
    RETURN true;
  END IF;
  
  -- If within cooldown period, deny change
  RETURN false;
END;
$function$;

-- 5. Fix get_user_top100_courses_count function
CREATE OR REPLACE FUNCTION public.get_user_top100_courses_count(user_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT uc.course_id)::INTEGER
    FROM public.user_top100_courses uc
    JOIN public.golf_courses gc ON uc.course_id = gc.id
    WHERE uc.user_id = user_id_param 
      AND uc.played = true
      AND (gc.global_rank IS NOT NULL OR gc.regional_rank IS NOT NULL OR gc.usa_rank IS NOT NULL)
  );
END;
$function$;

-- 6. Fix send_push_notification function
CREATE OR REPLACE FUNCTION public.send_push_notification(target_user_id uuid, notification_type text, title text, message text, data jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  user_preferences JSONB;
  should_send BOOLEAN := false;
BEGIN
  -- Get user notification preferences
  SELECT notification_preferences INTO user_preferences
  FROM public.user_profiles
  WHERE id = target_user_id;
  
  -- Check if user wants this type of notification
  CASE notification_type
    WHEN 'follow' THEN
      should_send := COALESCE((user_preferences->>'new_follower')::boolean, true);
    WHEN 'like' THEN
      should_send := COALESCE((user_preferences->>'post_likes')::boolean, true);
    WHEN 'comment' THEN
      should_send := COALESCE((user_preferences->>'post_comments')::boolean, true);
    WHEN 'share' THEN
      should_send := COALESCE((user_preferences->>'post_shares')::boolean, true);
    WHEN 'tag' THEN
      should_send := COALESCE((user_preferences->>'tagged_in_post')::boolean, true);
    WHEN 'course_activity' THEN
      should_send := COALESCE((user_preferences->>'course_activity')::boolean, false);
    WHEN 'golf_news' THEN
      should_send := COALESCE((user_preferences->>'golf_news')::boolean, false);
    ELSE
      should_send := true;
  END CASE;
  
  -- Only create notification if user wants it
  IF should_send THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (target_user_id, notification_type, title, message, data);
  END IF;
END;
$function$;

-- 7. Fix check_and_award_badges function
CREATE OR REPLACE FUNCTION public.check_and_award_badges(user_id_param uuid)
 RETURNS TABLE(newly_awarded_badges json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  badge_record RECORD;
  user_progress INTEGER;
  new_badges JSON[] := '{}';
  badge_json JSON;
BEGIN
  -- Check each badge criteria
  FOR badge_record IN 
    SELECT * FROM public.badges WHERE is_active = true
  LOOP
    -- Calculate user's current progress for this badge type
    CASE badge_record.criteria_type
      WHEN 'top_100_courses_played' THEN
        user_progress := public.get_user_top100_courses_count(user_id_param);
      WHEN 'posts_created' THEN
        SELECT COUNT(*)::INTEGER INTO user_progress
        FROM public.posts p
        JOIN public.post_media pm ON p.id = pm.post_id
        WHERE p.user_id = user_id_param;
      WHEN 'reviews_written' THEN
        SELECT COUNT(DISTINCT course_id)::INTEGER INTO user_progress
        FROM public.course_ratings
        WHERE user_id = user_id_param AND review IS NOT NULL AND trim(review) != '';
      WHEN 'users_followed' THEN
        SELECT COUNT(*)::INTEGER INTO user_progress
        FROM public.user_follows
        WHERE follower_id = user_id_param;
      ELSE
        user_progress := 0;
    END CASE;

    -- Check if user qualifies for this badge and doesn't already have it
    IF user_progress >= badge_record.criteria_value THEN
      -- Insert badge if not already awarded
      INSERT INTO public.user_badges (user_id, badge_id, progress_value, is_notified)
      VALUES (user_id_param, badge_record.id, user_progress, false)
      ON CONFLICT (user_id, badge_id) DO UPDATE SET
        progress_value = EXCLUDED.progress_value
      WHERE public.user_badges.earned_at IS NULL;

      -- Check if this was a new award
      IF FOUND THEN
        badge_json := json_build_object(
          'id', badge_record.id,
          'name', badge_record.name,
          'display_name', badge_record.display_name,
          'description', badge_record.description,
          'emoji', badge_record.emoji,
          'tier', badge_record.tier,
          'progress_value', user_progress
        );
        new_badges := array_append(new_badges, badge_json);
      END IF;
    END IF;
  END LOOP;

  -- Return newly awarded badges
  RETURN QUERY SELECT array_to_json(new_badges);
END;
$function$;