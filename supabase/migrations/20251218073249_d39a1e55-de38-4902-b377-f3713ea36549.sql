-- Add user_home_clubs join table for "Also plays at" support
CREATE TABLE IF NOT EXISTS public.user_home_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_profile_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_user_home_clubs_user ON public.user_home_clubs (user_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_home_clubs_business ON public.user_home_clubs (business_id);

-- Enable RLS
ALTER TABLE public.user_home_clubs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all home clubs" ON public.user_home_clubs
FOR SELECT USING (true);

CREATE POLICY "Users can manage their own home clubs" ON public.user_home_clubs
FOR ALL USING (auth.uid() = user_profile_id)
WITH CHECK (auth.uid() = user_profile_id);

-- Notification trigger for when someone is added to a business team
CREATE OR REPLACE FUNCTION public.notify_business_team_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_name text;
  v_role_display text;
BEGIN
  -- Get business name
  SELECT COALESCE(ba.name, ba.club_name, 'a business')
  INTO v_business_name
  FROM public.business_accounts ba
  WHERE ba.id = NEW.business_id;

  -- Map role to display text
  v_role_display := CASE NEW.role
    WHEN 'owner' THEN 'Primary manager'
    WHEN 'admin' THEN 'Manager'
    WHEN 'director' THEN 'Director'
    WHEN 'coach' THEN 'Coach'
    ELSE 'Team member'
  END;

  -- Insert notification
  INSERT INTO public.notifications (
    user_id,
    type,
    data
  ) VALUES (
    NEW.user_profile_id,
    'business_team_added',
    jsonb_build_object(
      'business_id', NEW.business_id,
      'business_name', v_business_name,
      'role', v_role_display,
      'entity_type', 'business',
      'entity_id', NEW.business_id
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_notify_business_team_added ON public.business_team_members;
CREATE TRIGGER trg_notify_business_team_added
AFTER INSERT ON public.business_team_members
FOR EACH ROW
EXECUTE FUNCTION public.notify_business_team_added();