-- Create user_xp_events table if not exists
CREATE TABLE IF NOT EXISTS public.user_xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reason text NOT NULL,
  amount int NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_xp_events_user_id ON public.user_xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_events_created_at ON public.user_xp_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_xp_events ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can view their own XP events
DROP POLICY IF EXISTS "Users can view own XP events" ON public.user_xp_events;
CREATE POLICY "Users can view own XP events"
  ON public.user_xp_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to award Top 100 XP bonus on first-time course play
CREATE OR REPLACE FUNCTION public.award_top100_xp_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prior_count int;
  course_is_top100 boolean;
BEGIN
  -- Skip if not marked as played
  IF NEW.played IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  
  -- Check if this course is a Top 100 course
  SELECT EXISTS (
    SELECT 1 FROM course_top100_memberships WHERE course_id = NEW.course_id
  ) INTO course_is_top100;
  
  -- Only proceed if this is a Top 100 course
  IF course_is_top100 THEN
    -- Check if this is the first time user has marked this course as played
    SELECT COUNT(*) INTO prior_count
    FROM user_courses
    WHERE user_id = NEW.user_id
      AND course_id = NEW.course_id
      AND id <> NEW.id
      AND played = true;
    
    -- If first time, award XP bonus
    IF prior_count = 0 THEN
      INSERT INTO user_xp_events (user_id, reason, amount, metadata)
      VALUES (
        NEW.user_id,
        'top100_new_course',
        250,
        jsonb_build_object(
          'course_id', NEW.course_id,
          'played_at', NOW(),
          'source', 'top100_bonus'
        )
      );
      
      -- Log for debugging
      RAISE NOTICE 'Awarded 250 XP to user % for first play at Top 100 course %', NEW.user_id, NEW.course_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on user_courses table (the actual table, not the view)
DROP TRIGGER IF EXISTS trigger_award_top100_xp ON user_courses;
CREATE TRIGGER trigger_award_top100_xp
  AFTER INSERT OR UPDATE OF played ON user_courses
  FOR EACH ROW
  EXECUTE FUNCTION award_top100_xp_bonus();

-- Grant permissions
GRANT SELECT ON public.user_xp_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_top100_xp_bonus TO authenticated;