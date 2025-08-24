-- Fix the mobile crop function to use correct column name
CREATE OR REPLACE FUNCTION public.update_mobile_crop_data(p_user_id uuid, p_crop_x numeric, p_crop_y numeric, p_crop_width numeric, p_crop_height numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE user_profiles 
  SET 
    mobile_crop_x = p_crop_x,
    mobile_crop_y = p_crop_y,
    mobile_crop_width = p_crop_width,
    mobile_crop_height = p_crop_height,
    updated_at = NOW()
  WHERE id = p_user_id;  -- Changed from user_id to id
END;
$function$