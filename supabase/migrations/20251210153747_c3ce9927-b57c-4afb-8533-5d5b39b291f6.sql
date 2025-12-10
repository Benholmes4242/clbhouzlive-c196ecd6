-- Create admin function to set test user profile photo
CREATE OR REPLACE FUNCTION public.admin_set_test_user_photo(p_photo_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_profiles 
  SET profile_photo_url = p_photo_url
  WHERE is_test = true;
END;
$$;

-- Grant execute to authenticated users (admin functions should have their own checks)
GRANT EXECUTE ON FUNCTION public.admin_set_test_user_photo(text) TO authenticated;