-- Create user achievements tracking table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL, -- 'trophy_unlock', 'xp_milestone', 'course_played', 'list_progress', 'badge_earned'
  achievement_data JSONB NOT NULL, -- Store specific achievement details
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_user_achievements_user_created 
ON public.user_achievements(user_id, created_at DESC);

-- Create function to log achievements
CREATE OR REPLACE FUNCTION public.log_user_achievement(
  user_id_param UUID,
  achievement_type_param TEXT,
  achievement_data_param JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert achievement log
  INSERT INTO public.user_achievements (user_id, achievement_type, achievement_data)
  VALUES (user_id_param, achievement_type_param, achievement_data_param);
END;
$$;

-- Create function to get recent achievements
CREATE OR REPLACE FUNCTION public.get_user_recent_achievements(user_id_param UUID, limit_param INTEGER DEFAULT 5)
RETURNS TABLE(
  id UUID,
  achievement_type TEXT,
  achievement_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id,
    ua.achievement_type,
    ua.achievement_data,
    ua.created_at
  FROM public.user_achievements ua
  WHERE ua.user_id = user_id_param
  ORDER BY ua.created_at DESC
  LIMIT limit_param;
END;
$$;

-- Update the existing badge award function to log achievements
CREATE OR REPLACE FUNCTION public.check_and_award_badges(user_id_param UUID)
RETURNS TABLE(newly_awarded_badges JSON)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
        
        -- Log the badge achievement
        PERFORM public.log_user_achievement(
          user_id_param,
          'badge_earned',
          jsonb_build_object(
            'badge_id', badge_record.id,
            'badge_name', badge_record.display_name,
            'badge_emoji', badge_record.emoji,
            'progress_value', user_progress
          )
        );
      END IF;
    END IF;
  END LOOP;

  -- Return newly awarded badges
  RETURN QUERY SELECT array_to_json(new_badges);
END;
$$;

-- Create trigger function to log course play achievements
CREATE OR REPLACE FUNCTION public.log_course_achievement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  course_name TEXT;
  course_rank INTEGER;
  user_total_xp INTEGER;
BEGIN
  -- Only log when a course is marked as played
  IF NEW.played = true AND (OLD.played IS NULL OR OLD.played = false) THEN
    -- Get course details
    SELECT name, COALESCE(global_rank, regional_rank, usa_rank) INTO course_name, course_rank
    FROM public.golf_courses
    WHERE id = NEW.course_id;
    
    -- Calculate user's total XP (assuming 110 XP per course)
    SELECT COUNT(*) * 110 INTO user_total_xp
    FROM public.user_top100_courses
    WHERE user_id = NEW.user_id AND played = true;
    
    -- Log course completion achievement
    PERFORM public.log_user_achievement(
      NEW.user_id,
      'course_played',
      jsonb_build_object(
        'course_id', NEW.course_id,
        'course_name', course_name,
        'course_rank', course_rank,
        'xp_gained', 110,
        'total_xp', user_total_xp,
        'played_date', NEW.played_date
      )
    );
    
    -- Check for XP milestones and log them
    IF user_total_xp > 0 AND user_total_xp % 1000 = 0 THEN
      PERFORM public.log_user_achievement(
        NEW.user_id,
        'xp_milestone',
        jsonb_build_object(
          'milestone_xp', user_total_xp,
          'courses_played', user_total_xp / 110
        )
      );
    END IF;
    
    -- Check for trophy unlocks
    -- Green Fee Rookie (20 courses)
    IF user_total_xp = 2200 THEN
      PERFORM public.log_user_achievement(
        NEW.user_id,
        'trophy_unlock',
        jsonb_build_object(
          'trophy_name', 'The Green Fee Rookie',
          'trophy_emoji', '🟡',
          'courses_required', 20,
          'xp_required', 2200
        )
      );
    END IF;
    
    -- The Turn (50 courses)
    IF user_total_xp = 5500 THEN
      PERFORM public.log_user_achievement(
        NEW.user_id,
        'trophy_unlock',
        jsonb_build_object(
          'trophy_name', 'The Turn',
          'trophy_emoji', '🥈',
          'courses_required', 50,
          'xp_required', 5500
        )
      );
    END IF;
    
    -- Century Club (100 courses)
    IF user_total_xp = 11000 THEN
      PERFORM public.log_user_achievement(
        NEW.user_id,
        'trophy_unlock',
        jsonb_build_object(
          'trophy_name', 'Century Club',
          'trophy_emoji', '🔵',
          'courses_required', 100,
          'xp_required', 11000
        )
      );
    END IF;
    
    -- Check for regional list progress
    -- This is a simplified check - you may want to make it more sophisticated
    DECLARE
      gb_ireland_count INTEGER;
      europe_count INTEGER;
      usa_count INTEGER;
      worldwide_count INTEGER;
    BEGIN
      -- Get regional counts (this is simplified - you'd need proper regional classification)
      SELECT COUNT(*) INTO gb_ireland_count
      FROM public.user_top100_courses utc
      JOIN public.golf_courses gc ON utc.course_id = gc.id
      WHERE utc.user_id = NEW.user_id AND utc.played = true 
      AND gc.country IN ('England', 'Scotland', 'Wales', 'Ireland', 'Northern Ireland');
      
      SELECT COUNT(*) INTO europe_count
      FROM public.user_top100_courses utc
      JOIN public.golf_courses gc ON utc.course_id = gc.id
      WHERE utc.user_id = NEW.user_id AND utc.played = true 
      AND gc.continent = 'Europe';
      
      SELECT COUNT(*) INTO usa_count
      FROM public.user_top100_courses utc
      JOIN public.golf_courses gc ON utc.course_id = gc.id
      WHERE utc.user_id = NEW.user_id AND utc.played = true 
      AND gc.country = 'United States';
      
      -- Log regional progress achievements for significant milestones
      IF gb_ireland_count = 19 THEN -- One course away from completing GB&I
        PERFORM public.log_user_achievement(
          NEW.user_id,
          'list_progress',
          jsonb_build_object(
            'list_name', 'Great Britain & Ireland',
            'emoji', '🏴',
            'progress', gb_ireland_count,
            'total', 20,
            'message', 'Only 1 more course to finish the GB&I list!'
          )
        );
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for course achievements
DROP TRIGGER IF EXISTS trigger_course_achievement ON public.user_top100_courses;
CREATE TRIGGER trigger_course_achievement
  AFTER INSERT OR UPDATE ON public.user_top100_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.log_course_achievement();