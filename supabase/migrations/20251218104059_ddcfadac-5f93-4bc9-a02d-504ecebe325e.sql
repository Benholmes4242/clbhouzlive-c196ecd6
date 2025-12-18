-- Fix notify_business_team_added trigger to include required title field
CREATE OR REPLACE FUNCTION public.notify_business_team_added()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_business_name text;
  v_role_display text;
  v_title text;
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

  -- Build title
  v_title := 'Added to ' || v_business_name;

  -- Insert notification with required title field
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    data
  ) VALUES (
    NEW.user_profile_id,
    'business_team_added',
    v_title,
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
$function$;