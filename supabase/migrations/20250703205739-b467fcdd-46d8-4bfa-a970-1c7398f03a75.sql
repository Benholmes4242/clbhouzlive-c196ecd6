-- Create enum for badge categories
CREATE TYPE public.badge_category AS ENUM (
  'top_100_courses',
  'engagement',
  'community',
  'special'
);

-- Create enum for badge tiers
CREATE TYPE public.badge_tier AS ENUM (
  'bronze',
  'silver', 
  'gold',
  'platinum',
  'diamond'
);

-- Create badges table with all available badges
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  category badge_category NOT NULL,
  tier badge_tier NOT NULL,
  criteria_value INTEGER NOT NULL, -- The threshold value (e.g., 20 for "20 courses")
  criteria_type TEXT NOT NULL, -- e.g., 'top_100_courses_played', 'posts_shared', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_badges table to track which users have which badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  progress_value INTEGER DEFAULT 0, -- Current progress toward this badge
  is_notified BOOLEAN DEFAULT false, -- Whether user has been notified of this achievement
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Badges are viewable by everyone
CREATE POLICY "Badges are viewable by everyone" 
ON public.badges 
FOR SELECT 
USING (true);

-- Users can view their own badges and others' badges
CREATE POLICY "Users can view all user badges" 
ON public.user_badges 
FOR SELECT 
USING (true);

-- Only system can insert/update user badges (will be done via functions)
CREATE POLICY "System can manage user badges" 
ON public.user_badges 
FOR ALL 
USING (false);

-- Insert initial badge definitions
INSERT INTO public.badges (name, display_name, description, emoji, category, tier, criteria_value, criteria_type) VALUES
-- Top 100 Course Tracker Badges
('top_20_rookie', 'Top 20 Rookie', 'Played 20 courses from any Top 100 list', '🟢', 'top_100_courses', 'bronze', 20, 'top_100_courses_played'),
('fifty_fairways', 'Fifty Fairways', 'Played 50 Top 100 courses', '🟡', 'top_100_courses', 'silver', 50, 'top_100_courses_played'),
('course_collector', 'Course Collector', 'Played 100 Top 100 courses', '🔵', 'top_100_courses', 'gold', 100, 'top_100_courses_played'),
('top_300_hunter', 'Top 300 Hunter', 'Played 300 unique Top 100 courses', '🟣', 'top_100_courses', 'platinum', 300, 'top_100_courses_played'),
('elite_explorer', 'Elite Explorer', 'Played all courses from all 4 Top 100 lists', '💎', 'top_100_courses', 'diamond', 400, 'top_100_courses_played'),

-- Engagement / Community Badges  
('content_creator', 'Content Creator', 'Shared 10+ Moments (photo/video posts)', '📸', 'engagement', 'bronze', 10, 'posts_created'),
('course_reviewer', 'Course Reviewer', 'Wrote 10+ reviews for different courses', '📝', 'engagement', 'bronze', 10, 'reviews_written'),
('active_rounder', 'Active Rounder', 'Logged 10 rounds with handicap info', '🕐', 'engagement', 'bronze', 10, 'rounds_logged'),
('pro_tips_contributor', 'Pro Tips Contributor', 'Posted 5+ tips tagged "Pro Tips"', '🎯', 'engagement', 'gold', 5, 'pro_tips_posted');

-- Create function to calculate user's Top 100 courses played
CREATE OR REPLACE FUNCTION public.get_user_top100_courses_count(user_id_param UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(DISTINCT uc.course_id)::INTEGER
  FROM public.user_top100_courses uc
  JOIN public.golf_courses gc ON uc.course_id = gc.id
  WHERE uc.user_id = user_id_param 
    AND uc.played = true
    AND (gc.global_rank IS NOT NULL OR gc.regional_rank IS NOT NULL OR gc.usa_rank IS NOT NULL);
$$;

-- Create function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges(user_id_param UUID)
RETURNS TABLE(newly_awarded_badges JSON)
LANGUAGE PLPGSQL
SECURITY DEFINER
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
      END IF;
    END IF;
  END LOOP;

  -- Return newly awarded badges
  RETURN QUERY SELECT array_to_json(new_badges);
END;
$$;

-- Create trigger to automatically check badges when relevant data changes
CREATE OR REPLACE FUNCTION public.trigger_badge_check()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  -- Check badges for the affected user
  PERFORM public.check_and_award_badges(
    CASE 
      WHEN TG_TABLE_NAME = 'user_top100_courses' THEN NEW.user_id
      WHEN TG_TABLE_NAME = 'posts' THEN NEW.user_id
      WHEN TG_TABLE_NAME = 'course_ratings' THEN NEW.user_id
      WHEN TG_TABLE_NAME = 'user_follows' THEN NEW.follower_id
      ELSE NULL
    END
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers on relevant tables
CREATE TRIGGER check_badges_on_top100_courses
  AFTER INSERT OR UPDATE ON public.user_top100_courses
  FOR EACH ROW
  WHEN (NEW.played = true)
  EXECUTE FUNCTION public.trigger_badge_check();

CREATE TRIGGER check_badges_on_posts
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_badge_check();

CREATE TRIGGER check_badges_on_course_ratings
  AFTER INSERT OR UPDATE ON public.course_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_badge_check();

CREATE TRIGGER check_badges_on_user_follows
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_badge_check();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_badges_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_badges_updated_at
  BEFORE UPDATE ON public.badges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_badges_updated_at();