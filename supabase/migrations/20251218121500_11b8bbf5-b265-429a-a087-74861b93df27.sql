-- Update existing business notifications to include current business avatar
-- This fixes notifications created before the logo was uploaded

UPDATE public.notifications n
SET data = n.data || jsonb_build_object(
  'business_avatar_url', ba.logo_url,
  'entity_avatar_url', ba.logo_url
)
FROM public.business_accounts ba
WHERE n.data->>'business_id' IS NOT NULL
  AND ba.id = (n.data->>'business_id')::uuid
  AND ba.logo_url IS NOT NULL
  AND (n.data->>'entity_avatar_url' IS NULL OR n.data->>'business_avatar_url' IS NULL);

-- Update notify_business_team_added to include business avatar
CREATE OR REPLACE FUNCTION public.notify_business_team_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_business_name text;
  v_business_logo text;
  v_role_display text;
  v_title text;
BEGIN
  -- Get business name and logo
  SELECT COALESCE(ba.name, ba.club_name, 'a business'), ba.logo_url
  INTO v_business_name, v_business_logo
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

  -- Insert notification with business avatar
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    data
  ) VALUES (
    NEW.user_profile_id,
    'business_member_added',
    v_title,
    jsonb_build_object(
      'business_id', NEW.business_id,
      'business_name', v_business_name,
      'business_avatar_url', v_business_logo,
      'entity_name', v_business_name,
      'entity_avatar_url', v_business_logo,
      'role', v_role_display,
      'entity_type', 'business',
      'entity_id', NEW.business_id
    )
  );

  RETURN NEW;
END;
$function$;